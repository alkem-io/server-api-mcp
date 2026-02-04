import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface CreateWhiteboardInput {
  calloutID: string;
  displayName: string;
  description?: string;
  nameID?: string;
  content?: string;
}

interface CreateWhiteboardResponse {
  createContributionOnCallout: {
    id: string;
    whiteboard?: {
      id: string;
      nameID: string;
      profile: {
        displayName: string;
      };
    };
  };
}

class CreateWhiteboardTool extends MCPTool<CreateWhiteboardInput> {
  name = "alkemio.whiteboards.createWhiteboard";
  description = "Creates a new Whiteboard as a contribution on a Callout.";

  schema = {
    calloutID: {
      type: z.string().uuid(),
      description: "The UUID of the Callout to add the Whiteboard to",
    },
    displayName: {
      type: z.string().min(1).max(100),
      description: "The display name for the Whiteboard",
    },
    description: {
      type: z.string().optional(),
      description: "A description of the Whiteboard",
    },
    nameID: {
      type: z.string().regex(/^[a-z0-9-]+$/).optional(),
      description: "A readable identifier (lowercase, numbers, hyphens only)",
    },
    content: {
      type: z.string().optional(),
      description: "The JSON content of the Whiteboard",
    },
  };

  async execute(input: CreateWhiteboardInput) {
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
      mutation CreateWhiteboard($contributionData: CreateContributionOnCalloutInput!) {
        createContributionOnCallout(contributionData: $contributionData) {
          id
          whiteboard {
            id
            nameID
            profile {
              displayName
            }
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
        profile: {
          displayName: input.displayName,
          description: input.description,
        },
      };

      if (input.nameID) {
        whiteboardData.nameID = input.nameID;
      }

      if (input.content) {
        whiteboardData.content = input.content;
      }

      const contributionData = {
        calloutID: input.calloutID,
        type: "WHITEBOARD",
        whiteboard: whiteboardData,
      };

      const responseData = await graphQLClient.request<CreateWhiteboardResponse>(mutation, {
        contributionData,
      });

      return {
        success: true,
        contribution: {
          id: responseData.createContributionOnCallout.id,
          whiteboard: responseData.createContributionOnCallout.whiteboard ? {
            id: responseData.createContributionOnCallout.whiteboard.id,
            nameID: responseData.createContributionOnCallout.whiteboard.nameID,
            displayName: responseData.createContributionOnCallout.whiteboard.profile.displayName,
          } : null,
        },
      };
    } catch (error: any) {
      console.error("Error creating Alkemio whiteboard:", error);
      throw new Error(`Failed to create Alkemio whiteboard: ${error.message}`);
    }
  }
}

export default CreateWhiteboardTool;
