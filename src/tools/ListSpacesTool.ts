import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request"; // Added GraphQLClient
import { getAlkemioService } from "../services/AlkemioService.js";

// Define the expected structure of a Space from the Alkemio GraphQL API
// This should be adjusted based on the actual fields available in graphql_schema.json
interface AlkemioSpace {
  id: string;
  about: {
    profile: {
      displayName: string;
    };
  };
  // Add other relevant fields like description, createdAt, etc.
}

// Define the expected structure of the GraphQL response for listing spaces
interface ListSpacesResponse {
  spaces: AlkemioSpace[]; // Expect a direct array of spaces
  // Or it might be a direct array like: mySpaces: AlkemioSpace[];
  // This needs to be verified against graphql_schema.json
}

// No specific input is needed to list spaces for the authenticated user
interface ListSpacesInput {}

class ListSpacesTool extends MCPTool<ListSpacesInput> {
  name = "alkemio_spaces_list";
  description = "Retrieves a list of Alkemio Spaces accessible to the authenticated user.";

  // No input schema needed for this specific tool, but the framework might require an empty object
  schema = {};

  // frameworkContext is part of the MCPTool signature, keep it but we won't use it for the token.
  async execute(input: ListSpacesInput, frameworkContext?: any) {
    const alkemioService = getAlkemioService();

    if (!alkemioService.isReady()) {
      throw new Error("Alkemio service is not ready or not authenticated. Ensure server initialized correctly.");
    }

    const apiToken = alkemioService.getApiToken();
    const graphqlEndpoint = alkemioService.getGraphqlEndpoint();

    if (!apiToken || !graphqlEndpoint) {
      throw new Error("Could not retrieve API token or GraphQL endpoint from AlkemioService.");
    }

    // This query needs to be verified against graphql_schema.json
    // Common patterns are 'spaces', 'mySpaces', or a query that accepts filters/pagination
    // For now, assuming a query 'spaces' that returns a list of spaces with 'id' and 'title'
    // And assuming the response structure is { spaces: { data: [...] } }
    const query = gql`
      query GetMySpaces {
        spaces { # Removed pagination argument
          id
          about {
            profile {
              displayName
            }
          }
          # description
          # createdAt
          # Add other fields you want to retrieve
        }
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<ListSpacesResponse>(query);
      
      // The type of responseData is inferred from ListSpacesResponse
      if (responseData.spaces) {
        return responseData.spaces.map((space: AlkemioSpace) => ({
          id: space.id,
          name: space.about.profile.displayName, // Access displayName via about.profile
          // description: space.description, 
        }));
      } else {
        // Fallback or error if the structure is different
        console.warn("Unexpected response structure for listing spaces:", responseData);
        return "Could not retrieve spaces or the structure was unexpected.";
      }

    } catch (error: any) {
      console.error("Error fetching Alkemio spaces via AlkemioService:", error);
      // Provide a more user-friendly error message if possible
      throw new Error(`Failed to retrieve Alkemio spaces: ${error.message}`);
    }
  }
}

export default ListSpacesTool;
