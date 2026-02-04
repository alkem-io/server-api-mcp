import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface UpdatePostInput {
  ID: string;
  displayName?: string;
  description?: string;
  nameID?: string;
}

interface UpdatePostResponse {
  updatePost: {
    id: string;
    nameID: string;
    profile: {
      displayName: string;
    };
  };
}

class UpdatePostTool extends MCPTool<UpdatePostInput> {
  name = "alkemio.posts.updatePost";
  description = "Updates an existing Alkemio Post.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the Post to update",
    },
    displayName: {
      type: z.string().min(1).max(100).optional(),
      description: "The new display name for the Post",
    },
    description: {
      type: z.string().optional(),
      description: "The new description/content of the Post",
    },
    nameID: {
      type: z.string().regex(/^[a-z0-9-]+$/).optional(),
      description: "The new nameID (lowercase, numbers, hyphens only)",
    },
  };

  async execute(input: UpdatePostInput) {
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
      mutation UpdatePost($postData: UpdatePostInput!) {
        updatePost(postData: $postData) {
          id
          nameID
          profile {
            displayName
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

      const postData: any = {
        ID: input.ID,
      };

      if (input.nameID !== undefined) {
        postData.nameID = input.nameID;
      }

      const profileData: any = {};
      let hasProfileUpdate = false;

      if (input.displayName !== undefined) {
        profileData.displayName = input.displayName;
        hasProfileUpdate = true;
      }
      if (input.description !== undefined) {
        profileData.description = input.description;
        hasProfileUpdate = true;
      }

      if (hasProfileUpdate) {
        postData.profileData = profileData;
      }

      const responseData = await graphQLClient.request<UpdatePostResponse>(mutation, {
        postData,
      });

      return {
        success: true,
        post: {
          id: responseData.updatePost.id,
          nameID: responseData.updatePost.nameID,
          displayName: responseData.updatePost.profile.displayName,
        },
      };
    } catch (error: any) {
      console.error("Error updating Alkemio post:", error);
      throw new Error(`Failed to update Alkemio post: ${error.message}`);
    }
  }
}

export default UpdatePostTool;
