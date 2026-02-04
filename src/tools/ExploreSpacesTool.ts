import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface ExploreSpacesInput {
  limit?: number;
  shuffle?: boolean;
}

interface AlkemioSpace {
  id: string;
  nameID: string;
  visibility: string;
  about: {
    profile: {
      displayName: string;
      description?: string;
      tagline?: string;
    };
  };
}

interface ExploreSpacesResponse {
  exploreSpaces: AlkemioSpace[];
}

class ExploreSpacesTool extends MCPTool<ExploreSpacesInput> {
  name = "alkemio.spaces.exploreSpaces";
  description = "Explores active Spaces, ordered by activity in the past X days.";

  schema = {
    limit: {
      type: z.number().optional(),
      description: "Maximum number of spaces to return",
    },
    shuffle: {
      type: z.boolean().optional(),
      description: "If true, return a random selection of spaces",
    },
  };

  async execute(input: ExploreSpacesInput) {
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
      query ExploreSpaces($options: ExploreSpacesInput) {
        exploreSpaces(options: $options) {
          id
          nameID
          visibility
          about {
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

      const options: any = {};
      if (input.limit !== undefined) options.limit = input.limit;
      if (input.shuffle !== undefined) options.shuffle = input.shuffle;

      const responseData = await graphQLClient.request<ExploreSpacesResponse>(query, {
        options: Object.keys(options).length > 0 ? options : undefined,
      });

      return responseData.exploreSpaces.map((space: AlkemioSpace) => ({
        id: space.id,
        nameID: space.nameID,
        visibility: space.visibility,
        displayName: space.about.profile.displayName,
        description: space.about.profile.description,
        tagline: space.about.profile.tagline,
      }));
    } catch (error: any) {
      console.error("Error exploring Alkemio spaces:", error);
      throw new Error(`Failed to explore Alkemio spaces: ${error.message}`);
    }
  }
}

export default ExploreSpacesTool;
