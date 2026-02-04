# Kubernetes Secrets Configuration

This document describes the Kubernetes secrets required for the Alkemio MCP Server deployment.

## Secret Name

The secrets are expected to be named `alkemio-mcp-secrets` and must be created before deploying the MCP server.

## Required Secret Keys

| Key | Description | Example |
|-----|-------------|---------|
| `API_ENDPOINT_PRIVATE_GRAPHQL` | Alkemio GraphQL endpoint | `https://api.alkem.io/graphql` |
| `AUTH_ADMIN_EMAIL` | Kratos admin email | `admin@alkem.io` |
| `AUTH_ADMIN_PASSWORD` | Kratos admin password | `your-secure-password` |
| `AUTH_ORY_KRATOS_PUBLIC_BASE_URL` | Ory Kratos public URL | `https://kratos.alkem.io` |

## Creating Secrets

### Option 1: Using kubectl with literal values

```bash
kubectl create secret generic alkemio-mcp-secrets \
  --from-literal=API_ENDPOINT_PRIVATE_GRAPHQL='https://api.alkem.io/graphql' \
  --from-literal=AUTH_ADMIN_EMAIL='admin@alkem.io' \
  --from-literal=AUTH_ADMIN_PASSWORD='your-password' \
  --from-literal=AUTH_ORY_KRATOS_PUBLIC_BASE_URL='https://kratos.alkem.io'
```

### Option 2: Using sealed secrets (recommended for GitOps)

If using sealed secrets for GitOps workflows:

```bash
# Create a temporary secret file
cat > secret-temp.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: alkemio-mcp-secrets
type: Opaque
stringData:
  API_ENDPOINT_PRIVATE_GRAPHQL: "https://api.alkem.io/graphql"
  AUTH_ADMIN_EMAIL: "admin@alkem.io"
  AUTH_ADMIN_PASSWORD: "your-password"
  AUTH_ORY_KRATOS_PUBLIC_BASE_URL: "https://kratos.alkem.io"
EOF

# Encrypt with kubeseal
kubeseal --format yaml < secret-temp.yaml > k8s/sealed-secret.yaml
```

### Option 3: Using external secrets operator

If using the External Secrets Operator with a secrets manager:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: alkemio-mcp-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-secrets-store
    kind: ClusterSecretStore
  target:
    name: alkemio-mcp-secrets
  data:
    - secretKey: API_ENDPOINT_PRIVATE_GRAPHQL
      remoteRef:
        key: alkemio/mcp/server
        property: graphql_endpoint
    - secretKey: AUTH_ADMIN_EMAIL
      remoteRef:
        key: alkemio/mcp/server
        property: admin_email
    - secretKey: AUTH_ADMIN_PASSWORD
      remoteRef:
        key: alkemio/mcp/server
        property: admin_password
    - secretKey: AUTH_ORY_KRATOS_PUBLIC_BASE_URL
      remoteRef:
        key: alkemio/mcp/server
        property: kratos_url
```

## Security Best Practices

1. **Never commit secrets to version control** - Use sealed secrets or external secrets operators
2. **Use least privilege** - Create a dedicated service account for the MCP server
3. **Rotate credentials** - Rotate Kratos admin credentials periodically
4. **Audit access** - Monitor who accesses the secrets
5. **Use TLS** - Ensure all endpoints use HTTPS in production

## Verifying Secrets

After creating secrets, verify they're correctly configured:

```bash
# Check secret exists
kubectl get secret alkemio-mcp-secrets

# Verify values (base64 encoded)
kubectl get secret alkemio-mcp-secrets -o yaml

# Test deployment without errors
kubectl describe deployment alkemio-mcp-server | grep -i error
```