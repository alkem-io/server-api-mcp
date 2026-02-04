import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface GetOrganizationInput {
  ID: string;
}

interface GetOrganizationResponse {
  organization: {
    id: string;
    nameID: string;
    profile: {
      displayName: string;
      description?: string;
      tagline?: string;
      url: string;
    };
    verification: {
      status: string;
    };
    agent: {
      id: string;
    };
  };
}

class GetOrganizationTool extends MCPTool<GetOrganizationInput> {
  name = "alkemio.organizations.getOrganization";
  description = "Retrieves a specific Alkemio Organization by its ID.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the Organization to retrieve",
    },
  };

  async execute(input: GetOrganizationInput) {
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
      query GetOrganization($ID: UUID!) {
        organization(ID: $ID) {
          id
          nameID
          profile {
            displayName
            description
            tagline
            url
          }
          verification {
            status
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

      const responseData = await graphQLClient.request<GetOrganizationResponse>(query, { ID: input.ID });

      const org = responseData.organization;
      return {
        id: org.id,
        nameID: org.nameID,
        displayName: org.profile.displayName,
        description: org.profile.description,
        tagline: org.profile.tagline,
        url: org.profile.url,
        verificationStatus: org.verification.status,
        agentId: org.agent.id,
      };
    } catch (error: any) {
      console.error("Error fetching Alkemio organization:", error);
      throw new Error(`Failed to retrieve Alkemio organization: ${error.message}`);
    }
  }
}

export default GetOrganizationTool;
