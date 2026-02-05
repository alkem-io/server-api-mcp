import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AdminDeleteUserAccountInput {
  userID: string;
}

interface AdminDeleteUserAccountResponse {
  adminUserAccountDelete: {
    id: string;
    nameID: string;
    email: string;
  };
}

class AdminDeleteUserAccountTool extends MCPTool<AdminDeleteUserAccountInput> {
  name = "alkemio_admin_deleteUserAccount";
  description = "Removes the Kratos account associated with the specified User. Note: the User's profile on the platform is not deleted.";

  schema = {
    userID: {
      type: z.string().uuid(),
      description: "The UUID of the User whose Kratos account should be deleted",
    },
  };

  async execute(input: AdminDeleteUserAccountInput) {
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
      mutation AdminUserAccountDelete($userID: UUID!) {
        adminUserAccountDelete(userID: $userID) {
          id
          nameID
          email
        }
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AdminDeleteUserAccountResponse>(mutation, {
        userID: input.userID,
      });

      return {
        success: true,
        deletedUser: {
          id: responseData.adminUserAccountDelete.id,
          nameID: responseData.adminUserAccountDelete.nameID,
          email: responseData.adminUserAccountDelete.email,
        },
      };
    } catch (error: any) {
      console.error("Error deleting user account:", error);
      throw new Error(`Failed to delete user account: ${error.message}`);
    }
  }
}

export default AdminDeleteUserAccountTool;
