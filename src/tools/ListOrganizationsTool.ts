import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface ListOrganizationsInput {
  limit?: number;
  shuffle?: boolean;
}

interface AlkemioOrganization {
  id: string;
  nameID: string;
  profile: {
    displayName: string;
    description?: string;
    tagline?: string;
  };
}

interface ListOrganizationsResponse {
  organizations: AlkemioOrganization[];
}

class ListOrganizationsTool extends MCPTool<ListOrganizationsInput> {
  name = "alkemio_organizations_list";
  description = "Retrieves a list of Alkemio Organizations on the platform.";

  schema = {
    limit: {
      type: z.number().optional(),
      description: "Maximum number of organizations to return",
    },
    shuffle: {
      type: z.boolean().optional(),
      description: "If true and limit is specified, return a random selection",
    },
  };

  async execute(input: ListOrganizationsInput) {
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
      query ListOrganizations($limit: Float, $shuffle: Boolean) {
        organizations(limit: $limit, shuffle: $shuffle) {
          id
          nameID
          profile {
            displayName
            description
            tagline
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

      const responseData = await graphQLClient.request<ListOrganizationsResponse>(query, {
        limit: input.limit,
        shuffle: input.shuffle,
      });

      return responseData.organizations.map((org: AlkemioOrganization) => ({
        id: org.id,
        nameID: org.nameID,
        displayName: org.profile.displayName,
        description: org.profile.description,
        tagline: org.profile.tagline,
      }));
    } catch (error: any) {
      console.error("Error fetching Alkemio organizations:", error);
      throw new Error(`Failed to retrieve Alkemio organizations: ${error.message}`);
    }
  }
}

export default ListOrganizationsTool;
