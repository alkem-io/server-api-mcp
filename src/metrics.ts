/**
 * Metrics Endpoint
 * Prometheus-compatible metrics for the Alkemio MCP Server
 */

import { logger } from './utils/logger.js';

// Metric counters
const counters: Record<string, number> = {
  toolRequests: 0,
  toolErrors: 0,
  authAttempts: 0,
  authSuccess: 0,
  authFailure: 0,
  graphqlRequests: 0,
  graphqlErrors: 0,
};

// Start time for uptime calculations
const startTime = Date.now();

interface MetricsResponse {
  status: string;
  uptime: number;
  version: string;
  timestamp: string;
  metrics: Record<string, number>;
}

/**
 * Get current metrics
 */
export function getMetrics(): MetricsResponse {
  return {
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
    metrics: { ...counters },
  };
}

/**
 * Increment a counter metric
 */
export function incrementCounter(metric: keyof typeof counters, value: number = 1): void {
  if (counters[metric] !== undefined) {
    counters[metric] += value;
  }
}

/**
 * Increment tool request counter
 */
export function recordToolRequest(toolName: string): void {
  counters.toolRequests++;
  logger.debug('Tool request recorded', { tool: toolName, totalRequests: counters.toolRequests });
}

/**
 * Increment tool error counter
 */
export function recordToolError(toolName: string, error: string): void {
  counters.toolErrors++;
  logger.debug('Tool error recorded', { tool: toolName, error, totalErrors: counters.toolErrors });
}

/**
 * Increment auth attempt counter
 */
export function recordAuthAttempt(success: boolean): void {
  counters.authAttempts++;
  if (success) {
    counters.authSuccess++;
    logger.debug('Auth attempt successful', { attempts: counters.authAttempts, success: counters.authSuccess });
  } else {
    counters.authFailure++;
    logger.debug('Auth attempt failed', { attempts: counters.authAttempts, failures: counters.authFailure });
  }
}

/**
 * Increment GraphQL request counter
 */
export function recordGraphQLRequest(success: boolean): void {
  counters.graphqlRequests++;
  if (!success) {
    counters.graphqlErrors++;
  }
  logger.debug('GraphQL request recorded', { total: counters.graphqlRequests, errors: counters.graphqlErrors });
}

/**
 * Format metrics as Prometheus text format
 */
export function formatPrometheusMetrics(): string {
  const metrics = getMetrics();
  const lines = [
    '# HELP alkemio_mcp_server_status Server status indicator',
    '# TYPE alkemio_mcp_server_status gauge',
    `alkemio_mcp_server_status ${metrics.status === 'ok' ? 1 : 0}`,
    '',
    '# HELP alkemio_mcp_server_uptime_seconds Server uptime in seconds',
    '# TYPE alkemio_mcp_server_uptime_seconds gauge',
    `alkemio_mcp_server_uptime_seconds ${metrics.uptime}`,
    '',
    '# HELP alkemio_mcp_tool_requests_total Total number of tool requests',
    '# TYPE alkemio_mcp_tool_requests_total counter',
    `alkemio_mcp_tool_requests_total ${metrics.metrics.toolRequests}`,
    '',
    '# HELP alkemio_mcp_tool_errors_total Total number of tool errors',
    '# TYPE alkemio_mcp_tool_errors_total counter',
    `alkemio_mcp_tool_errors_total ${metrics.metrics.toolErrors}`,
    '',
    '# HELP alkemio_mcp_auth_attempts_total Total number of authentication attempts',
    '# TYPE alkemio_mcp_auth_attempts_total counter',
    `alkemio_mcp_auth_attempts_total ${metrics.metrics.authAttempts}`,
    '',
    '# HELP alkemio_mcp_auth_success_total Total number of successful authentications',
    '# TYPE alkemio_mcp_auth_success_total counter',
    `alkemio_mcp_auth_success_total ${metrics.metrics.authSuccess}`,
    '',
    '# HELP alkemio_mcp_auth_failures_total Total number of authentication failures',
    '# TYPE alkemio_mcp_auth_failures_total counter',
    `alkemio_mcp_auth_failures_total ${metrics.metrics.authFailure}`,
    '',
    '# HELP alkemio_mcp_graphql_requests_total Total number of GraphQL requests',
    '# TYPE alkemio_mcp_graphql_requests_total counter',
    `alkemio_mcp_graphql_requests_total ${metrics.metrics.graphqlRequests}`,
    '',
    '# HELP alkemio_mcp_graphql_errors_total Total number of GraphQL errors',
    '# TYPE alkemio_mcp_graphql_errors_total counter',
    `alkemio_mcp_graphql_errors_total ${metrics.metrics.graphqlErrors}`,
    '',
  ];

  return lines.join('\n');
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
 * HTTP handler for /metrics endpoint
 */
export function metricsHandler(_req: { url?: string }, res: HttpResponse): void {
  const metrics = getMetrics();

  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.statusCode = 200;
  res.end(JSON.stringify(metrics, null, 2));
}

/**
 * Prometheus metrics handler
 */
export function prometheusHandler(_req: { url?: string }, res: HttpResponse): void {
  const metrics = formatPrometheusMetrics();

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.statusCode = 200;
  res.end(metrics);
}