import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AddIframeUrlInput {
  whitelistedURL: string;
}

interface AddIframeUrlResponse {
  addIframeAllowedURL: string[];
}

class AddIframeUrlTool extends MCPTool<AddIframeUrlInput> {
  name = "alkemio.admin.addIframeUrl";
  description = "Adds an Iframe Allowed URL to the Platform Settings.";

  schema = {
    whitelistedURL: {
      type: z.string().url(),
      description: "The URL to add to the allowed iframe list",
    },
  };

  async execute(input: AddIframeUrlInput) {
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
      mutation AddIframeAllowedURL($whitelistedURL: String!) {
        addIframeAllowedURL(whitelistedURL: $whitelistedURL)
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AddIframeUrlResponse>(mutation, {
        whitelistedURL: input.whitelistedURL,
      });

      return {
        success: true,
        allowedURLs: responseData.addIframeAllowedURL,
      };
    } catch (error: any) {
      console.error("Error adding iframe URL:", error);
      throw new Error(`Failed to add iframe URL: ${error.message}`);
    }
  }
}

export default AddIframeUrlTool;
