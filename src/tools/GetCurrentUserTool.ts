import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface GetCurrentUserInput {}

interface MeResponse {
  me: {
    id: string;
    mySpaces: Array<{
      space: {
        id: string;
        about: {
          profile: {
            displayName: string;
          };
        };
      };
    }>;
    user?: {
      id: string;
      nameID: string;
      email: string;
      profile: {
        displayName: string;
        description?: string;
        tagline?: string;
      };
    };
  };
}

class GetCurrentUserTool extends MCPTool<GetCurrentUserInput> {
  name = "alkemio.users.getCurrentUser";
  description = "Retrieves information about the currently authenticated user.";

  schema = {};

  async execute(input: GetCurrentUserInput) {
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
      query GetCurrentUser {
        me {
          id
          mySpaces(limit: 10) {
            space {
              id
              about {
                profile {
                  displayName
                }
              }
            }
          }
          user {
            id
            nameID
            email
            profile {
              displayName
              description
              tagline
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

      const responseData = await graphQLClient.request<MeResponse>(query);

      const me = responseData.me;
      return {
        id: me.id,
        user: me.user ? {
          id: me.user.id,
          nameID: me.user.nameID,
          email: me.user.email,
          displayName: me.user.profile.displayName,
          description: me.user.profile.description,
          tagline: me.user.profile.tagline,
        } : null,
        mySpaces: me.mySpaces.map(s => ({
          id: s.space.id,
          displayName: s.space.about.profile.displayName,
        })),
      };
    } catch (error: any) {
      console.error("Error fetching current user info:", error);
      throw new Error(`Failed to retrieve current user info: ${error.message}`);
    }
  }
}

export default GetCurrentUserTool;
