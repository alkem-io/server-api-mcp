import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AdminEnsureCommunicationsAccessInput {
  communityID: string;
}

interface AdminEnsureCommunicationsAccessResponse {
  adminCommunicationEnsureAccessToCommunications: boolean;
}

class AdminEnsureCommunicationsAccessTool extends MCPTool<AdminEnsureCommunicationsAccessInput> {
  name = "alkemio.admin.ensureCommunicationsAccess";
  description = "Ensures all community members are registered for communications.";

  schema = {
    communityID: {
      type: z.string().uuid(),
      description: "The UUID of the Community to ensure communications access for",
    },
  };

  async execute(input: AdminEnsureCommunicationsAccessInput) {
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
      mutation AdminCommunicationEnsureAccessToCommunications($communicationData: CommunicationAdminEnsureAccessInput!) {
        adminCommunicationEnsureAccessToCommunications(communicationData: $communicationData)
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AdminEnsureCommunicationsAccessResponse>(mutation, {
        communicationData: {
          communityID: input.communityID,
        },
      });

      return {
        success: true,
        result: responseData.adminCommunicationEnsureAccessToCommunications,
      };
    } catch (error: any) {
      console.error("Error ensuring communications access:", error);
      throw new Error(`Failed to ensure communications access: ${error.message}`);
    }
  }
}

export default AdminEnsureCommunicationsAccessTool;
