import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface DeleteWhiteboardInput {
  ID: string;
}

interface DeleteWhiteboardResponse {
  deleteWhiteboard: {
    id: string;
    nameID: string;
  };
}

class DeleteWhiteboardTool extends MCPTool<DeleteWhiteboardInput> {
  name = "alkemio.whiteboards.deleteWhiteboard";
  description = "Deletes an existing Alkemio Whiteboard by its ID.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the Whiteboard to delete",
    },
  };

  async execute(input: DeleteWhiteboardInput) {
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
      mutation DeleteWhiteboard($whiteboardData: DeleteWhiteboardInput!) {
        deleteWhiteboard(whiteboardData: $whiteboardData) {
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

      const responseData = await graphQLClient.request<DeleteWhiteboardResponse>(mutation, {
        whiteboardData: {
          ID: input.ID,
        },
      });

      return {
        success: true,
        deletedWhiteboard: {
          id: responseData.deleteWhiteboard.id,
          nameID: responseData.deleteWhiteboard.nameID,
        },
      };
    } catch (error: any) {
      console.error("Error deleting Alkemio whiteboard:", error);
      throw new Error(`Failed to delete Alkemio whiteboard: ${error.message}`);
    }
  }
}

export default DeleteWhiteboardTool;
