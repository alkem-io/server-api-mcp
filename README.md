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

## Deployment

### Docker

Build and run the Docker container:

```bash
# Build the image
docker build -t alkemio-mcp-server:latest .

# Run the container
docker run -p 1339:1339 \
  -e API_ENDPOINT_PRIVATE_GRAPHQL=https://your-alkemio-instance.com/api/private/non-interactive/graphql \
  -e AUTH_ADMIN_EMAIL=your-email@example.com \
  -e AUTH_ADMIN_PASSWORD=your-password \
  -e AUTH_ORY_KRATOS_PUBLIC_BASE_URL=https://your-alkemio-instance.com/ory/kratos/public/ \
  alkemio-mcp-server:latest
```

### Kubernetes

Deploy to Kubernetes using the provided manifests:

```bash
# Create secrets (update with your values)
kubectl create secret generic alkemio-mcp-secrets \
  --from-literal=api-endpoint-private-graphql=https://your-alkemio-instance.com/api/private/non-interactive/graphql \
  --from-literal=auth-admin-email=your-email@example.com \
  --from-literal=auth-admin-password=your-password \
  --from-literal=auth-ory-kratos-public-base-url=https://your-alkemio-instance.com/ory/kratos/public/

# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=alkemio-mcp
kubectl logs -l app=alkemio-mcp
```

### Traefik Ingress

The server includes Traefik middleware for secure access:

```yaml
# Example Ingress configuration
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: alkemio-mcp
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.entrypoints: web, websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  rules:
  - host: mcp.alkemio.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: alkemio-mcp
            port:
              number: 80
```

### Health Checks

The server exposes the following endpoints:

- `GET /health` - Full health check with status, version, uptime
- `GET /healthz` - Simple liveness probe (K8s compatible)
- `GET /ready` - Readiness probe (K8s compatible)
- `GET /metrics` - Prometheus metrics

Configure K8s probes:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 1339
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 1339
  initialDelaySeconds: 5
  periodSeconds: 10
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

## Available Tools

The server exposes the following MCP tools for interacting with the Alkemio platform:

### Query Tools (Read Operations)

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `alkemio.accounts.listAccounts` | List all Alkemio accounts on the platform | None |
| `alkemio.spaces.listSpaces` | List all accessible Alkemio spaces | None |
| `alkemio.spaces.getSpace` | Get a specific space by ID | `{ ID: string }` |
| `alkemio.spaces.exploreSpaces` | Explore active spaces ordered by activity | `{ limit?, shuffle? }` |
| `alkemio.organizations.listOrganizations` | List all organizations | `{ limit?, shuffle? }` |
| `alkemio.organizations.getOrganization` | Get a specific organization by ID | `{ ID: string }` |
| `alkemio.users.listUsers` | List all users | `{ limit?, shuffle?, IDs? }` |
| `alkemio.users.getUser` | Get a specific user by ID | `{ ID: string }` |
| `alkemio.users.getCurrentUser` | Get current authenticated user info | None |
| `alkemio.activity.getActivityFeed` | Get the activity feed | `{ first?, last?, after?, before?, types?, spaceIds?, myActivity? }` |
| `alkemio.lookup.lookupEntities` | Lookup entities by their IDs | `{ spaceId?, accountId?, organizationId?, userId?, postId?, whiteboardId?, calloutId? }` |

### Mutation Tools (Write Operations)

#### Space Operations

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `alkemio.spaces.createSpace` | Create a new space | `{ accountID, displayName, nameID?, description?, tagline?, tags?, why?, who?, licensePlanID? }` |
| `alkemio.spaces.updateSpace` | Update an existing space | `{ ID, displayName?, description?, tagline?, why?, who? }` |
| `alkemio.spaces.deleteSpace` | Delete a space | `{ ID: string }` |

#### Post Operations

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `alkemio.posts.createPost` | Create a new post on a callout | `{ calloutID, displayName, description?, nameID?, tags? }` |
| `alkemio.posts.updatePost` | Update an existing post | `{ ID, displayName?, description?, nameID? }` |
| `alkemio.posts.deletePost` | Delete a post | `{ ID: string }` |

#### Whiteboard Operations

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `alkemio.whiteboards.createWhiteboard` | Create a new whiteboard on a callout | `{ calloutID, displayName, description?, nameID?, content? }` |
| `alkemio.whiteboards.updateWhiteboard` | Update an existing whiteboard | `{ ID, displayName?, description?, content?, contentUpdatePolicy? }` |
| `alkemio.whiteboards.deleteWhiteboard` | Delete a whiteboard | `{ ID: string }` |

### Admin Tools

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `alkemio.admin.addIframeUrl` | Add an iframe URL to allowed list | `{ whitelistedURL: string }` |
| `alkemio.admin.deleteUserAccount` | Delete a user's Kratos account | `{ userID: string }` |
| `alkemio.admin.backfillAuthenticationIDs` | Backfill auth IDs from Kratos | None |
| `alkemio.admin.ensureCommunicationsAccess` | Ensure community members have communications access | `{ communityID: string }` |
| `alkemio.admin.deleteKratosIdentity` | Delete a Kratos identity | `{ kratosIdentityId: string }` |
| `alkemio.admin.pruneNotifications` | Prune in-app notifications | None |
| `alkemio.admin.updateContributorAvatars` | Update contributor avatars | `{ profileID: string }` |
| `alkemio.admin.updateGeoLocationData` | Update geo location data | None |
| `alkemio.admin.addNotificationEmailToBlacklist` | Add email to notification blacklist | `{ email: string }` |

## Project Structure

```
server-api-mcp/
├── src/
│   ├── index.ts           # Server entry point
│   ├── services/          # Services
│   │   └── AlkemioService.ts  # Authentication and GraphQL client
│   ├── tools/             # MCP Tools (30+ tools)
│   │   ├── ListSpacesTool.ts
│   │   ├── GetSpaceTool.ts
│   │   ├── CreateSpaceTool.ts
│   │   └── ...
│   └── resources/         # MCP Resources
├── specs/                 # Specification documents
├── package.json
└── tsconfig.json
```

## Adding Components

You can add more tools using the CLI:

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
