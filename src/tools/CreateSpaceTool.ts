import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface CreateSpaceInput {
  accountID: string;
  displayName: string;
  nameID?: string;
  description?: string;
  tagline?: string;
  tags?: string[];
  why?: string;
  who?: string;
  licensePlanID?: string;
}

interface CreateSpaceResponse {
  createSpace: {
    id: string;
    nameID: string;
    about: {
      profile: {
        displayName: string;
      };
    };
  };
}

class CreateSpaceTool extends MCPTool<CreateSpaceInput> {
  name = "alkemio.spaces.createSpace";
  description = "Creates a new Level Zero Space within the specified Account.";

  schema = {
    accountID: {
      type: z.string().uuid(),
      description: "The UUID of the Account where the Space will be created",
    },
    displayName: {
      type: z.string().min(1).max(100),
      description: "The display name for the Space",
    },
    nameID: {
      type: z.string().regex(/^[a-z0-9-]+$/).optional(),
      description: "A readable identifier (lowercase, numbers, hyphens only)",
    },
    description: {
      type: z.string().optional(),
      description: "A description of the Space",
    },
    tagline: {
      type: z.string().optional(),
      description: "A short memorable tagline for the Space",
    },
    tags: {
      type: z.array(z.string()).optional(),
      description: "Tags to associate with the Space",
    },
    why: {
      type: z.string().optional(),
      description: "The goal or purpose of the Space",
    },
    who: {
      type: z.string().optional(),
      description: "Who should get involved in this Space",
    },
    licensePlanID: {
      type: z.string().uuid().optional(),
      description: "The license plan to use for the Space",
    },
  };

  async execute(input: CreateSpaceInput) {
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
      mutation CreateSpace($spaceData: CreateSpaceOnAccountInput!) {
        createSpace(spaceData: $spaceData) {
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
        accountID: input.accountID,
        about: {
          profileData: {
            displayName: input.displayName,
            description: input.description,
            tagline: input.tagline,
            tags: input.tags,
          },
          why: input.why,
          who: input.who,
        },
        collaborationData: {},
      };

      if (input.nameID) {
        spaceData.nameID = input.nameID;
      }

      if (input.licensePlanID) {
        spaceData.licensePlanID = input.licensePlanID;
      }

      const responseData = await graphQLClient.request<CreateSpaceResponse>(mutation, {
        spaceData,
      });

      return {
        success: true,
        space: {
          id: responseData.createSpace.id,
          nameID: responseData.createSpace.nameID,
          displayName: responseData.createSpace.about.profile.displayName,
        },
      };
    } catch (error: any) {
      console.error("Error creating Alkemio space:", error);
      throw new Error(`Failed to create Alkemio space: ${error.message}`);
    }
  }
}

export default CreateSpaceTool;
