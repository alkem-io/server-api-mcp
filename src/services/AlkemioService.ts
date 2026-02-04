import { AlkemioClient, createConfigUsingEnvVars, AlkemioClientConfig } from '@alkemio/client-lib';
import dotenv from 'dotenv';
import { traceGraphQLOperation, traceMCPTool, getTracer } from '../utils/otel.js';
import { logger, logToolExecution } from '../utils/logger.js';

export class AlkemioService {
  private client: AlkemioClient;
  private isAuthenticated: boolean = false;
  private apiToken: string | undefined; // Added to store the API token
  private clientConfig: AlkemioClientConfig; // Added to store clientConfig

  constructor(config?: AlkemioClientConfig) {
    // Load environment variables
    dotenv.config();

    // Use provided config or create from environment variables
    this.clientConfig = config || createConfigUsingEnvVars(); // Store clientConfig

    this.client = new AlkemioClient(this.clientConfig);

    logger.info('AlkemioService initialized', {
      endpoint: this.clientConfig.apiEndpointPrivateGraphql,
    });
  }

  /**
   * Initialize authentication with the Alkemio platform
   */
  async initialize(): Promise<void> {
    await traceMCPTool(
      'alkemio.initialize',
      { action: 'authenticate' },
      async () => {
        try {
          logToolExecution('AlkemioService', 'initialize', { action: 'authenticate' });
          logger.info('Authenticating with Alkemio platform...');

          // Enable authentication
          await this.client.enableAuthentication();
          this.apiToken = this.client.apiToken; // Store the API token

          // Validate the connection
          const serverVersion = await this.client.validateConnection();

          this.isAuthenticated = true;
          logger.info('Successfully connected to Alkemio platform', { serverVersion });

        } catch (error) {
          logger.error('Failed to authenticate with Alkemio platform', error as Error);
          throw new Error(`Alkemio authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    );
  }

  /**
   * Get the authenticated Alkemio client
   */
  getClient(): AlkemioClient {
    if (!this.isAuthenticated) {
      throw new Error('Alkemio service not authenticated. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Check if the service is authenticated
   */
  isReady(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get the API token if authenticated
   */
  getApiToken(): string | undefined {
    if (!this.isAuthenticated) {
      console.warn('Attempted to get API token before authentication.');
      return undefined;
    }
    return this.apiToken;
  }

  /**
   * Get the GraphQL API endpoint
   */
  getGraphqlEndpoint(): string | undefined {
    return this.clientConfig.apiEndpointPrivateGraphql;
  }

  /**
   * Test if a space exists (useful for health checks)
   */
  async testSpaceAccess(spaceId: string = 'eco1'): Promise<boolean> {
    if (!this.isAuthenticated) {
      return false;
    }
    
    try {
      return await this.client.spaceExists(spaceId);
    } catch (error) {
      console.warn(`Warning: Could not check space '${spaceId}':`, error);
      return false;
    }
  }

  /**
   * Get server version for diagnostics
   */
  async getServerVersion(): Promise<string> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }
    return await this.client.serverVersion();
  }
}

// Singleton instance
let alkemioServiceInstance: AlkemioService | null = null;

/**
 * Get the global Alkemio service instance
 */
export function getAlkemioService(): AlkemioService {
  if (!alkemioServiceInstance) {
    alkemioServiceInstance = new AlkemioService();
  }
  return alkemioServiceInstance;
}
