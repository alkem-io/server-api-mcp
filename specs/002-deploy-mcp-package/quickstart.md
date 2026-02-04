# Quick Start: Deployable MCP Server

## Prerequisites

- Node.js >= 18.19.0
- Docker >= 20.10 (for container deployment)
- Kubernetes cluster with Traefik (for production)
- NPM >= 10.0.0 (for package deployment)

## Option 1: Run from Source

```bash
# Clone and install
git clone https://github.com/alkem-io/server-api-mcp.git
cd server-api-mcp
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start server
npm start
```

## Option 2: Run via NPM Package

```bash
# Global install
npm install -g alkemio-mcp-server

# Configure environment
export API_ENDPOINT_PRIVATE_GRAPHQL="https://api.example.com/api/private/non-interactive/graphql"
export AUTH_ADMIN_EMAIL="admin@example.com"
export AUTH_ADMIN_PASSWORD="your-password"
export AUTH_ORY_KRATOS_PUBLIC_BASE_URL="https://api.example.com/ory/kratos/public/"

# Start server
alkemio-mcp
```

## Option 3: Run via Docker

```bash
# Build image
docker build -t alkemio-mcp:latest .

# Run container
docker run -d \
  --name alkemio-mcp \
  -p 1339:1339 \
  -e API_ENDPOINT_PRIVATE_GRAPHQL="https://api.example.com/api/private/non-interactive/graphql" \
  -e AUTH_ADMIN_EMAIL="admin@example.com" \
  -e AUTH_ADMIN_PASSWORD="your-password" \
  -e AUTH_ORY_KRATOS_PUBLIC_BASE_URL="https://api.example.com/ory/kratos/public/" \
  alkemio-mcp:latest
```

## Option 4: Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic alkemio-mcp-secrets \
  --from-literal=graphql-endpoint="https://api.example.com/api/private/non-interactive/graphql" \
  --from-literal=admin-email="admin@example.com" \
  --from-literal=admin-password="your-password" \
  --from-literal=kratos-url="https://api.example.com/ory/kratos/public/"

# Apply manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Verify Deployment

```bash
# Check pod status
kubectl get pods -l app=alkemio-mcp-server

# Check service
kubectl get svc alkemio-mcp-server

# Test endpoint
curl http://localhost:1339/
```

## Configure MCP Clients

### Claude Code

```json
{
  "mcpServers": {
    "alkemio": {
      "url": "https://mcp.example.com/"
    }
  }
}
```

### LibreChat

Configure the MCP endpoint in LibreChat's API settings.

### GitHub Copilot

Configure the MCP server URL in GitHub Copilot extensions.