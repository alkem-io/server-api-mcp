/**
 * Test utilities for the Alkemio MCP Server test suite
 */

import { GraphQLClient } from 'graphql-request';

// Mock environment variables for testing
export const mockEnvVars = {
  API_ENDPOINT_PRIVATE_GRAPHQL: 'https://api.example.com/graphql',
  AUTH_ADMIN_EMAIL: 'test@example.com',
  AUTH_ADMIN_PASSWORD: 'testpassword123',
  AUTH_ORY_KRATOS_PUBLIC_BASE_URL: 'https://kratos.example.com',
  MCP_SERVER_PORT: '1339',
};

// Setup function to apply mock environment variables
export function setupMockEnv(): void {
  Object.entries(mockEnvVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

// Cleanup function to reset environment variables
export function cleanupMockEnv(): void {
  Object.keys(mockEnvVars).forEach((key) => {
    delete process.env[key];
  });
}

// Create a mock GraphQL client for testing
export function createMockGraphQLClient(): GraphQLClient {
  const endpoint = process.env.API_ENDPOINT_PRIVATE_GRAPHQL || 'https://api.example.com/graphql';
  return new GraphQLClient(endpoint, {
    headers: {
      authorization: 'Bearer mock-token',
    },
  });
}

// Async helper to wait for a specified duration
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to create a mock fetch response
export function createMockFetchResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  } as Response;
}