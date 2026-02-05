import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface DeleteSpaceInput {
  ID: string;
}

interface DeleteSpaceResponse {
  deleteSpace: {
    id: string;
    nameID: string;
  };
}

class DeleteSpaceTool extends MCPTool<DeleteSpaceInput> {
  name = "alkemio_spaces_delete";
  description = "Deletes an existing Alkemio Space by its ID.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the Space to delete",
    },
  };

  async execute(input: DeleteSpaceInput) {
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
      mutation DeleteSpace($deleteData: DeleteSpaceInput!) {
        deleteSpace(deleteData: $deleteData) {
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

      const responseData = await graphQLClient.request<DeleteSpaceResponse>(mutation, {
        deleteData: {
          ID: input.ID,
        },
      });

      return {
        success: true,
        deletedSpace: {
          id: responseData.deleteSpace.id,
          nameID: responseData.deleteSpace.nameID,
        },
      };
    } catch (error: any) {
      console.error("Error deleting Alkemio space:", error);
      throw new Error(`Failed to delete Alkemio space: ${error.message}`);
    }
  }
}

export default DeleteSpaceTool;
