import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AdminPruneNotificationsInput {}

interface AdminPruneNotificationsResponse {
  adminInAppNotificationsPrune: {
    count: number;
  };
}

class AdminPruneNotificationsTool extends MCPTool<AdminPruneNotificationsInput> {
  name = "alkemio.admin.pruneNotifications";
  description = "Prunes InAppNotifications according to the platform defined criteria.";

  schema = {};

  async execute(input: AdminPruneNotificationsInput) {
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
      mutation AdminInAppNotificationsPrune {
        adminInAppNotificationsPrune {
          count
        }
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AdminPruneNotificationsResponse>(mutation);

      return {
        success: true,
        prunedCount: responseData.adminInAppNotificationsPrune.count,
      };
    } catch (error: any) {
      console.error("Error pruning notifications:", error);
      throw new Error(`Failed to prune notifications: ${error.message}`);
    }
  }
}

export default AdminPruneNotificationsTool;
