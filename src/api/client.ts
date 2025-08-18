// ============================================================================
// ENTERPRISE API CLIENT - HUME DATING APP
// ============================================================================
// Axios-based HTTP client with authentication, interceptors, and error handling
// Follows enterprise patterns for security, reliability, and maintainability
// ============================================================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CONFIG } from '../config';
import { useAuthStore } from '../store';
import type { ApiResponse, ApiError, AuthTokens } from '../types';

// ================================
// TYPE DEFINITIONS
// ================================

interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipRefresh?: boolean;
  retryCount?: number;
}

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// ================================
// API CLIENT CLASS
// ================================

class ApiClient {
  private instance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: ApiClientConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Platform': Platform.OS,
        'X-App-Version': '1.0.0', // TODO: Get from app config
      },
    });

    this.setupInterceptors();
    this.setupAuthRefreshInterceptor();
  }

  // ================================
  // INTERCEPTOR SETUP
  // ================================

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.instance.interceptors.request.use(
      async (config: any) => {
        // Add authentication token if available
        if (!config.skipAuth) {
          const token = await this.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request ID for debugging
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Request-Time'] = new Date().toISOString();

        // Log request in development
        if (CONFIG.DEV.LOG_LEVEL === 'debug') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
          });
        }

        return config;
      },
      (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle responses and errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (CONFIG.DEV.LOG_LEVEL === 'debug') {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as RequestConfig;

        // Log error in development
        if (CONFIG.DEV.LOG_LEVEL === 'debug') {
          console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }

        // Handle network errors
        if (!error.response) {
          return Promise.reject(this.createApiError('NETWORK_ERROR', 'Network connection failed'));
        }

        // Handle specific HTTP status codes
        const status = error.response.status;
        const data = error.response.data as any;

        switch (status) {
          case 401:
            // Unauthorized - will be handled by auth refresh interceptor
            break;
          case 403:
            // Forbidden
            useAuthStore.getState().setError('Access denied');
            break;
          case 404:
            // Not found
            break;
          case 429:
            // Rate limited
            return this.handleRateLimit(originalRequest, error);
          case 500:
          case 502:
          case 503:
          case 504:
            // Server errors - retry logic
            return this.handleServerError(originalRequest, error);
          default:
            break;
        }

        // Create standardized error response
        const apiError = this.createApiError(
          data?.error?.code || `HTTP_${status}`,
          data?.error?.message || error.message || 'An error occurred',
          data?.error?.details,
          data?.error?.field
        );

        return Promise.reject(apiError);
      }
    );
  }

  // ================================
  // AUTH REFRESH INTERCEPTOR
  // ================================

  private setupAuthRefreshInterceptor(): void {
    createAuthRefreshInterceptor(
      this.instance,
      async (failedRequest: AxiosError) => {
        try {
          const newToken = await this.refreshAccessToken();
          if (newToken && failedRequest.response?.config) {
            failedRequest.response.config.headers.Authorization = `Bearer ${newToken}`;
          }
          return Promise.resolve();
        } catch (error) {
          // Refresh failed - logout user
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      },
      {
        statusCodes: [401],
        skipWhileRefreshing: true,
        pauseInstanceWhileRefreshing: true,
      }
    );
  }

  // ================================
  // TOKEN MANAGEMENT
  // ================================

  private async getAccessToken(): Promise<string | null> {
    try {
      const tokens = useAuthStore.getState().tokens;
      return tokens?.accessToken || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      const tokens = useAuthStore.getState().tokens;
      return tokens?.refreshToken || null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.instance.post('/auth/refresh', 
        { refreshToken },
        { skipAuth: true, skipRefresh: true }
      );

      const tokens: AuthTokens = response.data.data;
      useAuthStore.getState().updateTokens(tokens);

      return tokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // ================================
  // ERROR HANDLING
  // ================================

  private createApiError(
    code: string,
    message: string,
    details?: Record<string, any>,
    field?: string
  ): ApiError {
    return {
      code,
      message,
      details,
      field,
    };
  }

  private async handleRateLimit(
    originalRequest: RequestConfig,
    error: AxiosError
  ): Promise<any> {
    const retryAfter = error.response?.headers['retry-after'];
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

    // Wait for the specified delay before retrying
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.instance.request(originalRequest);
  }

  private async handleServerError(
    originalRequest: RequestConfig,
    error: AxiosError
  ): Promise<any> {
    const retryCount = originalRequest.retryCount || 0;
    const maxRetries = 3;

    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.instance.request({
        ...originalRequest,
        retryCount: retryCount + 1,
      });
    }

    throw error;
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ================================
  // PUBLIC API METHODS
  // ================================

  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config);
    return response.data;
  }

  // ================================
  // FILE UPLOAD METHODS
  // ================================

  async uploadFile<T = any>(
    url: string,
    file: any,
    progressCallback?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const uploadConfig: RequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressCallback && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCallback(progress);
        }
      },
    };

    const response = await this.instance.post(url, formData, uploadConfig);
    return response.data;
  }

  // ================================
  // AXIOS INSTANCE ACCESS
  // ================================

  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// ================================
// SINGLETON INSTANCE
// ================================

export const apiClient = new ApiClient({
  baseURL: CONFIG.API.BASE_URL,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

// ================================
// CONVENIENCE EXPORTS
// ================================

export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  upload: apiClient.uploadFile.bind(apiClient),
};

export default apiClient;
