# Alkemio MCP Server

A Model Context Protocol (MCP) server that exposes Alkemio's functionalities as standardized tools and resources, allowing AI models and LLM applications to interact with the Alkemio platform programmatically.

## Features

- **MCP Compliance**: Fully compliant with the Model Context Protocol specification
- **Alkemio Integration**: Direct integration with Alkemio's GraphQL API using the official client library
- **HTTP Streaming**: Uses HTTP streaming transport for web-accessible endpoints
- **Authentication**: Secure authentication with Alkemio platform using user credentials
- **Discoverable Tools**: All tools and resources are discoverable via MCP manifest and introspection

## Quick Start

### Prerequisites

- Node.js 18 or later
- Access to an Alkemio instance (local or hosted)
- Valid Alkemio user credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd server-api-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your Alkemio instance details:

```env
# Alkemio Server Configuration
API_ENDPOINT_PRIVATE_GRAPHQL=https://your-alkemio-instance.com/api/private/non-interactive/graphql

# Authentication Configuration  
AUTH_ADMIN_EMAIL=your-email@example.com
AUTH_ADMIN_PASSWORD=your-password
AUTH_ORY_KRATOS_PUBLIC_BASE_URL=https://your-alkemio-instance.com/ory/kratos/public/

# MCP Server Configuration
MCP_SERVER_PORT=1339
```

4. Build and start the server:
```bash
npm run build
npm start
```

The server will start on `http://localhost:1339` (or the port specified in your `.env` file).

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_ENDPOINT_PRIVATE_GRAPHQL` | Alkemio GraphQL API endpoint | `http://localhost:3000/api/private/non-interactive/graphql` |
| `AUTH_ADMIN_EMAIL` | Alkemio user email for authentication | `admin@alkem.io` |
| `AUTH_ADMIN_PASSWORD` | Alkemio user password | `test` |
| `AUTH_ORY_KRATOS_PUBLIC_BASE_URL` | Kratos public API endpoint | `http://localhost:3000/ory/kratos/public/` |
| `MCP_SERVER_PORT` | Port for the MCP server | `1339` |

### Development

For development with auto-reload:
```bash
npm run watch
```

## Architecture

The server is built using:
- **[mcp-framework](https://mcp-framework.com/)**: TypeScript framework for building MCP servers
- **[@alkemio/client-lib](https://github.com/alkemio/Client.Lib)**: Official Alkemio client library for GraphQL API interaction
- **HTTP Streaming Transport**: Enables web-based clients to connect

## Authentication Flow

1. Server starts and loads configuration from environment variables
2. Alkemio client authenticates using provided credentials via Kratos
3. Connection is validated against the Alkemio GraphQL API  
4. MCP server becomes ready to serve tool and resource requests
5. All subsequent API calls use the authenticated session

## Tools and Resources

*Coming soon - tools and resources for Spaces, Contributors, Posts, and more*

## Project Structure

```
server-api-mcp/
├── src/
│   ├── tools/        # MCP Tools
│   │   └── ExampleTool.ts
│   └── index.ts      # Server entry point
├── package.json
└── tsconfig.json
```

## Adding Components

The project comes with an example tool in `src/tools/ExampleTool.ts`. You can add more tools using the CLI:

```bash
# Add a new tool
mcp add tool my-tool

# Example tools you might create:
mcp add tool data-processor
mcp add tool api-client
mcp add tool file-handler
```

## Tool Development

Example tool structure:

```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface MyToolInput {
  message: string;
}

class MyTool extends MCPTool<MyToolInput> {
  name = "my_tool";
  description = "Describes what your tool does";

  schema = {
    message: {
      type: z.string(),
      description: "Description of this input parameter",
    },
  };

  async execute(input: MyToolInput) {
    // Your tool logic here
    return `Processed: ${input.message}`;
  }
}

export default MyTool;
```

## Publishing to npm

1. Update your package.json:
   - Ensure `name` is unique and follows npm naming conventions
   - Set appropriate `version`
   - Add `description`, `author`, `license`, etc.
   - Check `bin` points to the correct entry file

2. Build and test locally:
   ```bash
   npm run build
   npm link
   server-api-mcp  # Test your CLI locally
   ```

3. Login to npm (create account if necessary):
   ```bash
   npm login
   ```

4. Publish your package:
   ```bash
   npm publish
   ```

After publishing, users can add it to their claude desktop client (read below) or run it with npx
```

## Using with Claude Desktop

### Local Development

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "server-api-mcp": {
      "command": "node",
      "args":["/absolute/path/to/server-api-mcp/dist/index.js"]
    }
  }
}
```

### After Publishing

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "server-api-mcp": {
      "command": "npx",
      "args": ["server-api-mcp"]
    }
  }
}
```

## Building and Testing

1. Make changes to your tools
2. Run `npm run build` to compile
3. The server will automatically load your tools on startup

## Learn More

- [MCP Framework Github](https://github.com/QuantGeekDev/mcp-framework)
- [MCP Framework Docs](https://mcp-framework.com)
