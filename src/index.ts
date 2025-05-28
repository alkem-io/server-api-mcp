import { MCPServer } from "mcp-framework";
import { getAlkemioService } from "./services/AlkemioService.js";
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
});

// Initialize Alkemio authentication before starting the server
async function initializeServer() {
  try {
    console.log('🚀 Starting Alkemio MCP Server...');
    console.log(`📡 Server will listen on port ${MCP_SERVER_PORT}`);
    
    // Initialize Alkemio authentication
    const alkemioService = getAlkemioService();
    await alkemioService.initialize();
    
    // Test basic functionality
    console.log('🧪 Testing Alkemio connectivity...');
    const hasAccess = await alkemioService.testSpaceAccess();
    console.log(`📊 Sample space access test: ${hasAccess ? 'PASS' : 'SKIP'}`);
    
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