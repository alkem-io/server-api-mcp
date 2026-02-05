import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface ListCalloutsInput {
  spaceID: string;
  limit?: number;
}

interface Callout {
  id: string;
  nameID: string;
  type: string;
  framing: {
    profile: {
      displayName: string;
      description?: string;
    };
  };
}

interface ListCalloutsResponse {
  lookup: {
    space?: {
      collaboration: {
        calloutsSet: {
          callouts: Callout[];
        };
      };
    };
  };
}

class ListCalloutsTool extends MCPTool<ListCalloutsInput> {
  name = "alkemio_callouts_list";
  description = "Lists all Callouts in a Space.";

  schema = {
    spaceID: {
      type: z.string().uuid(),
      description: "The UUID of the Space to list Callouts from",
    },
    limit: {
      type: z.number().optional(),
      description: "Maximum number of callouts to return",
    },
  };

  async execute(input: ListCalloutsInput) {
    const alkemioService = getAlkemioService();

    if (!alkemioService.isReady()) {
      throw new Error("Alkemio service is not ready or not authenticated.");
    }

    const apiToken = alkemioService.getApiToken();
    const graphqlEndpoint = alkemioService.getGraphqlEndpoint();

    if (!apiToken || !graphqlEndpoint) {
      throw new Error("Could not retrieve API token or GraphQL endpoint from AlkemioService.");
    }

    const query = gql`
      query ListCallouts($spaceID: UUID!, $limit: Float) {
        lookup {
          space(ID: $spaceID) {
            collaboration {
              calloutsSet {
                callouts(limit: $limit) {
                  id
                  nameID
                  type
                  framing {
                    profile {
                      displayName
                      description
                    }
                  }
                }
              }
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

      const responseData = await graphQLClient.request<ListCalloutsResponse>(query, {
        spaceID: input.spaceID,
        limit: input.limit,
      });

      const callouts = responseData.lookup.space?.collaboration?.calloutsSet?.callouts || [];

      return callouts.map((callout: Callout) => ({
        id: callout.id,
        nameID: callout.nameID,
        type: callout.type,
        displayName: callout.framing.profile.displayName,
        description: callout.framing.profile.description,
      }));
    } catch (error: any) {
      console.error("Error listing Alkemio callouts:", error);
      throw new Error(`Failed to list Alkemio callouts: ${error.message}`);
    }
  }
}

export default ListCalloutsTool;
