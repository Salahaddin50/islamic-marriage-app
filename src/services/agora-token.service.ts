// Agora Token Service
// Handles token generation for secure video calls

export interface TokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiresAt: number;
}

export class AgoraTokenService {
  private static readonly TOKEN_SERVER_URL = process.env.EXPO_PUBLIC_TOKEN_SERVER_URL || 'http://localhost:3001';

  /**
   * Generate a token for joining an Agora channel
   * @param channelName - The channel name to join
   * @param uid - User ID (optional, will be auto-generated if not provided)
   * @param role - User role: 'publisher' or 'audience'
   */
  static async generateToken(
    channelName: string, 
    uid?: number, 
    role: 'publisher' | 'audience' = 'publisher'
  ): Promise<TokenResponse> {
    try {
      const response = await fetch(`${this.TOKEN_SERVER_URL}/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelName,
          uid,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token server responded with status: ${response.status}`);
      }

      const tokenData: TokenResponse = await response.json();
      return tokenData;

    } catch (error) {
      console.error('Failed to generate Agora token:', error);
      throw new Error('Unable to generate video call token. Please try again.');
    }
  }

  /**
   * Check if token server is available
   */
  static async checkTokenServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.TOKEN_SERVER_URL}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error('Token server health check failed:', error);
      return false;
    }
  }
}
