// ============================================================================
// GOOGLE OAUTH SERVICE - HUME ISLAMIC DATING APP
// ============================================================================
// Google OAuth authentication service for seamless registration
// Compatible with Expo and React Native environments
// ============================================================================

import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { authService } from './auth.service';
import { CONFIG } from '../config';
import type { AuthUser, AuthTokens } from '../types';

// ================================
// INTERFACE DEFINITIONS
// ================================

interface GoogleAuthConfig {
  clientId: string;
  scopes: string[];
  redirectUri?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name?: string;
  picture?: string;
  verified_email: boolean;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// ================================
// GOOGLE AUTH SERVICE CLASS
// ================================

class GoogleAuthService {
  private config: GoogleAuthConfig;
  private discovery = AuthSession.makeRedirectUri({ useProxy: true });

  constructor() {
    this.config = {
      clientId: this.getClientId(),
      scopes: ['openid', 'profile', 'email'],
      redirectUri: this.discovery,
    };
  }

  // ================================
  // CONFIGURATION METHODS
  // ================================

  private getClientId(): string {
    const currentEnv = CONFIG.ENV;
    
    // For web, use different client ID format
    if (Platform.OS === 'web') {
      return CONFIG.AUTH.GOOGLE_CLIENT_ID[currentEnv] + '.apps.googleusercontent.com';
    }
    
    // For mobile, return the client ID as is
    return CONFIG.AUTH.GOOGLE_CLIENT_ID[currentEnv];
  }

  private getAuthorizationEndpoint(): string {
    return 'https://accounts.google.com/o/oauth2/v2/auth';
  }

  private getTokenEndpoint(): string {
    return 'https://oauth2.googleapis.com/token';
  }

  private getUserInfoEndpoint(): string {
    return 'https://www.googleapis.com/oauth2/v2/userinfo';
  }

  // ================================
  // AUTHENTICATION FLOW
  // ================================

  async signIn(): Promise<AuthUser> {
    try {
      // Step 1: Get authorization code
      const authResult = await this.getAuthorizationCode();
      
      if (!authResult.success || !authResult.code) {
        throw new Error('Failed to get authorization code');
      }

      // Step 2: Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(authResult.code);
      
      // Step 3: Get user info
      const userInfo = await this.getUserInfo(tokenResponse.access_token);
      
      // Step 4: Register/Login with our backend
      const authUser = await this.authenticateWithBackend(tokenResponse, userInfo);
      
      return authUser;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw new Error(error.message || 'Google authentication failed');
    }
  }

  private async getAuthorizationCode(): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      // Generate code verifier and challenge for PKCE
      const codeVerifier = await this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      const authRequestConfig: AuthSession.AuthRequestConfig = {
        clientId: this.config.clientId,
        scopes: this.config.scopes,
        redirectUri: this.config.redirectUri!,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
        },
        additionalParameters: {
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        },
      };

      const authRequest = new AuthSession.AuthRequest(authRequestConfig);
      
      const result = await authRequest.promptAsync({
        authorizationEndpoint: this.getAuthorizationEndpoint(),
      });

      if (result.type === 'success') {
        // Store code verifier for token exchange
        await this.storeCodeVerifier(codeVerifier);
        
        return {
          success: true,
          code: result.params.code,
        };
      } else {
        return {
          success: false,
          error: result.type === 'error' ? result.params.error_description : 'User cancelled',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    try {
      const codeVerifier = await this.getStoredCodeVerifier();
      
      const tokenRequest = {
        client_id: this.config.clientId,
        code: code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri!,
      };

      const response = await fetch(this.getTokenEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: this.encodeFormData(tokenRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Token exchange failed');
      }

      const tokenData: GoogleTokenResponse = await response.json();
      return tokenData;
    } catch (error: any) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  private async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch(this.getUserInfoEndpoint(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo: GoogleUserInfo = await response.json();
      return userInfo;
    } catch (error: any) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  private async authenticateWithBackend(
    tokenResponse: GoogleTokenResponse, 
    userInfo: GoogleUserInfo
  ): Promise<AuthUser> {
    try {
      // Use our existing auth service to handle OAuth login
      const authUser = await authService.loginWithOAuth({
        provider: 'google',
        token: tokenResponse.id_token,
        deviceInfo: {
          deviceId: await this.getDeviceId(),
          platform: Platform.OS,
          version: Platform.Version?.toString() || 'unknown',
        },
      });

      return authUser;
    } catch (error: any) {
      // If user doesn't exist, we could create a new account or throw error
      throw new Error(`Backend authentication failed: ${error.message}`);
    }
  }

  // ================================
  // PKCE HELPER METHODS
  // ================================

  private async generateCodeVerifier(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return this.base64URLEncode(randomBytes);
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64URL }
    );
    return digest;
  }

  private base64URLEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // ================================
  // STORAGE METHODS
  // ================================

  private async storeCodeVerifier(codeVerifier: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        sessionStorage.setItem('@google_code_verifier', codeVerifier);
      } else {
        // For mobile, you might want to use SecureStore
        // await SecureStore.setItemAsync('@google_code_verifier', codeVerifier);
        // For now, we'll use a simple in-memory storage
        (global as any).__googleCodeVerifier = codeVerifier;
      }
    } catch (error) {
      console.error('Failed to store code verifier:', error);
    }
  }

  private async getStoredCodeVerifier(): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        const verifier = sessionStorage.getItem('@google_code_verifier');
        if (!verifier) {
          throw new Error('Code verifier not found');
        }
        return verifier;
      } else {
        // For mobile
        const verifier = (global as any).__googleCodeVerifier;
        if (!verifier) {
          throw new Error('Code verifier not found');
        }
        return verifier;
      }
    } catch (error) {
      throw new Error('Failed to retrieve code verifier');
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private encodeFormData(data: Record<string, string>): string {
    return Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  }

  private async getDeviceId(): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // For web, generate a persistent ID based on browser fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx!.textBaseline = 'top';
        ctx!.font = '14px Arial';
        ctx!.fillText('Device fingerprint', 2, 2);
        const fingerprint = canvas.toDataURL();
        
        // Hash the fingerprint to create a device ID
        const digest = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          fingerprint + navigator.userAgent,
          { encoding: Crypto.CryptoEncoding.HEX }
        );
        
        return digest.substring(0, 32);
      } else {
        // For mobile, you might want to use expo-constants or expo-device
        return 'mobile-device-' + Date.now();
      }
    } catch (error) {
      return 'unknown-device';
    }
  }

  // ================================
  // SIGN OUT METHOD
  // ================================

  async signOut(): Promise<void> {
    try {
      // Clear stored code verifier
      if (Platform.OS === 'web') {
        sessionStorage.removeItem('@google_code_verifier');
      } else {
        delete (global as any).__googleCodeVerifier;
      }

      // Sign out from our auth service
      await authService.logout();
    } catch (error) {
      console.error('Google sign out error:', error);
      throw error;
    }
  }

  // ================================
  // CHECK AUTHENTICATION STATUS
  // ================================

  async isSignedIn(): Promise<boolean> {
    try {
      return await authService.isTokenValid();
    } catch (error) {
      return false;
    }
  }
}

// ================================
// SINGLETON INSTANCE
// ================================

export const googleAuthService = new GoogleAuthService();

// ================================
// CONVENIENCE EXPORTS
// ================================

export const googleAuth = {
  signIn: googleAuthService.signIn.bind(googleAuthService),
  signOut: googleAuthService.signOut.bind(googleAuthService),
  isSignedIn: googleAuthService.isSignedIn.bind(googleAuthService),
};

export default googleAuthService;
