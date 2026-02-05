import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface ListUsersInput {
  limit?: number;
  shuffle?: boolean;
  IDs?: string;
}

interface AlkemioUser {
  id: string;
  nameID: string;
  email: string;
  profile: {
    displayName: string;
    description?: string;
    tagline?: string;
  };
}

interface ListUsersResponse {
  users: AlkemioUser[];
}

class ListUsersTool extends MCPTool<ListUsersInput> {
  name = "alkemio_users_list";
  description = "Retrieves a list of Alkemio Users on the platform.";

  schema = {
    limit: {
      type: z.number().optional(),
      description: "Maximum number of users to return",
    },
    shuffle: {
      type: z.boolean().optional(),
      description: "If true and limit is specified, return a random selection",
    },
    IDs: {
      type: z.string().optional(),
      description: "Comma-separated user UUIDs to retrieve",
    },
  };

  async execute(input: ListUsersInput) {
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
      query ListUsers($limit: Float, $shuffle: Boolean, $IDs: [UUID!]) {
        users(limit: $limit, shuffle: $shuffle, IDs: $IDs) {
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
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const IDs = input.IDs
        ? input.IDs.split(',').map((id: string) => id.trim()).filter((id: string) => id)
        : undefined;

      const responseData = await graphQLClient.request<ListUsersResponse>(query, {
        limit: input.limit,
        shuffle: input.shuffle,
        IDs,
      });

      return responseData.users.map((user: AlkemioUser) => ({
        id: user.id,
        nameID: user.nameID,
        email: user.email,
        displayName: user.profile.displayName,
        description: user.profile.description,
        tagline: user.profile.tagline,
      }));
    } catch (error: any) {
      console.error("Error fetching Alkemio users:", error);
      throw new Error(`Failed to retrieve Alkemio users: ${error.message}`);
    }
  }
}

export default ListUsersTool;
