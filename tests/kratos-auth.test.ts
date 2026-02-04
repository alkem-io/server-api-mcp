/**
 * Kratos Authentication Integration Tests
 * Tests for the direct Kratos HTTP authentication service
 */

import { KratosAuthService, getKratosAuthService } from '../src/services/KratosAuth.js';
import { setupMockEnv, cleanupMockEnv, createMockFetchResponse } from './test-utils';

describe('KratosAuth Constructor Validation', () => {
  afterEach(() => {
    // Restore environment variables
    process.env.AUTH_ADMIN_EMAIL = 'test@example.com';
    process.env.AUTH_ADMIN_PASSWORD = 'testpassword123';
    process.env.AUTH_ORY_KRATOS_PUBLIC_BASE_URL = 'https://kratos.example.com';
    process.env.API_ENDPOINT_PRIVATE_GRAPHQL = 'https://api.example.com/graphql';
  });

  it('should throw error when AUTH_ADMIN_EMAIL is missing', () => {
    delete process.env.AUTH_ADMIN_EMAIL;
    expect(() => new KratosAuthService()).toThrow('AUTH_ADMIN_EMAIL');
  });

  it('should throw error when AUTH_ADMIN_PASSWORD is missing', () => {
    delete process.env.AUTH_ADMIN_PASSWORD;
    expect(() => new KratosAuthService()).toThrow('AUTH_ADMIN_PASSWORD');
  });

  it('should throw error when AUTH_ORY_KRATOS_PUBLIC_BASE_URL is missing', () => {
    delete process.env.AUTH_ORY_KRATOS_PUBLIC_BASE_URL;
    expect(() => new KratosAuthService()).toThrow('AUTH_ORY_KRATOS_PUBLIC_BASE_URL');
  });

  it('should throw error when API_ENDPOINT_PRIVATE_GRAPHQL is missing', () => {
    delete process.env.API_ENDPOINT_PRIVATE_GRAPHQL;
    expect(() => new KratosAuthService()).toThrow('API_ENDPOINT_PRIVATE_GRAPHQL');
  });
});

describe('KratosAuth Service Methods', () => {
  let service: KratosAuthService;

  beforeAll(() => {
    setupMockEnv();
    service = new KratosAuthService();
  });

  afterAll(() => {
    cleanupMockEnv();
  });

  describe('isAuthenticated', () => {
    it('should return false before authentication', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false with null session token', () => {
      // Create fresh instance to verify initial state
      const freshService = new KratosAuthService();
      expect(freshService.isAuthenticated()).toBe(false);
    });
  });

  describe('getSessionToken', () => {
    it('should return null before authentication', () => {
      expect(service.getSessionToken()).toBeNull();
    });
  });

  describe('getGraphQLClient', () => {
    it('should throw error before authentication', () => {
      expect(() => service.getGraphQLClient()).toThrow('Not authenticated');
    });
  });

  describe('validateSession', () => {
    it('should return false when not authenticated', async () => {
      const result = await service.validateSession();
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear session on logout', async () => {
      await service.logout();
      expect(service.getSessionToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});

describe('KratosAuth Singleton Pattern', () => {
  beforeAll(() => {
    setupMockEnv();
  });

  afterAll(() => {
    cleanupMockEnv();
  });

  it('should return same instance for multiple calls', () => {
    const instance1 = getKratosAuthService();
    const instance2 = getKratosAuthService();
    expect(instance1).toBe(instance2);
  });
});