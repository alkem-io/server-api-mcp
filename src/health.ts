/**
 * Health Check Endpoint
 * Kubernetes-ready health and readiness probes for Alkemio MCP Server
 */

import { logger } from './utils/logger.js';
import { getMetrics } from './metrics.js';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    server: boolean;
    authentication: boolean;
    graphql: boolean;
  };
}

interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  lastCheck: string;
  checks: {
    server: boolean;
    auth: boolean;
  };
}

// Health check state
let isServerHealthy = true;
let isAuthenticated = false;
let lastAuthCheck: string | null = null;

/**
 * Update health status
 */
export function setServerHealth(healthy: boolean): void {
  isServerHealthy = healthy;
  logger.debug('Server health updated', { healthy, status: isServerHealthy ? 'ok' : 'error' });
}

/**
 * Update authentication status
 */
export function setAuthStatus(authenticated: boolean): void {
  isAuthenticated = authenticated;
  lastAuthCheck = new Date().toISOString();
  logger.debug('Auth status updated', { authenticated, lastCheck: lastAuthCheck });
}

/**
 * Get comprehensive health status
 */
export function getHealthStatus(): HealthStatus {
  const metrics = getMetrics();

  return {
    status: isServerHealthy ? 'ok' : 'error',
    version: metrics.version,
    uptime: metrics.uptime,
    timestamp: new Date().toISOString(),
    checks: {
      server: isServerHealthy,
      authentication: isAuthenticated,
      graphql: isServerHealthy,
    },
  };
}

/**
 * Get readiness status (for K8s readiness probe)
 */
export function getReadinessStatus(): ReadinessStatus {
  return {
    status: isAuthenticated ? 'ready' : 'not_ready',
    lastCheck: new Date().toISOString(),
    checks: {
      server: isServerHealthy,
      auth: isAuthenticated,
    },
  };
}

/**
 * HTTP response helper
 */
interface HttpResponse {
  statusCode: number;
  setHeader(key: string, value: string): void;
  end(body: string): void;
}

/**
 * HTTP handler for /health endpoint
 */
export function healthHandler(_req: { url?: string }, res: HttpResponse): void {
  const status = getHealthStatus();

  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Set status code based on health
  res.statusCode = status.status === 'ok' ? 200 : 503;

  res.end(JSON.stringify(status, null, 2));

  logger.debug('Health check response', { status: status.status, statusCode: res.statusCode });
}

/**
 * HTTP handler for /healthz endpoint (Kubernetes liveness probe)
 */
export function healthzHandler(_req: { url?: string }, res: HttpResponse): void {
  // Simple liveness check - just return ok
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.statusCode = 200;

  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  res.end(JSON.stringify(response));
}

/**
 * HTTP handler for /ready endpoint (Kubernetes readiness probe)
 */
export function readinessHandler(_req: { url?: string }, res: HttpResponse): void {
  const status = getReadinessStatus();

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.statusCode = status.status === 'ready' ? 200 : 503;

  res.end(JSON.stringify(status));

  logger.debug('Readiness check response', { status: status.status, statusCode: res.statusCode });
}

/**
 * Execute a health check and update status
 */
export async function runHealthCheck(): Promise<HealthStatus> {
  // Update server health based on current state
  setServerHealth(isServerHealthy && isAuthenticated);

  return getHealthStatus();
}