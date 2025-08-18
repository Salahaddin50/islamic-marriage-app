// ============================================================================
// MOCK AUTH SERVICE - FOR INITIAL TESTING
// ============================================================================
// Temporary mock to test the Islamic registration UI without backend
// ============================================================================

export const authService = {
  login: async (credentials: any) => {
    console.log('Mock login:', credentials);
    return { id: 'mock-user', email: credentials.email };
  },
  
  register: async (credentials: any) => {
    console.log('Mock register:', credentials);
    return { id: 'mock-user', email: credentials.email };
  },
  
  logout: async () => {
    console.log('Mock logout');
  },
  
  loginWithOAuth: async (credentials: any) => {
    console.log('Mock OAuth login:', credentials);
    return { id: 'mock-user', email: 'mock@example.com' };
  },
  
  isTokenValid: async () => false,
  
  isBiometricAvailable: async () => false,
  
  getBiometricType: async () => [],
  
  authenticateWithBiometrics: async () => false,
  
  requestPasswordReset: async (email: string) => {
    console.log('Mock password reset for:', email);
  },
  
  resetPassword: async (request: any) => {
    console.log('Mock password reset:', request);
  },
  
  refreshTokens: async () => {
    console.log('Mock token refresh');
    return { accessToken: 'mock-token', refreshToken: 'mock-refresh', expiresAt: Date.now() + 3600000, tokenType: 'Bearer' as const };
  },
};

export const auth = authService;
export default authService;
