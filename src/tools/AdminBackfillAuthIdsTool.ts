import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AdminBackfillAuthIdsInput {}

interface AdminBackfillAuthIdsResponse {
  adminBackfillAuthenticationIDs: {
    result: boolean;
  };
}

class AdminBackfillAuthIdsTool extends MCPTool<AdminBackfillAuthIdsInput> {
  name = "alkemio.admin.backfillAuthenticationIDs";
  description = "Populates authenticationID for existing users by querying Kratos Admin API.";

  schema = {};

  async execute(input: AdminBackfillAuthIdsInput) {
    const alkemioService = getAlkemioService();

    if (!alkemioService.isReady()) {
      throw new Error("Alkemio service is not ready or not authenticated.");
    }

    const apiToken = alkemioService.getApiToken();
    const graphqlEndpoint = alkemioService.getGraphqlEndpoint();

    if (!apiToken || !graphqlEndpoint) {
      throw new Error("Could not retrieve API token or GraphQL endpoint from AlkemioService.");
    }

    const mutation = gql`
      mutation AdminBackfillAuthenticationIDs {
        adminBackfillAuthenticationIDs {
          result
        }
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AdminBackfillAuthIdsResponse>(mutation);

      return {
        success: true,
        result: responseData.adminBackfillAuthenticationIDs.result,
      };
    } catch (error: any) {
      console.error("Error backfilling authentication IDs:", error);
      throw new Error(`Failed to backfill authentication IDs: ${error.message}`);
    }
  }
}

export default AdminBackfillAuthIdsTool;
