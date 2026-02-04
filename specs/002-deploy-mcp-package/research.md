# Research: Deployable MCP Server Package

## Overview

This document consolidates research findings for deploying the Alkemio MCP server as both a Docker container and NPM package, with Kubernetes/Traefik integration.

---

## 1. Docker Best Practices for Node.js TypeScript MCP Server

### Decision: Multi-Stage Build with node:20-slim

**Rationale:**
- Multi-stage builds separate compilation from runtime, reducing image size
- `node:20-slim` preferred over `node:20-alpine` for better glibc compatibility
- Non-root execution via `node` user (UID 1000) follows security best practices
- COPY preferred over ADD for predictable behavior

### Dockerfile Pattern

```dockerfile
# syntax=docker/dockerfile:1.4

# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/schema.graphql ./
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
ENV MCP_SERVER_PORT=1339
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:1339/', r => process.exit(r.statusCode === 200 ? 0 : 1))"
USER node
EXPOSE 1339
CMD ["node", "dist/index.js"]
```

### Key Configuration Points

| Aspect | Decision | Reason |
|--------|----------|--------|
| Base image | `node:20-slim` | glibc compatibility |
| Multi-stage | Separate builder/runtime | Smaller image |
| Non-root | `USER node` | Security |
| Health check | HTTP probe | K8s integration |
| COPY vs ADD | Prefer COPY | Predictability |

---

## 2. NPM Package Configuration for CLI Tools

### Decision: Standard NPM Package with ESM Support

**Rationale:**
- The `package.json` already has `"type": "module"` for ESM
- `bin` entry point configured for CLI usage
- `files` array controls published artifacts
- `.npmignore` must exclude source code, tests, dist

### Required package.json Updates

```json
{
  "name": "alkemio-mcp-server",
  "version": "0.1.0",
  "bin": {
    "alkemio-mcp": "./dist/index.js"
  },
  "files": [
    "dist",
    "schema.graphql"
  ],
  "engines": {
    "node": ">=18.19.0"
  }
}
```

### .npmignore Pattern

```
# Source and build artifacts
src/
tests/
*.ts
!dist/
tsconfig.json
.eslintrc*
.prettier*

# IDE
.vscode/
.idea/

# Git
.git/
.gitignore

# CI/CD
.github/
.gitlab-ci*
.circleci*

# OS
.DS_Store
Thumbs.db

# Temp
*.log
npm-debug.log*
.temp/
tmp/
```

### Dependencies Separation

| Category | Dependencies | DevDependencies |
|----------|-------------|-----------------|
| Runtime | mcp-framework, graphql-request, dotenv, @alkemio/client-lib | typescript, @types/node |
| Build | N/A | typescript |

---

## 3. Traefik Integration for Kubernetes

### Decision: HTTP Routing with Traefik IngressClass

**Rationale:**
- MCP framework uses HTTP streaming transport (HTTP/1.1 or HTTP/2)
- Traefik IngressClass is standard in modern K8s
- ClusterIP service with Traefik native LB for internal routing
- Ingress annotations for connection timeouts (streaming persistence)

### Kubernetes Manifests

```yaml
# Service (ClusterIP)
apiVersion: v1
kind: Service
metadata:
  name: mcp-server
  annotations:
    traefik.io/service.nativelb: "false"
spec:
  type: ClusterIP
  ports:
    - name: http-mcp
      port: 1339
      targetPort: 1339
  selector:
    app: mcp-server

---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: mcp-server
          image: alkemio-mcp:latest
          ports:
            - containerPort: 1339
          env:
            - name: MCP_SERVER_PORT
              value: "1339"
          livenessProbe:
            httpGet:
              path: /health
              port: 1339
            initialDelaySeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 1339
            initialDelaySeconds: 5

---
# Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mcp-server
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.io/ingressclass: traefik
    traefik.ingress.kubernetes.io/router.entrypoints: web,websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
    traefik.ingress.kubernetes.io/router.timeouts.read: "3600s"
    traefik.ingress.kubernetes.io/router.timeouts.write: "3600s"
    traefik.ingress.kubernetes.io/router.timeouts.idle: "3600s"
spec:
  ingressClassName: traefik
  rules:
    - host: mcp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: mcp-server
                port:
                  number: 1339
```

### Key Traefik Annotations

| Annotation | Purpose |
|------------|---------|
| `router.entrypoints` | Expose web and websecure |
| `router.tls` | Enable TLS termination |
| `router.timeouts.*` | Handle long-lived streaming connections |
| `router.middlewares` | Apply protocol middleware |

---

## 4. Ory Kratos Direct HTTP Authentication

### Decision: Direct Kratos HTTP API (Per Constitution III)

**Rationale:**
- Constitution mandates: "The server MUST authenticate via Ory Kratos using HTTP API calls directly (no client library wrapper)"
- Current implementation uses @alkemio/client-lib which needs migration
- Direct HTTP provides full control over authentication flow

### KratosAuth Service Pattern

```typescript
// src/services/KratosAuth.ts
import fetch from 'node-fetch';

interface KratosConfig {
  adminEmail: string;
  adminPassword: string;
  kratosPublicUrl: string;
  graphqlEndpoint: string;
}

export class KratosAuthService {
  private config: KratosConfig;
  private sessionToken: string | null = null;

  constructor() {
    this.config = {
      adminEmail: process.env.AUTH_ADMIN_EMAIL || '',
      adminPassword: process.env.AUTH_ADMIN_PASSWORD || '',
      kratosPublicUrl: process.env.AUTH_ORY_KRATOS_PUBLIC_BASE_URL || '',
      graphqlEndpoint: process.env.API_ENDPOINT_PRIVATE_GRAPHQL || '',
    };
  }

  async authenticate(): Promise<string> {
    // Step 1: Create login flow (API-based)
    const flowResponse = await fetch(
      `${this.config.kratosPublicUrl}/self-service/login/api`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );
    const flow = await flowResponse.json();

    // Step 2: Submit credentials
    const submitResponse = await fetch(
      `${this.config.kratosPublicUrl}/self-service/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': flow.csrf_token,
        },
        body: JSON.stringify({
          method: 'password',
          identifier: this.config.adminEmail,
          password: this.config.adminPassword,
        }),
      }
    );

    if (!submitResponse.ok) {
      throw new Error(`Login failed: ${submitResponse.statusText}`);
    }

    // Step 3: Extract session token from Set-Cookie header
    const cookies = submitResponse.headers.get('Set-Cookie') || '';
    const match = cookies.match(/ory_kratos_session=([^;]+)/);
    this.sessionToken = match ? match[1] : '';

    return this.sessionToken;
  }
}
```

### Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/self-service/login/api` | GET | Create login flow |
| `/self-service/login` | POST | Submit credentials |
| `/sessions/whoami` | GET | Validate session |
| `/sessions/exchange` | POST | Exchange session token |

---

## 5. Dependencies Resolution

| Unknown | Resolution |
|---------|------------|
| Docker base image | `node:20-slim` with multi-stage build |
| NPM package bin config | `bin` field with ESM support |
| Traefik annotations | IngressClass with timeout annotations |
| Kratos HTTP flow | Direct login API with session cookie extraction |
| Node.js version | >=18.19.0 (per package.json engines) |

---

## 6. Assumptions Confirmed

1. Kubernetes cluster with Traefik ingress controller is configured
2. Docker daemon available for building images
3. NPM registry access for publishing
4. TLS via cert-manager for HTTPS endpoints
5. K8s secrets for credential management

---

## 7. References

- [Ory Kratos Self-Service Flows](https://www.ory.sh/docs/kratos/self-service/flows/user-login)
- [Traefik Kubernetes Ingress](https://doc.traefik.io/traefik/providers/kubernetes-ingress/)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [NPM Package bin Field](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin)