# Claude Code Configuration

This document describes how to configure the Alkemio MCP Server with Claude Code.

## Prerequisites

- Claude Code CLI installed (`brew install claude`)
- Docker or npm package installed
- Access to a Kubernetes cluster or Docker host

## Installation Options

### Option 1: Docker (Recommended)

```bash
# Pull the image
docker pull alkemio/mcp-server:latest

# Run with environment variables
docker run -d \
  --name alkemio-mcp \
  -p 1339:1339 \
  -e API_ENDPOINT_PRIVATE_GRAPHQL=https://api.alkem.io/graphql \
  -e AUTH_ADMIN_EMAIL=admin@example.com \
  -e AUTH_ADMIN_PASSWORD=your-password \
  -e AUTH_ORY_KRATOS_PUBLIC_BASE_URL=https://kratos.alkem.io \
  alkemio/mcp-server:latest
```

### Option 2: NPM Package

```bash
# Install globally
npm install -g alkemio-mcp-server

# Run with environment variables
export API_ENDPOINT_PRIVATE_GRAPHQL=https://api.alkem.io/graphql
export AUTH_ADMIN_EMAIL=admin@example.com
export AUTH_ADMIN_PASSWORD=your-password
export AUTH_ORY_KRATOS_PUBLIC_BASE_URL=https://kratos.alkem.io

alkemio-mcp --port 1339
```

### Option 3: From Source

```bash
# Clone and build
git clone https://github.com/alkemio/server-api-mcp.git
cd server-api-mcp
npm install
npm run build
npm start
```

## Claude Code Integration

### Using SSE Transport

Claude Code supports MCP servers via Server-Sent Events (SSE). Configure the server in your `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "alkemio": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "API_ENDPOINT_PRIVATE_GRAPHQL",
        "-e", "AUTH_ADMIN_EMAIL",
        "-e", "AUTH_ADMIN_PASSWORD",
        "-e", "AUTH_ORY_KRATOS_PUBLIC_BASE_URL",
        "alkemio/mcp-server:latest"
      ],
      "env": {
        "API_ENDPOINT_PRIVATE_GRAPHQL": "https://api.alkem.io/graphql",
        "AUTH_ADMIN_EMAIL": "admin@example.com",
        "AUTH_ADMIN_PASSWORD": "your-password",
        "AUTH_ORY_KRATOS_PUBLIC_BASE_URL": "https://kratos.alkem.io"
      }
    }
  }
}
```

### Using HTTP Stream Transport

For direct HTTP connections (when running locally):

```json
{
  "mcpServers": {
    "alkemio": {
      "url": "http://localhost:1339/"
    }
  }
}
```

## Available Tools

Once connected, the following tool categories are available:

### Space Management
- `list_spaces` - List all spaces
- `get_space` - Get space details
- `create_space` - Create a new space

### Contributor Management
- `list_contributors` - List contributors
- `get_contributor` - Get contributor details
- `create_contributor` - Add a contributor

### Posts
- `list_posts` - List posts in a space
- `create_post` - Create a new post
- `update_post` - Update an existing post

### Whiteboards
- `list_whiteboards` - List whiteboards
- `create_whiteboard` - Create a whiteboard
- `get_whiteboard` - Get whiteboard details

## Troubleshooting

### Connection Issues

1. **Server not starting**
   - Check environment variables are set
   - Verify Kratos credentials are valid
   - Check port 1339 is not in use

2. **Authentication failures**
   - Verify Kratos admin email/password
   - Ensure Kratos URL is accessible
   - Check Alkemio GraphQL endpoint is reachable

3. **Claude Code not discovering tools**
   - Verify SSE transport is working
   - Check server logs for errors
   - Ensure no CORS issues

### Logs

```bash
# Docker logs
docker logs alkemio-mcp

# Direct run logs
alkemio-mcp 2>&1 | tee mcp-server.log
```

## Security Notes

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate credentials** periodically
4. **Use TLS** in production environments
5. **Limit access** to the MCP server port