import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AddNotificationEmailBlacklistInput {
  email: string;
}

interface AddNotificationEmailBlacklistResponse {
  addNotificationEmailToBlacklist: string[];
}

class AddNotificationEmailBlacklistTool extends MCPTool<AddNotificationEmailBlacklistInput> {
  name = "alkemio.admin.addNotificationEmailToBlacklist";
  description = "Adds a full email address to the platform notification blacklist.";

  schema = {
    email: {
      type: z.string().email(),
      description: "The email address to add to the notification blacklist",
    },
  };

  async execute(input: AddNotificationEmailBlacklistInput) {
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
      mutation AddNotificationEmailToBlacklist($input: NotificationEmailAddressInput!) {
        addNotificationEmailToBlacklist(input: $input)
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AddNotificationEmailBlacklistResponse>(mutation, {
        input: {
          email: input.email,
        },
      });

      return {
        success: true,
        blacklistedEmails: responseData.addNotificationEmailToBlacklist,
      };
    } catch (error: any) {
      console.error("Error adding email to blacklist:", error);
      throw new Error(`Failed to add email to blacklist: ${error.message}`);
    }
  }
}

export default AddNotificationEmailBlacklistTool;
