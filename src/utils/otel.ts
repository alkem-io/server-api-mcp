/**
 * OpenTelemetry Configuration
 * Distributed tracing for Alkemio MCP Server
 *
 * Note: Full OpenTelemetry requires @opentelemetry packages.
 * This module provides a minimal tracing interface that can be extended.
 */

type Tracer = {
  startSpan: (name: string, options?: SpanOptions) => Span;
  getActiveSpan?: () => Span | null;
};

interface SpanOptions {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  parentSpan?: SpanContext;
}

interface SpanContext {
  spanId?: string;
  traceId?: string;
}

interface Span {
  end: () => void;
  setStatus: (status: { code: number; message?: string }) => void;
  setAttribute: (key: string, value: string | number | boolean) => void;
  recordException: (error: Error) => void;
}

// In-memory span storage for development
const activeSpans: Span[] = [];

/**
 * Minimal Span implementation for development
 */
class MinimalSpan implements Span {
  private ended = false;

  constructor(
    public readonly name: string,
    public readonly attributes: Record<string, string | number | boolean> = {}
  ) {
    activeSpans.push(this);
  }

  end(): void {
    this.ended = true;
    const index = activeSpans.indexOf(this);
    if (index > -1) {
      activeSpans.splice(index, 1);
    }
  }

  setStatus(status: { code: number; message?: string }): void {
    if (status.code !== 0) {
      console.log(`[TRACE] Span ${this.name} status: ${status.message || 'error'}`);
    }
  }

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }

  recordException(error: Error): void {
    console.log(`[TRACE] Span ${this.name} exception: ${error.message}`);
  }
}

// Singleton tracer instance
let tracerInstance: Tracer | null = null;
let isInitialized = false;

/**
 * Initialize tracing (no-op for minimal implementation)
 * Full OpenTelemetry initialization deferred to package installation
 */
export function initOpenTelemetry(): void {
  if (isInitialized) {
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || 'alkemio-mcp-server';
  const logLevel = process.env.LOG_LEVEL || 'info';

  // Minimal tracer that creates spans without external dependencies
  tracerInstance = {
    startSpan: (name: string, options?: SpanOptions): Span => {
      return new MinimalSpan(name, options?.attributes);
    },
  };

  isInitialized = true;
  console.log(`[OTEL] OpenTelemetry initialized (minimal mode): ${serviceName}, logLevel: ${logLevel}`);
}

/**
 * Get the tracer instance
 */
export function getTracer(): Tracer {
  if (!tracerInstance) {
    tracerInstance = {
      startSpan: (name: string) => new MinimalSpan(name),
    };
  }
  return tracerInstance;
}

/**
 * Create a traced span for an operation
 */
export function createSpan(options: SpanOptions): Span {
  const tracer = getTracer();
  return tracer.startSpan(options.name, {
    ...options,
    attributes: {
      'service.name': 'alkemio-mcp-server',
      ...options.attributes,
    },
  });
}

/**
 * Execute an operation within a traced span
 */
export async function withSpan<T>(
  options: SpanOptions,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = createSpan(options);

  try {
    const result = await fn(span);
    span.setStatus({ code: 0 }); // OK
    return result;
  } catch (error) {
    span.setStatus({
      code: 1, // ERROR
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Trace a GraphQL operation
 */
export async function traceGraphQLOperation<T>(
  operationName: string,
  query: string,
  variables: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(
    {
      name: `graphql.${operationName}`,
      attributes: {
        'graphql.operation': operationName,
        'graphql.query.length': query.length,
        'graphql.variables.keys': JSON.stringify(Object.keys(variables)),
      },
    },
    async () => {
      console.log(`[TRACE] Starting GraphQL operation: ${operationName}`);
      const result = await fn();
      console.log(`[TRACE] Completed GraphQL operation: ${operationName}`);
      return result;
    }
  );
}

/**
 * Trace an MCP tool execution
 */
export async function traceMCPTool<T>(
  toolName: string,
  input: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(
    {
      name: `mcp.tool.${toolName}`,
      attributes: {
        'mcp.tool.name': toolName,
        'mcp.tool.input.keys': JSON.stringify(Object.keys(input)),
      },
    },
    async () => {
      console.log(`[TRACE] Executing MCP tool: ${toolName}`);
      const result = await fn();
      console.log(`[TRACE] MCP tool completed: ${toolName}`);
      return result;
    }
  );
}

// Auto-initialize if enabled
if (process.env.OTEL_ENABLED === 'true') {
  initOpenTelemetry();
}

// Re-export for convenience
export { tracerInstance };