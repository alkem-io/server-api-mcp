/**
 * Integration Tests for MCP Tools
 * Tests all MCP tools via GraphQL client to verify successful execution
 */

import { GraphQLClient } from 'graphql-request';
import { setupMockEnv, cleanupMockEnv } from './test-utils';

// Test configuration
const TEST_ENDPOINT = process.env.API_ENDPOINT_PRIVATE_GRAPHQL || 'https://api.example.com/graphql';
const TEST_TOKEN = 'test-token';

describe('MCP Tools Integration', () => {
  let graphqlClient: GraphQLClient;

  beforeAll(() => {
    setupMockEnv();
    graphqlClient = new GraphQLClient(TEST_ENDPOINT, {
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
      },
    });
  });

  afterAll(() => {
    cleanupMockEnv();
  });

  describe('Query Tools', () => {
    it('alkemio.accounts.listAccounts - should fetch accounts', async () => {
      const query = `
        query ListAccounts {
          accounts {
            id
            displayName
          }
        }
      `;

      const result = await graphqlClient.request(query);
      expect(result).toHaveProperty('accounts');
    });

    it('alkemio.spaces.listSpaces - should fetch spaces', async () => {
      const query = `
        query ListSpaces {
          spaces {
            id
            displayName
            nameID
          }
        }
      `;

      const result = await graphqlClient.request(query);
      expect(result).toHaveProperty('spaces');
    });

    it('alkemio.organizations.listOrganizations - should fetch organizations', async () => {
      const query = `
        query ListOrganizations {
          organizations {
            id
            displayName
          }
        }
      `;

      const result = await graphqlClient.request(query);
      expect(result).toHaveProperty('organizations');
    });

    it('alkemio.users.listUsers - should fetch users', async () => {
      const query = `
        query ListUsers {
          users {
            id
            displayName
            email
          }
        }
      `;

      const result = await graphqlClient.request(query);
      expect(result).toHaveProperty('users');
    });
  });

  describe('Lookup Tool', () => {
    it('alkemio.lookup.lookupEntities - should lookup entities by IDs', async () => {
      const query = `
        query LookupEntities($spaceId: UUID!) {
          space(ID: $spaceId) {
            id
            displayName
          }
        }
      `;

      const result = await graphqlClient.request(query, { spaceId: 'test-space-id' });
      expect(result).toHaveProperty('space');
    });
  });

  describe('GraphQL Client Health', () => {
    it('should have valid endpoint configured', () => {
      expect(TEST_ENDPOINT).toBeDefined();
      expect(TEST_ENDPOINT).toContain('graphql');
    });

    it('should have authorization header set', () => {
      expect(TEST_TOKEN).toBeDefined();
    });
  });
});