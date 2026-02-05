import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface CreateCalloutInput {
  spaceID: string;
  displayName: string;
  description?: string;
  nameID?: string;
  tags?: string;
}

interface SpaceCalloutsSetResponse {
  lookup: {
    space?: {
      collaboration: {
        calloutsSet: {
          id: string;
        };
      };
    };
  };
}

interface CreateCalloutResponse {
  createCalloutOnCalloutsSet: {
    id: string;
    nameID: string;
    framing: {
      profile: {
        displayName: string;
      };
    };
  };
}

class CreateCalloutTool extends MCPTool<CreateCalloutInput> {
  name = "alkemio_callouts_create";
  description = "Creates a new Callout on a Space. The callout will be created in the space's default callouts set.";

  schema = {
    spaceID: {
      type: z.string().uuid(),
      description: "The UUID of the Space to add the Callout to",
    },
    displayName: {
      type: z.string().min(1).max(100),
      description: "The display name for the Callout",
    },
    description: {
      type: z.string().optional(),
      description: "The description/content of the Callout",
    },
    nameID: {
      type: z.string().regex(/^[a-z0-9-]+$/).optional(),
      description: "A readable identifier (lowercase, numbers, hyphens only)",
    },
    tags: {
      type: z.string().optional(),
      description: "Comma-separated tags to associate with the Callout",
    },
  };

  async execute(input: CreateCalloutInput) {
    const alkemioService = getAlkemioService();

    if (!alkemioService.isReady()) {
      throw new Error("Alkemio service is not ready or not authenticated.");
    }

    const apiToken = alkemioService.getApiToken();
    const graphqlEndpoint = alkemioService.getGraphqlEndpoint();

    if (!apiToken || !graphqlEndpoint) {
      throw new Error("Could not retrieve API token or GraphQL endpoint from AlkemioService.");
    }

    const graphQLClient = new GraphQLClient(graphqlEndpoint, {
      headers: {
        authorization: `Bearer ${apiToken}`,
      },
    });

    // First, get the calloutsSetID from the space
    const getCalloutsSetQuery = gql`
      query GetSpaceCalloutsSet($spaceID: UUID!) {
        lookup {
          space(ID: $spaceID) {
            collaboration {
              calloutsSet {
                id
              }
            }
          }
        }
      }
    `;

    try {
      const spaceResponse = await graphQLClient.request<SpaceCalloutsSetResponse>(getCalloutsSetQuery, {
        spaceID: input.spaceID,
      });

      const calloutsSetID = spaceResponse.lookup.space?.collaboration?.calloutsSet?.id;
      if (!calloutsSetID) {
        throw new Error(`Could not find calloutsSet for space ${input.spaceID}`);
      }

      // Now create the callout
      const mutation = gql`
        mutation CreateCallout($calloutData: CreateCalloutOnCalloutsSetInput!) {
          createCalloutOnCalloutsSet(calloutData: $calloutData) {
            id
            nameID
            framing {
              profile {
                displayName
              }
            }
          }
        }
      `;

      const tags = input.tags
        ? input.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        : undefined;

      const calloutData: any = {
        calloutsSetID,
        framing: {
          profile: {
            displayName: input.displayName,
            description: input.description,
          },
          tags,
        },
      };

      if (input.nameID) {
        calloutData.nameID = input.nameID;
      }

      const responseData = await graphQLClient.request<CreateCalloutResponse>(mutation, {
        calloutData,
      });

      return {
        success: true,
        callout: {
          id: responseData.createCalloutOnCalloutsSet.id,
          nameID: responseData.createCalloutOnCalloutsSet.nameID,
          displayName: responseData.createCalloutOnCalloutsSet.framing.profile.displayName,
        },
      };
    } catch (error: any) {
      console.error("Error creating Alkemio callout:", error);
      throw new Error(`Failed to create Alkemio callout: ${error.message}`);
    }
  }
}

export default CreateCalloutTool;
