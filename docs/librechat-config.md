# LibreChat Configuration

This document describes how to configure the Alkemio MCP Server with LibreChat.

## Prerequisites

- LibreChat instance deployed
- Docker or npm package installed
- Access to MCP server endpoint

## Docker Deployment

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

## LibreChat MCP Plugin Configuration

### Step 1: Enable MCP in LibreChat

In your LibreChat `client/.env` file:

```env
# Enable MCP support
ENABLE_MCP=true
MCP_SERVER_URL=http://localhost:1339/
```

### Step 2: Configure MCP Endpoints

Add the MCP server to your LibreChat configuration:

```json
{
  "mcpServers": {
    "alkemio": {
      "url": "http://localhost:1339/",
      "transport": "http-stream"
    }
  }
}
```

### Step 3: Restart LibreChat

```bash
# Rebuild and restart LibreChat
cd librechat
docker-compose up -d
```

## Available Tools in LibreChat

Once configured, the following capabilities are available in LibreChat conversations:

### Space Operations

Users can ask:
- "Show me all spaces in Alkemio"
- "Get details for the Eco space"
- "Create a new space called Innovation Hub"

### Contributor Operations

Users can ask:
- "List all contributors in the Eco space"
- "Add a new contributor"
- "Get contributor details for user123"

### Post Operations

Users can ask:
- "Show all posts in the Eco space"
- "Create a post titled My Ideas"
- "Update the status of post123"

### Whiteboard Operations

Users can ask:
- "List all whiteboards"
- "Create a new whiteboard for collaboration"
- "Get whiteboard content"

## Conversation Examples

### Example 1: Space Management

```
User: What spaces do I have access to?
Bot: You have access to the following spaces:
- Eco (ID: eco1)
- Innovation (ID: innovation1)
- Community (ID: community1)
```

### Example 2: Contributor Management

```
User: Who are the active contributors in the Eco space?
Bot: Active contributors in Eco space:
- @admin (Owner)
- @john (Moderator)
- @jane (Contributor)
```

### Example 3: Post Creation

```
User: Create a new post in Eco space titled "Q1 Goals"
Bot: Post created successfully!
- Title: Q1 Goals
- ID: post123
- URL: https://alkem.io/post/post123
```

## Troubleshooting

### MCP Server Not Connecting

1. Verify the container is running:
   ```bash
   docker ps | grep alkemio-mcp
   ```

2. Check container logs:
   ```bash
   docker logs alkemio-mcp
   ```

3. Test endpoint availability:
   ```bash
   curl http://localhost:1339/
   ```

### Tools Not Appearing

1. Check LibreChat MCP configuration is loaded
2. Verify MCP endpoint URL is correct
3. Check for CORS issues in browser console

### Slow Response Times

1. The MCP server may need more resources
2. Increase memory limit in deployment
3. Check network latency to Kratos and Alkemio APIs

## Security Considerations

1. **Network isolation**: Deploy MCP server in same network as LibreChat
2. **Authentication**: Use service accounts, not admin credentials
3. **TLS**: Enable HTTPS for production deployments
4. **Rate limiting**: Configure rate limits in LibreChat
5. **Audit logging**: Log all MCP tool invocations

## Production Deployment

For production, consider:

1. **Kubernetes deployment**:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: alkemio-mcp
   spec:
     replicas: 3
     template:
       spec:
         containers:
           - name: mcp-server
             image: alkemio/mcp-server:latest
   ```

2. **Load balancing**: Configure Traefik ingress for multiple replicas
3. **Monitoring**: Add Prometheus metrics for tool usage
4. **Health checks**: Use liveness/readiness probes
5. **Secrets management**: Use sealed secrets or external secrets operator