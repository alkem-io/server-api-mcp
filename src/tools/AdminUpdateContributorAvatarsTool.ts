import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AdminUpdateContributorAvatarsInput {
  profileID: string;
}

interface AdminUpdateContributorAvatarsResponse {
  adminUpdateContributorAvatars: {
    id: string;
    displayName: string;
  };
}

class AdminUpdateContributorAvatarsTool extends MCPTool<AdminUpdateContributorAvatarsInput> {
  name = "alkemio_admin_updateContributorAvatars";
  description = "Updates the Avatar on the Profile with the specified profileID to be stored as a Document.";

  schema = {
    profileID: {
      type: z.string().uuid(),
      description: "The UUID of the Profile to update avatars for",
    },
  };

  async execute(input: AdminUpdateContributorAvatarsInput) {
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
      mutation AdminUpdateContributorAvatars($profileID: UUID!) {
        adminUpdateContributorAvatars(profileID: $profileID) {
          id
          displayName
        }
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AdminUpdateContributorAvatarsResponse>(mutation, {
        profileID: input.profileID,
      });

      return {
        success: true,
        profile: {
          id: responseData.adminUpdateContributorAvatars.id,
          displayName: responseData.adminUpdateContributorAvatars.displayName,
        },
      };
    } catch (error: any) {
      console.error("Error updating contributor avatars:", error);
      throw new Error(`Failed to update contributor avatars: ${error.message}`);
    }
  }
}

export default AdminUpdateContributorAvatarsTool;
