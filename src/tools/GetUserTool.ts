import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface GetUserInput {
  ID: string;
}

interface GetUserResponse {
  user: {
    id: string;
    nameID: string;
    email: string;
    profile: {
      displayName: string;
      description?: string;
      tagline?: string;
      url: string;
      location?: {
        city?: string;
        country?: string;
      };
    };
    agent: {
      id: string;
    };
  };
}

class GetUserTool extends MCPTool<GetUserInput> {
  name = "alkemio_users_get";
  description = "Retrieves a specific Alkemio User by their ID.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the User to retrieve",
    },
  };

  async execute(input: GetUserInput) {
    const alkemioService = getAlkemioService();

    if (!alkemioService.isReady()) {
      throw new Error("Alkemio service is not ready or not authenticated.");
    }

    const apiToken = alkemioService.getApiToken();
    const graphqlEndpoint = alkemioService.getGraphqlEndpoint();

    if (!apiToken || !graphqlEndpoint) {
      throw new Error("Could not retrieve API token or GraphQL endpoint from AlkemioService.");
    }

    const query = gql`
      query GetUser($ID: UUID!) {
        user(ID: $ID) {
          id
          nameID
          email
          profile {
            displayName
            description
            tagline
            url
            location {
              city
              country
            }
          }
          agent {
            id
          }
        }
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<GetUserResponse>(query, { ID: input.ID });

      const user = responseData.user;
      return {
        id: user.id,
        nameID: user.nameID,
        email: user.email,
        displayName: user.profile.displayName,
        description: user.profile.description,
        tagline: user.profile.tagline,
        url: user.profile.url,
        city: user.profile.location?.city,
        country: user.profile.location?.country,
        agentId: user.agent.id,
      };
    } catch (error: any) {
      console.error("Error fetching Alkemio user:", error);
      throw new Error(`Failed to retrieve Alkemio user: ${error.message}`);
    }
  }
}

export default GetUserTool;
