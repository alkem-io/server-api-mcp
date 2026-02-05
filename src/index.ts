import { MCPServer } from "mcp-framework";
import { getKratosAuthService } from "./services/KratosAuth.js";
import { initializeAlkemioServiceWithToken } from "./services/AlkemioService.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MCP_SERVER_PORT = process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 1339;

const server = new MCPServer({
  transport: {
    type: "http-stream",
    options: {
      port: MCP_SERVER_PORT,
      cors: {
        allowOrigin: "*"
      }
    }
  }
  // Tools are typically auto-discovered by the mcp-build process
  // from the ./tools directory, so no explicit registration here is needed
  // if tools are correctly exported from their files.
});

// Initialize Kratos authentication before starting the server
async function initializeServer() {
  try {
    console.log('🚀 Starting Alkemio MCP Server...');
    console.log(`📡 Server will listen on port ${MCP_SERVER_PORT}`);

    // Initialize Kratos authentication (per Constitution III)
    const kratosAuth = getKratosAuthService();
    await kratosAuth.authenticate();

    // Initialize AlkemioService with the Kratos session token
    const sessionToken = kratosAuth.getSessionToken();
    const graphqlEndpoint = process.env.API_ENDPOINT_PRIVATE_GRAPHQL || '';
    if (sessionToken && graphqlEndpoint) {
      initializeAlkemioServiceWithToken(sessionToken, graphqlEndpoint);
    } else {
      console.warn('⚠️ Could not initialize AlkemioService: missing session token or GraphQL endpoint');
    }

    // Test GraphQL connectivity
    console.log('🧪 Testing Alkemio GraphQL connectivity...');
    const graphqlClient = kratosAuth.getGraphQLClient();
    // Basic connectivity test would go here

    // Start the MCP server
    await server.start();
    console.log(`✅ Alkemio MCP Server is running on http://localhost:${MCP_SERVER_PORT}`);

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
initializeServer();