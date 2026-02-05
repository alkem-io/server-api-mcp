import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface CreatePostInput {
  calloutID: string;
  displayName: string;
  description?: string;
  nameID?: string;
  tags?: string;
}

interface CreatePostResponse {
  createContributionOnCallout: {
    id: string;
    post?: {
      id: string;
      nameID: string;
      profile: {
        displayName: string;
      };
    };
  };
}

class CreatePostTool extends MCPTool<CreatePostInput> {
  name = "alkemio_posts_create";
  description = "Creates a new Post as a contribution on a Callout.";

  schema = {
    calloutID: {
      type: z.string().uuid(),
      description: "The UUID of the Callout to add the Post to",
    },
    displayName: {
      type: z.string().min(1).max(100),
      description: "The display name for the Post",
    },
    description: {
      type: z.string().optional(),
      description: "The description/content of the Post",
    },
    nameID: {
      type: z.string().regex(/^[a-z0-9-]+$/).optional(),
      description: "A readable identifier (lowercase, numbers, hyphens only)",
    },
    tags: {
      type: z.string().optional(),
      description: "Comma-separated tags to associate with the Post",
    },
  };

  async execute(input: CreatePostInput) {
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
      mutation CreatePost($contributionData: CreateContributionOnCalloutInput!) {
        createContributionOnCallout(contributionData: $contributionData) {
          id
          post {
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

      const postData: any = {
        profileData: {
          displayName: input.displayName,
          description: input.description,
        },
      };

      if (input.nameID) {
        postData.nameID = input.nameID;
      }

      if (input.tags) {
        postData.tags = input.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      }

      const contributionData = {
        calloutID: input.calloutID,
        type: "POST",
        post: postData,
      };

      const responseData = await graphQLClient.request<CreatePostResponse>(mutation, {
        contributionData,
      });

      return {
        success: true,
        contribution: {
          id: responseData.createContributionOnCallout.id,
          post: responseData.createContributionOnCallout.post ? {
            id: responseData.createContributionOnCallout.post.id,
            nameID: responseData.createContributionOnCallout.post.nameID,
            displayName: responseData.createContributionOnCallout.post.profile.displayName,
          } : null,
        },
      };
    } catch (error: any) {
      console.error("Error creating Alkemio post:", error);
      throw new Error(`Failed to create Alkemio post: ${error.message}`);
    }
  }
}

export default CreatePostTool;
