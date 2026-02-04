# GitHub Copilot Configuration

This document describes how to configure the Alkemio MCP Server with GitHub Copilot.

## Prerequisites

- GitHub Copilot CLI (`gh copilot`) installed
- Node.js >= 18.19.0
- Docker or npm package installed

## Installation Options

### Option 1: Docker (Recommended)

```bash
# Run the MCP server container
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

## GitHub Copilot Integration

### Using MCP with GitHub CLI

GitHub Copilot CLI can be configured to use MCP servers for extended capabilities.

#### Step 1: Configure MCP Server

Create a configuration file at `~/.config/gh/copilot/mcp.json`:

```json
{
  "servers": {
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

#### Step 2: Verify Connection

```bash
# Test MCP server is reachable
curl http://localhost:1339/

# Verify tool discovery
gh copilot tools list
```

## Available Commands

### Space Management

```bash
# List all spaces
gh copilot alkemio spaces list

# Get space details
gh copilot alkemio spaces get --space-id eco1

# Create a new space
gh copilot alkemio spaces create --name "New Space" --description "Description"
```

### Contributor Management

```bash
# List contributors in a space
gh copilot alkemio contributors list --space-id eco1

# Get contributor details
gh copilot alkemio contributors get --user-id user123

# Add a contributor
gh copilot alkemio contributors add --space-id eco1 --user-id user123 --role contributor
```

### Posts

```bash
# List posts
gh copilot alkemio posts list --space-id eco1

# Create a post
gh copilot alkemio posts create --space-id eco1 --title "My Post" --content "Content"

# Update a post
gh copilot alkemio posts update --post-id post123 --title "Updated Title"
```

### Whiteboards

```bash
# List whiteboards
gh copilot alkemio whiteboards list --space-id eco1

# Create a whiteboard
gh copilot alkemio whiteboards create --space-id eco1 --name "Whiteboard Name"

# Get whiteboard content
gh copilot alkemio whiteboards get --whiteboard-id wb123
```

## Conversation Examples

### Example 1: Querying Spaces

```
User: gh copilot alkemio spaces list
Copilot: You have access to 3 spaces:
1. Eco - A sustainable community platform
2. Innovation - Ideas and collaboration hub
3. Community - General community discussions
```

### Example 2: Creating Content

```
User: gh copilot alkemio posts create --space-id eco1 --title "Feature Request" --content "Would be great to have X"
Copilot: Post created successfully!
- ID: post-abc123
- URL: https://alkem.io/post/post-abc123
- Created: 2024-01-15 10:30:00 UTC
```

### Example 3: Managing Contributors

```
User: gh copilot alkemio contributors add --space-id eco1 --user-id newuser@example.com --role contributor
Copilot: Contributor added successfully!
- User: newuser@example.com
- Role: contributor
- Space: eco1
```

## Troubleshooting

### Connection Refused

1. Verify MCP server is running:
   ```bash
   docker ps | grep alkemio-mcp
   ```

2. Check port is correct:
   ```bash
   curl http://localhost:1339/
   ```

3. Check container logs:
   ```bash
   docker logs alkemio-mcp
   ```

### Authentication Errors

1. Verify Kratos credentials:
   ```bash
   docker exec alkemio-mcp env | grep AUTH
   ```

2. Test Kratos connectivity:
   ```bash
   curl -X GET "${AUTH_ORY_KRATOS_PUBLIC_BASE_URL}/sessions/whoami" \
     -H "Authorization: Bearer ${SESSION_TOKEN}"
   ```

### Tools Not Available

1. Verify MCP protocol handshake:
   ```bash
   # Check server responds to MCP discovery
   curl -X POST http://localhost:1339/ -H "Content-Type: application/json" -d '{}'
   ```

2. Check Copilot CLI MCP configuration:
   ```bash
   gh copilot config show
   ```

## Security Best Practices

1. **Credential rotation**: Rotate Kratos credentials regularly
2. **Network policies**: Restrict MCP server network access
3. **Audit logging**: Log all tool invocations
4. **TLS**: Enable HTTPS for production
5. **Secrets management**: Use environment files or secrets managers

## Performance Considerations

1. **Container resources**: Allocate adequate CPU/memory
2. **Connection pooling**: Reuse authenticated sessions
3. **Caching**: Cache GraphQL queries where appropriate
4. **Rate limiting**: Implement client-side rate limiting
5. **Health checks**: Monitor server health metrics