# Quickstart Guide

## Prerequisites

- Node.js 18+ and npm
- Access to Alkemio platform with valid admin credentials
- Environment variables configured (see `.env.example`)

## Installation

```bash
npm install
npm run build
```

## Environment Configuration

Create a `.env` file:

```bash
# Alkemio GraphQL endpoint
API_ENDPOINT_PRIVATE_GRAPHQL=https://your-alkemio-host/api/private/non-interactive/graphql

# Kratos authentication
AUTH_ADMIN_EMAIL=admin@your-domain.com
AUTH_ADMIN_PASSWORD=your-password
AUTH_ORY_KRATOS_PUBLIC_BASE_URL=https://your-alkemio-host/ory/kratos/public/

# MCP server port
MCP_SERVER_PORT=1339
```

## Starting the Server

```bash
npm start
```

Expected output:
```
Authenticating with Alkemio platform...
Authentication successful!
MCP server listening on port 1339
```

## Connecting MCP Clients

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "alkemio": {
      "command": "node",
      "args": ["/path/to/server-api-mcp/dist/index.js"],
      "env": {
        "API_ENDPOINT_PRIVATE_GRAPHQL": "...",
        "AUTH_ADMIN_EMAIL": "...",
        "AUTH_ADMIN_PASSWORD": "...",
        "AUTH_ORY_KRATOS_PUBLIC_BASE_URL": "..."
      }
    }
  }
}
```

## Available Tools

Once connected, the following tools are available:

### Query Tools

- `list-accounts` - List all accounts
- `list-spaces` - List all spaces
- `get-space` - Get a specific space by ID
- `list-organizations` - List organizations
- `get-current-user` - Get current authenticated user info
- `activity-feed` - Get user activity feed

### Mutation Tools

- `create-space` - Create a new space
- `update-space` - Update an existing space
- `delete-space` - Delete a space
- `create-post` - Create a new post
- `create-whiteboard` - Create a new whiteboard

## Example Usage

```typescript
// List all spaces
await listSpaces({});

// Get a specific space
await getSpace({ ID: "space-uuid" });

// Create a new space
await createSpace({
  profileData: {
    displayName: "My New Space"
  },
  spaceData: {
    nameID: "my-new-space"
  }
});
```

## Troubleshooting

### Authentication Failures

1. Verify credentials in `.env`
2. Ensure Kratos public URL is accessible
3. Check network connectivity to Alkemio host

### MCP Connection Issues

1. Verify server is running (`npm start`)
2. Check port is not blocked by firewall
3. Validate environment variables are loaded

### GraphQL Errors

1. Verify operation is allowed for current user permissions
2. Check input parameters match schema requirements
3. Review GraphQL response errors for specific details