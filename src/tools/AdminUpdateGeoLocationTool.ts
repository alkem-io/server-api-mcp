import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { gql, GraphQLClient } from "graphql-request";
import { getAlkemioService } from "../services/AlkemioService.js";

interface AdminUpdateGeoLocationInput {}

interface AdminUpdateGeoLocationResponse {
  adminUpdateGeoLocationData: boolean;
}

class AdminUpdateGeoLocationTool extends MCPTool<AdminUpdateGeoLocationInput> {
  name = "alkemio_admin_updateGeoLocationData";
  description = "Updates the GeoLocation data where required on the platform.";

  schema = {};

  async execute(input: AdminUpdateGeoLocationInput) {
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
      mutation AdminUpdateGeoLocationData {
        adminUpdateGeoLocationData
      }
    `;

    try {
      const graphQLClient = new GraphQLClient(graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });

      const responseData = await graphQLClient.request<AdminUpdateGeoLocationResponse>(mutation);

      return {
        success: true,
        updated: responseData.adminUpdateGeoLocationData,
      };
    } catch (error: any) {
      console.error("Error updating geo location data:", error);
      throw new Error(`Failed to update geo location data: ${error.message}`);
    }
  }
}

export default AdminUpdateGeoLocationTool;
