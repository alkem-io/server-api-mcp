import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface GetSpaceInput {
  ID: string;
}

interface GetSpaceResponse {
  lookup: {
    space: {
      id: string;
      nameID: string;
      visibility: string;
      level: string;
      about: {
        profile: {
          displayName: string;
          description?: string;
          tagline?: string;
        };
        why?: string;
        who?: string;
      };
      account: {
        id: string;
      };
    } | null;
  };
}

class GetSpaceTool extends MCPTool<GetSpaceInput> {
  name = "alkemio.spaces.getSpace";
  description = "Retrieves a specific Alkemio Space by its ID.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the Space to retrieve",
    },
  };

  async execute(input: GetSpaceInput) {
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
      query GetSpace($ID: UUID!) {
        lookup {
          space(ID: $ID) {
            id
            nameID
            visibility
            level
            about {
              profile {
                displayName
                description
                tagline
              }
              why
              who
            }
            account {
              id
            }
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

      const responseData = await graphQLClient.request<GetSpaceResponse>(query, { ID: input.ID });

      if (responseData.lookup.space) {
        const space = responseData.lookup.space;
        return {
          id: space.id,
          nameID: space.nameID,
          visibility: space.visibility,
          level: space.level,
          displayName: space.about.profile.displayName,
          description: space.about.profile.description,
          tagline: space.about.profile.tagline,
          why: space.about.why,
          who: space.about.who,
          accountId: space.account.id,
        };
      } else {
        return { error: `Space with ID '${input.ID}' not found.` };
      }
    } catch (error: any) {
      console.error("Error fetching Alkemio space:", error);
      throw new Error(`Failed to retrieve Alkemio space: ${error.message}`);
    }
  }
}

export default GetSpaceTool;
