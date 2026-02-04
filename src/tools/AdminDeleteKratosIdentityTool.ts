import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AdminDeleteKratosIdentityInput {
  kratosIdentityId: string;
}

interface AdminDeleteKratosIdentityResponse {
  adminIdentityDeleteKratosIdentity: boolean;
}

class AdminDeleteKratosIdentityTool extends MCPTool<AdminDeleteKratosIdentityInput> {
  name = "alkemio.admin.deleteKratosIdentity";
  description = "Deletes a Kratos identity by its ID.";

  schema = {
    kratosIdentityId: {
      type: z.string().uuid(),
      description: "The UUID of the Kratos identity to delete",
    },
  };

  async execute(input: AdminDeleteKratosIdentityInput) {
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
      mutation AdminIdentityDeleteKratosIdentity($kratosIdentityId: UUID!) {
        adminIdentityDeleteKratosIdentity(kratosIdentityId: $kratosIdentityId)
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AdminDeleteKratosIdentityResponse>(mutation, {
        kratosIdentityId: input.kratosIdentityId,
      });

      return {
        success: true,
        deleted: responseData.adminIdentityDeleteKratosIdentity,
      };
    } catch (error: any) {
      console.error("Error deleting Kratos identity:", error);
      throw new Error(`Failed to delete Kratos identity: ${error.message}`);
    }
  }
}

export default AdminDeleteKratosIdentityTool;
