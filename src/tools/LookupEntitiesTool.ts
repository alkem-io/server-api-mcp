import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface LookupEntitiesInput {
  spaceId?: string;
  accountId?: string;
  organizationId?: string;
  userId?: string;
  postId?: string;
  whiteboardId?: string;
  calloutId?: string;
}

interface LookupResponse {
  lookup: {
    space?: { id: string; nameID: string; about: { profile: { displayName: string } } };
    account?: { id: string; type?: string };
    organization?: { id: string; nameID: string; profile: { displayName: string } };
    post?: { id: string; nameID: string; profile: { displayName: string } };
    whiteboard?: { id: string; nameID: string; profile: { displayName: string } };
    callout?: { id: string; nameID: string };
  };
}

class LookupEntitiesTool extends MCPTool<LookupEntitiesInput> {
  name = "alkemio.lookup.lookupEntities";
  description = "Lookup specific entities by their IDs. Provide at least one entity ID to look up.";

  schema = {
    spaceId: {
      type: z.string().uuid().optional(),
      description: "UUID of a Space to look up",
    },
    accountId: {
      type: z.string().uuid().optional(),
      description: "UUID of an Account to look up",
    },
    organizationId: {
      type: z.string().uuid().optional(),
      description: "UUID of an Organization to look up",
    },
    userId: {
      type: z.string().uuid().optional(),
      description: "UUID of a User to look up",
    },
    postId: {
      type: z.string().uuid().optional(),
      description: "UUID of a Post to look up",
    },
    whiteboardId: {
      type: z.string().uuid().optional(),
      description: "UUID of a Whiteboard to look up",
    },
    calloutId: {
      type: z.string().uuid().optional(),
      description: "UUID of a Callout to look up",
    },
  };

  async execute(input: LookupEntitiesInput) {
    const alkemioService = getAlkemioService();

    if (!alkemioService.isReady()) {
      throw new Error("Alkemio service is not ready or not authenticated.");
    }

    const apiToken = alkemioService.getApiToken();
    const graphqlEndpoint = alkemioService.getGraphqlEndpoint();

    if (!apiToken || !graphqlEndpoint) {
      throw new Error("Could not retrieve API token or GraphQL endpoint from AlkemioService.");
    }

    // Build dynamic query based on provided IDs
    const queryParts: string[] = [];
    const variables: Record<string, string> = {};
    const variableDefs: string[] = [];

    if (input.spaceId) {
      variableDefs.push("$spaceId: UUID!");
      queryParts.push(`
        space(ID: $spaceId) {
          id
          nameID
          about {
            profile {
              displayName
            }
          }
        }
      `);
      variables.spaceId = input.spaceId;
    }

    if (input.accountId) {
      variableDefs.push("$accountId: UUID!");
      queryParts.push(`
        account(ID: $accountId) {
          id
          type
        }
      `);
      variables.accountId = input.accountId;
    }

    if (input.organizationId) {
      variableDefs.push("$organizationId: UUID!");
      queryParts.push(`
        organization(ID: $organizationId) {
          id
          nameID
          profile {
            displayName
          }
        }
      `);
      variables.organizationId = input.organizationId;
    }

    if (input.postId) {
      variableDefs.push("$postId: UUID!");
      queryParts.push(`
        post(ID: $postId) {
          id
          nameID
          profile {
            displayName
          }
        }
      `);
      variables.postId = input.postId;
    }

    if (input.whiteboardId) {
      variableDefs.push("$whiteboardId: UUID!");
      queryParts.push(`
        whiteboard(ID: $whiteboardId) {
          id
          nameID
          profile {
            displayName
          }
        }
      `);
      variables.whiteboardId = input.whiteboardId;
    }

    if (input.calloutId) {
      variableDefs.push("$calloutId: UUID!");
      queryParts.push(`
        callout(ID: $calloutId) {
          id
          nameID
        }
      `);
      variables.calloutId = input.calloutId;
    }

    if (queryParts.length === 0) {
      return { message: "No entity IDs provided. Please provide at least one ID to look up." };
    }

    const query = gql`
      query LookupEntities(${variableDefs.join(", ")}) {
        lookup {
          ${queryParts.join("\n")}
        }
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<LookupResponse>(query, variables);

      const result: Record<string, any> = {};

      if (responseData.lookup.space) {
        result.space = {
          id: responseData.lookup.space.id,
          nameID: responseData.lookup.space.nameID,
          displayName: responseData.lookup.space.about.profile.displayName,
        };
      }

      if (responseData.lookup.account) {
        result.account = {
          id: responseData.lookup.account.id,
          type: responseData.lookup.account.type,
        };
      }

      if (responseData.lookup.organization) {
        result.organization = {
          id: responseData.lookup.organization.id,
          nameID: responseData.lookup.organization.nameID,
          displayName: responseData.lookup.organization.profile.displayName,
        };
      }

      if (responseData.lookup.post) {
        result.post = {
          id: responseData.lookup.post.id,
          nameID: responseData.lookup.post.nameID,
          displayName: responseData.lookup.post.profile.displayName,
        };
      }

      if (responseData.lookup.whiteboard) {
        result.whiteboard = {
          id: responseData.lookup.whiteboard.id,
          nameID: responseData.lookup.whiteboard.nameID,
          displayName: responseData.lookup.whiteboard.profile.displayName,
        };
      }

      if (responseData.lookup.callout) {
        result.callout = {
          id: responseData.lookup.callout.id,
          nameID: responseData.lookup.callout.nameID,
        };
      }

      return result;
    } catch (error: any) {
      console.error("Error looking up entities:", error);
      throw new Error(`Failed to lookup entities: ${error.message}`);
    }
  }
}

export default LookupEntitiesTool;
