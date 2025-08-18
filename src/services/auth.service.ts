// ============================================================================
// ENTERPRISE AUTHENTICATION SERVICE - HUME DATING APP
// ============================================================================
// Secure authentication service with OAuth, biometrics, and token management
// Follows enterprise security standards and OWASP guidelines
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from '../api/client';
import { CONFIG } from '../config';
import { useAuthStore } from '../store';
import type { AuthTokens, AuthUser, ApiResponse } from '../types';

// ================================
// TYPE DEFINITIONS
// ================================

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  dateOfBirth: string;
  acceptTerms: boolean;
}

interface OAuthCredentials {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
  deviceInfo?: {
    deviceId: string;
    platform: string;
    version: string;
  };
}

interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  resetToken: string;
}

interface BiometricConfig {
  title: string;
  subtitle: string;
  description?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

// ================================
// AUTHENTICATION SERVICE CLASS
// ================================

class AuthenticationService {
  private tokenRefreshPromise: Promise<AuthTokens> | null = null;

  // ================================
  // EMAIL/PASSWORD AUTHENTICATION
  // ================================

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      // Validate input
      this.validateEmail(credentials.email);
      this.validatePassword(credentials.password);

      // Make API call
      const response = await api.post<{
        user: AuthUser;
        tokens: AuthTokens;
      }>('/auth/login', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        deviceInfo: await this.getDeviceInfo(),
      });

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      const { user, tokens } = response.data;

      // Store tokens securely
      await this.storeTokens(tokens, credentials.rememberMe);

      // Store user data
      await this.storeUserData(user);

      // Update auth store
      useAuthStore.getState().login(user, tokens);

      // Log successful login (without sensitive data)
      this.logSecurityEvent('login_success', {
        userId: user.id,
        email: user.email,
        platform: Platform.OS,
      });

      return user;
    } catch (error: any) {
      // Log failed login attempt
      this.logSecurityEvent('login_failed', {
        email: credentials.email,
        error: error.message,
        platform: Platform.OS,
      });

      throw this.handleAuthError(error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      // Validate input
      this.validateEmail(credentials.email);
      this.validatePassword(credentials.password);
      this.validateName(credentials.firstName);

      if (!credentials.acceptTerms) {
        throw new Error('You must accept the terms and conditions');
      }

      // Make API call
      const response = await api.post<{
        user: AuthUser;
        tokens: AuthTokens;
      }>('/auth/register', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        firstName: credentials.firstName.trim(),
        lastName: credentials.lastName?.trim(),
        dateOfBirth: credentials.dateOfBirth,
        deviceInfo: await this.getDeviceInfo(),
      });

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      const { user, tokens } = response.data;

      // Store tokens securely
      await this.storeTokens(tokens, true);

      // Store user data
      await this.storeUserData(user);

      // Update auth store
      useAuthStore.getState().login(user, tokens);

      // Log successful registration
      this.logSecurityEvent('register_success', {
        userId: user.id,
        email: user.email,
        platform: Platform.OS,
      });

      return user;
    } catch (error: any) {
      // Log failed registration
      this.logSecurityEvent('register_failed', {
        email: credentials.email,
        error: error.message,
        platform: Platform.OS,
      });

      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const tokens = useAuthStore.getState().tokens;
      
      // Notify server about logout
      if (tokens) {
        try {
          await api.post('/auth/logout', {
            refreshToken: tokens.refreshToken,
          });
        } catch (error) {
          // Continue with logout even if server call fails
          console.warn('Failed to notify server about logout:', error);
        }
      }

      // Clear stored data
      await this.clearStoredData();

      // Update auth store
      useAuthStore.getState().logout();

      // Log logout event
      this.logSecurityEvent('logout_success', {
        platform: Platform.OS,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout properly');
    }
  }

  // ================================
  // OAUTH AUTHENTICATION
  // ================================

  async loginWithOAuth(credentials: OAuthCredentials): Promise<AuthUser> {
    try {
      const response = await api.post<{
        user: AuthUser;
        tokens: AuthTokens;
      }>(`/auth/oauth/${credentials.provider}`, {
        token: credentials.token,
        deviceInfo: credentials.deviceInfo || await this.getDeviceInfo(),
      });

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      const { user, tokens } = response.data;

      // Store tokens securely
      await this.storeTokens(tokens, true);

      // Store user data
      await this.storeUserData(user);

      // Update auth store
      useAuthStore.getState().login(user, tokens);

      // Log successful OAuth login
      this.logSecurityEvent('oauth_login_success', {
        userId: user.id,
        provider: credentials.provider,
        platform: Platform.OS,
      });

      return user;
    } catch (error: any) {
      // Log failed OAuth login
      this.logSecurityEvent('oauth_login_failed', {
        provider: credentials.provider,
        error: error.message,
        platform: Platform.OS,
      });

      throw this.handleAuthError(error);
    }
  }

  // ================================
  // BIOMETRIC AUTHENTICATION
  // ================================

  async isBiometricAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false; // Biometrics not available on web
      }

      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      return isAvailable && isEnrolled;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  async getBiometricType(): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        return [];
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'face';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'iris';
          default:
            return 'unknown';
        }
      });
    } catch (error) {
      console.error('Biometric type check failed:', error);
      return [];
    }
  }

  async authenticateWithBiometrics(config?: BiometricConfig): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        throw new Error('Biometric authentication not available on web');
      }

      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: config?.title || CONFIG.SECURITY.BIOMETRIC_PROMPT.TITLE,
        subtitleMessage: config?.subtitle || CONFIG.SECURITY.BIOMETRIC_PROMPT.SUBTITLE,
        fallbackLabel: config?.fallbackLabel || CONFIG.SECURITY.BIOMETRIC_PROMPT.FALLBACK_TITLE,
        disableDeviceFallback: config?.disableDeviceFallback || false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Log successful biometric authentication
        this.logSecurityEvent('biometric_auth_success', {
          platform: Platform.OS,
        });
        return true;
      } else {
        // Log failed biometric authentication
        this.logSecurityEvent('biometric_auth_failed', {
          error: result.error,
          platform: Platform.OS,
        });
        return false;
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      throw new Error('Biometric authentication failed');
    }
  }

  // ================================
  // PASSWORD RESET
  // ================================

  async requestPasswordReset(email: string): Promise<void> {
    try {
      this.validateEmail(email);

      await api.post('/auth/forgot-password', {
        email: email.toLowerCase().trim(),
      });

      // Log password reset request
      this.logSecurityEvent('password_reset_requested', {
        email,
        platform: Platform.OS,
      });
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    try {
      this.validateEmail(request.email);
      this.validatePassword(request.newPassword);

      if (!request.resetToken) {
        throw new Error('Reset token is required');
      }

      await api.post('/auth/reset-password', {
        email: request.email.toLowerCase().trim(),
        newPassword: request.newPassword,
        resetToken: request.resetToken,
      });

      // Log successful password reset
      this.logSecurityEvent('password_reset_success', {
        email: request.email,
        platform: Platform.OS,
      });
    } catch (error: any) {
      // Log failed password reset
      this.logSecurityEvent('password_reset_failed', {
        email: request.email,
        error: error.message,
        platform: Platform.OS,
      });

      throw this.handleAuthError(error);
    }
  }

  // ================================
  // TOKEN MANAGEMENT
  // ================================

  async refreshTokens(): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh requests
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();
    
    try {
      const tokens = await this.tokenRefreshPromise;
      return tokens;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens> {
    try {
      const currentTokens = useAuthStore.getState().tokens;
      
      if (!currentTokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<AuthTokens>('/auth/refresh', {
        refreshToken: currentTokens.refreshToken,
      });

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      const newTokens = response.data;

      // Store new tokens
      await this.storeTokens(newTokens, true);

      // Update auth store
      useAuthStore.getState().updateTokens(newTokens);

      return newTokens;
    } catch (error: any) {
      // If refresh fails, logout user
      this.logout();
      throw this.handleAuthError(error);
    }
  }

  async isTokenValid(): Promise<boolean> {
    try {
      const tokens = useAuthStore.getState().tokens;
      
      if (!tokens) {
        return false;
      }

      // Check if access token is expired
      const now = Date.now();
      if (tokens.expiresAt && tokens.expiresAt < now) {
        // Try to refresh the token
        try {
          await this.refreshTokens();
          return true;
        } catch (error) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // ================================
  // SECURE STORAGE MANAGEMENT
  // ================================

  private async storeTokens(tokens: AuthTokens, persistent: boolean = true): Promise<void> {
    try {
      const tokenData = JSON.stringify(tokens);

      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (persistent) {
          localStorage.setItem(CONFIG.AUTH.ACCESS_TOKEN_KEY, tokenData);
        } else {
          sessionStorage.setItem(CONFIG.AUTH.ACCESS_TOKEN_KEY, tokenData);
        }
      } else {
        // Use SecureStore for native platforms
        await SecureStore.setItemAsync(CONFIG.AUTH.ACCESS_TOKEN_KEY, tokenData);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  private async storeUserData(user: AuthUser): Promise<void> {
    try {
      const userData = JSON.stringify(user);
      await AsyncStorage.setItem(CONFIG.AUTH.USER_DATA_KEY, userData);
    } catch (error) {
      console.error('Failed to store user data:', error);
      // Don't throw here, as this is not critical for authentication
    }
  }

  private async clearStoredData(): Promise<void> {
    try {
      const keys = [
        CONFIG.AUTH.ACCESS_TOKEN_KEY,
        CONFIG.AUTH.REFRESH_TOKEN_KEY,
        CONFIG.AUTH.USER_DATA_KEY,
      ];

      if (Platform.OS === 'web') {
        // Clear web storage
        keys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
      } else {
        // Clear native storage
        await Promise.all([
          ...keys.map(key => SecureStore.deleteItemAsync(key).catch(() => {})),
          ...keys.map(key => AsyncStorage.removeItem(key).catch(() => {})),
        ]);
      }
    } catch (error) {
      console.error('Failed to clear stored data:', error);
      // Don't throw here, as logout should continue even if clearing fails
    }
  }

  // ================================
  // VALIDATION METHODS
  // ================================

  private validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address');
    }
  }

  private validatePassword(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required');
    }

    const { PASSWORD_REQUIREMENTS } = CONFIG.SECURITY;

    if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
      throw new Error(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`);
    }

    if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Name is required');
    }

    if (name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (name.trim().length > 50) {
      throw new Error('Name must be less than 50 characters long');
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private async getDeviceInfo(): Promise<any> {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      // Add more device info as needed
    };
  }

  private handleAuthError(error: any): Error {
    if (error.response?.data?.error?.message) {
      return new Error(error.response.data.error.message);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('An unexpected error occurred during authentication');
  }

  private logSecurityEvent(event: string, data: any): void {
    if (CONFIG.DEV.LOG_LEVEL === 'debug') {
      console.log(`🔐 Security Event: ${event}`, data);
    }
    
    // TODO: Send to security monitoring service
    // Example: SecurityMonitoringService.logEvent(event, data);
  }
}

// ================================
// SINGLETON INSTANCE
// ================================

export const authService = new AuthenticationService();

// ================================
// CONVENIENCE EXPORTS
// ================================

export const auth = {
  login: authService.login.bind(authService),
  register: authService.register.bind(authService),
  logout: authService.logout.bind(authService),
  loginWithOAuth: authService.loginWithOAuth.bind(authService),
  requestPasswordReset: authService.requestPasswordReset.bind(authService),
  resetPassword: authService.resetPassword.bind(authService),
  refreshTokens: authService.refreshTokens.bind(authService),
  isTokenValid: authService.isTokenValid.bind(authService),
  isBiometricAvailable: authService.isBiometricAvailable.bind(authService),
  getBiometricType: authService.getBiometricType.bind(authService),
  authenticateWithBiometrics: authService.authenticateWithBiometrics.bind(authService),
};

export default authService;
