import { AlkemioClient, createConfigUsingEnvVars, AlkemioClientConfig } from '@alkemio/client-lib';
import dotenv from 'dotenv';

export class AlkemioService {
  private client: AlkemioClient;
  private isAuthenticated: boolean = false;

  constructor(config?: AlkemioClientConfig) {
    // Load environment variables
    dotenv.config();
    
    // Use provided config or create from environment variables
    const clientConfig = config || createConfigUsingEnvVars();
    
    this.client = new AlkemioClient(clientConfig);
  }

  /**
   * Initialize authentication with the Alkemio platform
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔐 Authenticating with Alkemio platform...');
      
      // Enable authentication
      await this.client.enableAuthentication();
      
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
