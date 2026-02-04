import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface UpdateWhiteboardInput {
  ID: string;
  displayName?: string;
  description?: string;
  content?: string;
  contentUpdatePolicy?: string;
}

interface UpdateWhiteboardResponse {
  updateWhiteboard: {
    id: string;
    nameID: string;
    profile: {
      displayName: string;
    };
  };
}

class UpdateWhiteboardTool extends MCPTool<UpdateWhiteboardInput> {
  name = "alkemio.whiteboards.updateWhiteboard";
  description = "Updates an existing Alkemio Whiteboard.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the Whiteboard to update",
    },
    displayName: {
      type: z.string().min(1).max(100).optional(),
      description: "The new display name for the Whiteboard",
    },
    description: {
      type: z.string().optional(),
      description: "The new description for the Whiteboard",
    },
    content: {
      type: z.string().optional(),
      description: "The new JSON content of the Whiteboard",
    },
    contentUpdatePolicy: {
      type: z.enum(["ADMINS", "CONTRIBUTORS", "OWNER"]).optional(),
      description: "The content update policy for the Whiteboard",
    },
  };

  async execute(input: UpdateWhiteboardInput) {
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
      mutation UpdateWhiteboard($whiteboardData: UpdateWhiteboardInput!) {
        updateWhiteboard(whiteboardData: $whiteboardData) {
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

      const whiteboardData: any = {
        ID: input.ID,
      };

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
        whiteboardData.profile = profileData;
      }

      if (input.content !== undefined) {
        whiteboardData.content = input.content;
      }

      if (input.contentUpdatePolicy !== undefined) {
        whiteboardData.contentUpdatePolicy = input.contentUpdatePolicy;
      }

      const responseData = await graphQLClient.request<UpdateWhiteboardResponse>(mutation, {
        whiteboardData,
      });

      return {
        success: true,
        whiteboard: {
          id: responseData.updateWhiteboard.id,
          nameID: responseData.updateWhiteboard.nameID,
          displayName: responseData.updateWhiteboard.profile.displayName,
        },
      };
    } catch (error: any) {
      console.error("Error updating Alkemio whiteboard:", error);
      throw new Error(`Failed to update Alkemio whiteboard: ${error.message}`);
    }
  }
}

export default UpdateWhiteboardTool;
