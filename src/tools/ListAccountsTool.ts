import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface ListAccountsInput {}

interface AlkemioAccount {
  id: string;
  type?: string;
  host?: {
    id: string;
    nameID: string;
    profile: {
      displayName: string;
    };
  };
}

interface ListAccountsResponse {
  accounts: AlkemioAccount[];
}

class ListAccountsTool extends MCPTool<ListAccountsInput> {
  name = "alkemio_accounts_list";
  description = "Retrieves a list of all Alkemio Accounts on the platform.";

  schema = {};

  async execute(input: ListAccountsInput) {
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
      query ListAccounts {
        accounts {
          id
          type
          host {
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

      const responseData = await graphQLClient.request<ListAccountsResponse>(query);

      return responseData.accounts.map((account: AlkemioAccount) => ({
        id: account.id,
        type: account.type,
        hostId: account.host?.id,
        hostNameID: account.host?.nameID,
        hostDisplayName: account.host?.profile?.displayName,
      }));
    } catch (error: any) {
      console.error("Error fetching Alkemio accounts:", error);
      throw new Error(`Failed to retrieve Alkemio accounts: ${error.message}`);
    }
  }
}

export default ListAccountsTool;
