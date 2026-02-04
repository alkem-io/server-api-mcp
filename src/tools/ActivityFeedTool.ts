import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface ActivityFeedInput {
  first?: number;
  last?: number;
  after?: string;
  before?: string;
  types?: string[];
  spaceIds?: string[];
  myActivity?: boolean;
}

interface ActivityLogEntry {
  id: string;
  type: string;
  createdDate: string;
  description: string;
  triggeredBy?: {
    id: string;
    profile: {
      displayName: string;
    };
  };
}

interface ActivityFeedResponse {
  activityFeed: {
    activityFeed: ActivityLogEntry[];
    total: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
}

class ActivityFeedTool extends MCPTool<ActivityFeedInput> {
  name = "alkemio.activity.getActivityFeed";
  description = "Retrieves the activity feed for the current user.";

  schema = {
    first: {
      type: z.number().optional(),
      description: "Number of items to fetch from the start",
    },
    last: {
      type: z.number().optional(),
      description: "Number of items to fetch from the end",
    },
    after: {
      type: z.string().optional(),
      description: "Cursor after which to fetch items",
    },
    before: {
      type: z.string().optional(),
      description: "Cursor before which to fetch items",
    },
    types: {
      type: z.array(z.string()).optional(),
      description: "Filter by activity event types",
    },
    spaceIds: {
      type: z.array(z.string()).optional(),
      description: "Filter by space IDs",
    },
    myActivity: {
      type: z.boolean().optional(),
      description: "If true, only return activities triggered by the current user",
    },
  };

  async execute(input: ActivityFeedInput) {
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
      query GetActivityFeed(
        $first: Int
        $last: Int
        $after: UUID
        $before: UUID
        $args: ActivityFeedQueryArgs
      ) {
        activityFeed(
          first: $first
          last: $last
          after: $after
          before: $before
          args: $args
        ) {
          activityFeed {
            id
            type
            createdDate
            description
            triggeredBy {
              id
              profile {
                displayName
              }
            }
          }
          total
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
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

      const args: any = {};
      if (input.types) args.types = input.types;
      if (input.spaceIds) args.spaceIds = input.spaceIds;
      if (input.myActivity !== undefined) args.myActivity = input.myActivity;

      const responseData = await graphQLClient.request<ActivityFeedResponse>(query, {
        first: input.first,
        last: input.last,
        after: input.after,
        before: input.before,
        args: Object.keys(args).length > 0 ? args : undefined,
      });

      return {
        activities: responseData.activityFeed.activityFeed.map((activity) => ({
          id: activity.id,
          type: activity.type,
          createdDate: activity.createdDate,
          description: activity.description,
          triggeredByDisplayName: activity.triggeredBy?.profile?.displayName,
        })),
        total: responseData.activityFeed.total,
        pageInfo: responseData.activityFeed.pageInfo,
      };
    } catch (error: any) {
      console.error("Error fetching activity feed:", error);
      throw new Error(`Failed to retrieve activity feed: ${error.message}`);
    }
  }
}

export default ActivityFeedTool;
