# Data Model: Deployable MCP Server Package

## Entities

### MCP Server Container/Package

The deployable unit containing the Node.js MCP server, Kratos authentication, and GraphQL client.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| imageTag | string | Yes | SemVer format |
| port | number | Yes | 1024-65535 |
| envVars | EnvConfig[] | Yes | Non-empty array |

**Relationships:**
- Uses: KratosAuthService for authentication
- Exposes: MCP tools via mcp-framework
- Depends on: Kubernetes Service, Traefik Ingress

### Environment Configuration

Environment variables for API endpoints, authentication credentials, and network settings.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| API_ENDPOINT_PRIVATE_GRAPHQL | URL | Yes | - | Alkemio GraphQL endpoint |
| AUTH_ADMIN_EMAIL | email | Yes | - | Kratos admin email |
| AUTH_ADMIN_PASSWORD | string | Yes | - | Kratos admin password |
| AUTH_ORY_KRATOS_PUBLIC_BASE_URL | URL | Yes | - | Kratos public API |
| MCP_SERVER_PORT | number | No | 1339 | MCP server listen port |

### Kubernetes Resources

| Resource | Type | Purpose |
|----------|------|---------|
| Deployment | apps/v1 | Pod replica management |
| Service | v1 | Internal service discovery |
| Ingress | networking.k8s.io/v1 | External routing via Traefik |
| Secret | v1 | Credential storage |

## Validation Rules

1. **Authentication**:
   - Admin email must match email format
   - Password must not be empty
   - Kratos URL must be reachable

2. **Network**:
   - Port must be >= 1024 (non-privileged)
   - Only ClusterIP service type supported
   - Traefik ingress requires TLS in production

## State Transitions

```
Server States:
  PENDING -> RUNNING (initialization successful)
  RUNNING -> UNHEALTHY (health check failed)
  UNHEALTHY -> RUNNING (pod restarted)
  RUNNING -> SHUTTING_DOWN (SIGTERM received)
```

## Configuration Files

| File | Format | Purpose |
|------|--------|---------|
| Dockerfile | Docker | Container image definition |
| docker-compose.yml | YAML | Local development/testing |
| k8s/deployment.yaml | YAML | K8s deployment manifest |
| k8s/service.yaml | YAML | K8s service manifest |
| k8s/ingress.yaml | YAML | K8s ingress manifest |