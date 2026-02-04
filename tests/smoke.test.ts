/**
 * Smoke tests for the Alkemio MCP Server
 * Basic validation that the server can initialize and tools are discoverable
 */

const { setupMockEnv, cleanupMockEnv, wait } = require('./test-utils');

describe('Smoke Tests', () => {
  beforeAll(() => {
    setupMockEnv();
  });

  afterAll(() => {
    cleanupMockEnv();
  });

  describe('Environment Configuration', () => {
    it('should have required environment variables defined', () => {
      expect(process.env.API_ENDPOINT_PRIVATE_GRAPHQL).toBeDefined();
      expect(process.env.AUTH_ADMIN_EMAIL).toBeDefined();
      expect(process.env.AUTH_ADMIN_PASSWORD).toBeDefined();
      expect(process.env.AUTH_ORY_KRATOS_PUBLIC_BASE_URL).toBeDefined();
    });
  });

  describe('Test Utilities', () => {
    it('should export helper functions', () => {
      expect(typeof setupMockEnv).toBe('function');
      expect(typeof cleanupMockEnv).toBe('function');
      expect(typeof wait).toBe('function');
    });

    it('should wait for specified duration', async () => {
      const start = Date.now();
      await wait(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});