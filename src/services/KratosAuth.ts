/**
 * KratosAuth Service - Direct Ory Kratos HTTP Authentication
 *
 * This service handles authentication with Alkemio using Ory Kratos
 * via direct HTTP API calls, following Constitution III requirements.
 */

import { GraphQLClient } from 'graphql-request';

interface KratosConfig {
  adminEmail: string;
  adminPassword: string;
  kratosPublicUrl: string;
  graphqlEndpoint: string;
}

interface KratosLoginFlow {
  id: string;
  ui: { nodes: Array<{ attributes: { name: string; value: string } }> };
}

interface LoginResponse {
  session_token?: string;
  identity?: unknown;
}

export class KratosAuthService {
  private config: KratosConfig;
  private sessionToken: string | null = null;
  private graphqlClient: GraphQLClient | null = null;

  constructor() {
    this.config = {
      adminEmail: process.env.AUTH_ADMIN_EMAIL || '',
      adminPassword: process.env.AUTH_ADMIN_PASSWORD || '',
      kratosPublicUrl: process.env.AUTH_ORY_KRATOS_PUBLIC_BASE_URL || '',
      graphqlEndpoint: process.env.API_ENDPOINT_PRIVATE_GRAPHQL || '',
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    const missing: string[] = [];

    if (!this.config.adminEmail) {
      missing.push('AUTH_ADMIN_EMAIL');
    }
    if (!this.config.adminPassword) {
      missing.push('AUTH_ADMIN_PASSWORD');
    }
    if (!this.config.kratosPublicUrl) {
      missing.push('AUTH_ORY_KRATOS_PUBLIC_BASE_URL');
    }
    if (!this.config.graphqlEndpoint) {
      missing.push('API_ENDPOINT_PRIVATE_GRAPHQL');
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Authenticate with Kratos and obtain session token
   */
  async authenticate(): Promise<string> {
    try {
      // Step 1: Create login flow
      const flowResponse = await fetch(
        `${this.config.kratosPublicUrl}/self-service/login/api`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!flowResponse.ok) {
        throw new Error(`Failed to create login flow: ${flowResponse.statusText}`);
      }

      const flow: KratosLoginFlow = await flowResponse.json();

      // Extract CSRF token from form nodes
      const csrfNode = flow.ui.nodes.find(
        (node) => node.attributes.name === 'csrf_token'
      );
      const csrfToken = csrfNode?.attributes.value || '';

      // Step 2: Submit credentials
      const submitResponse = await fetch(
        `${this.config.kratosPublicUrl}/self-service/login?flow=${flow.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            method: 'password',
            identifier: this.config.adminEmail,
            password: this.config.adminPassword,
            csrf_token: csrfToken,
          }),
        }
      );

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        throw new Error(
          `Login failed: ${submitResponse.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      // Step 3: Extract session token from response
      const responseData: LoginResponse = await submitResponse.json();

      if (!responseData.session_token) {
        throw new Error('No session token in login response');
      }

      this.sessionToken = responseData.session_token;

      // Initialize GraphQL client with Bearer token
      this.graphqlClient = new GraphQLClient(this.config.graphqlEndpoint, {
        headers: {
          authorization: `Bearer ${this.sessionToken}`,
        },
      });

      console.log('✅ Successfully authenticated with Kratos');
      return this.sessionToken;
    } catch (error) {
      console.error('❌ Kratos authentication failed:', error);
      throw new Error(
        `Kratos authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the authenticated GraphQL client
   */
  getGraphQLClient(): GraphQLClient {
    if (!this.graphqlClient) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
    return this.graphqlClient;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.sessionToken !== null && this.graphqlClient !== null;
  }

  /**
   * Get session token
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Validate session with Kratos
   */
  async validateSession(): Promise<boolean> {
    if (!this.sessionToken) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.config.kratosPublicUrl}/sessions/whoami`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${this.sessionToken}`,
            accept: 'application/json',
          },
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    if (this.sessionToken) {
      try {
        await fetch(`${this.config.kratosPublicUrl}/self-service/logout`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.sessionToken}`,
          },
        });
      } catch {
        // Ignore logout errors
      }
    }

    this.sessionToken = null;
    this.graphqlClient = null;
  }
}

// Singleton instance
let kratosAuthInstance: KratosAuthService | null = null;

/**
 * Get the global KratosAuth service instance
 */
export function getKratosAuthService(): KratosAuthService {
  if (!kratosAuthInstance) {
    kratosAuthInstance = new KratosAuthService();
  }
  return kratosAuthInstance;
}