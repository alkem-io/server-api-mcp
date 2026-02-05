import { AlkemioClient, createConfigUsingEnvVars, AlkemioClientConfig } from '@alkemio/client-lib';
import dotenv from 'dotenv';

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
  }

  /**
   * Initialize authentication with the Alkemio platform
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔐 Authenticating with Alkemio platform...');
      
      // Enable authentication
      await this.client.enableAuthentication();
      this.apiToken = this.client.apiToken; // Store the API token
      
      // Validate the connection
      const serverVersion = await this.client.validateConnection();
      
      this.isAuthenticated = true;
      console.log(`✅ Successfully connected to Alkemio platform (version: ${serverVersion})`);
      
    } catch (error) {
      console.error('❌ Failed to authenticate with Alkemio platform:', error);
      throw new Error(`Alkemio authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  /**
   * Set authentication from external source (e.g., KratosAuthService)
   */
  setExternalAuth(apiToken: string, graphqlEndpoint: string): void {
    this.apiToken = apiToken;
    this.clientConfig.apiEndpointPrivateGraphql = graphqlEndpoint;
    this.isAuthenticated = true;
    console.log('✅ AlkemioService initialized with external authentication');
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

/**
 * Initialize AlkemioService with external authentication (from KratosAuthService)
 */
export function initializeAlkemioServiceWithToken(apiToken: string, graphqlEndpoint: string): AlkemioService {
  if (!alkemioServiceInstance) {
    alkemioServiceInstance = new AlkemioService();
  }
  alkemioServiceInstance.setExternalAuth(apiToken, graphqlEndpoint);
  return alkemioServiceInstance;
}
