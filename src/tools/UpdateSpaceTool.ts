import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface UpdateSpaceInput {
  ID: string;
  displayName?: string;
  description?: string;
  tagline?: string;
  why?: string;
  who?: string;
}

interface UpdateSpaceResponse {
  updateSpace: {
    id: string;
    nameID: string;
    about: {
      profile: {
        displayName: string;
      };
    };
  };
}

class UpdateSpaceTool extends MCPTool<UpdateSpaceInput> {
  name = "alkemio.spaces.updateSpace";
  description = "Updates an existing Alkemio Space.";

  schema = {
    ID: {
      type: z.string().uuid(),
      description: "The UUID of the Space to update",
    },
    displayName: {
      type: z.string().min(1).max(100).optional(),
      description: "The new display name for the Space",
    },
    description: {
      type: z.string().optional(),
      description: "The new description for the Space",
    },
    tagline: {
      type: z.string().optional(),
      description: "The new tagline for the Space",
    },
    why: {
      type: z.string().optional(),
      description: "The new goal/purpose for the Space",
    },
    who: {
      type: z.string().optional(),
      description: "Who should get involved in this Space",
    },
  };

  async execute(input: UpdateSpaceInput) {
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
      mutation UpdateSpace($spaceData: UpdateSpaceInput!) {
        updateSpace(spaceData: $spaceData) {
          id
          nameID
          about {
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

      const spaceData: any = {
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
      if (input.tagline !== undefined) {
        profileData.tagline = input.tagline;
        hasProfileUpdate = true;
      }

      const aboutData: any = {};
      let hasAboutUpdate = false;

      if (hasProfileUpdate) {
        aboutData.profile = profileData;
        hasAboutUpdate = true;
      }
      if (input.why !== undefined) {
        aboutData.why = input.why;
        hasAboutUpdate = true;
      }
      if (input.who !== undefined) {
        aboutData.who = input.who;
        hasAboutUpdate = true;
      }

      if (hasAboutUpdate) {
        spaceData.about = aboutData;
      }

      const responseData = await graphQLClient.request<UpdateSpaceResponse>(mutation, {
        spaceData,
      });

      return {
        success: true,
        space: {
          id: responseData.updateSpace.id,
          nameID: responseData.updateSpace.nameID,
          displayName: responseData.updateSpace.about.profile.displayName,
        },
      };
    } catch (error: any) {
      console.error("Error updating Alkemio space:", error);
      throw new Error(`Failed to update Alkemio space: ${error.message}`);
    }
  }
}

export default UpdateSpaceTool;
