import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface DeletePostInput {
  ID: string;
}

interface DeletePostResponse {
  deletePost: {
    id: string;
    nameID: string;
  };
}

class DeletePostTool extends MCPTool<DeletePostInput> {
  name = "alkemio_posts_delete";
  description = "Deletes an existing Alkemio Post by its ID.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the Post to delete",
    },
  };

  async execute(input: DeletePostInput) {
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
      mutation DeletePost($deleteData: DeletePostInput!) {
        deletePost(deleteData: $deleteData) {
          id
          nameID
        }
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<DeletePostResponse>(mutation, {
        deleteData: {
          ID: input.ID,
        },
      });

      return {
        success: true,
        deletedPost: {
          id: responseData.deletePost.id,
          nameID: responseData.deletePost.nameID,
        },
      };
    } catch (error: any) {
      console.error("Error deleting Alkemio post:", error);
      throw new Error(`Failed to delete Alkemio post: ${error.message}`);
    }
  }
}

export default DeletePostTool;
