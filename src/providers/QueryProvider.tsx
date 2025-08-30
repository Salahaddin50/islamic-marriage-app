// ============================================================================
// REACT QUERY PROVIDER - HUME DATING APP
// ============================================================================
// Configures React Query with enterprise-grade settings for optimal performance
// Includes error handling, retries, and background sync configuration
// ============================================================================

import React from 'react';
import { QueryClient, QueryClientProvider, focusManager, keepPreviousData } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import { CONFIG } from '../config';

// ================================
// QUERY CLIENT CONFIGURATION
// ================================

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - keep data fresh longer to avoid refetch flicker
        staleTime: 10 * 60 * 1000, // 10 minutes
        
        // Cache time - how long data stays in cache after unused
        gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Network-related settings
        networkMode: 'online',
        
        // Refetch configuration
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
        
        // Background updates
        refetchInterval: false, // Disable automatic polling
        refetchIntervalInBackground: false,
        
        // Error handling
        throwOnError: false,
        
        // Select and transform data
        select: undefined, // Allow components to define their own selectors
        
        // Placeholders
        // Keep previous data while fetching to avoid "Loading..." flicker
        placeholderData: keepPreviousData,
        
        // Structural sharing for better performance
        structuralSharing: true,
      },
      mutations: {
        // Retry configuration for mutations
        retry: (failureCount, error: any) => {
          // Only retry on network errors or 5xx server errors
          if (!error?.status || error?.status >= 500) {
            return failureCount < 2; // Retry up to 2 times
          }
          return false;
        },
        
        // Retry delay for mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        
        // Network mode
        networkMode: 'online',
        
        // Error handling
        throwOnError: false,
      },
    },
  });
}

// ================================
// FOCUS MANAGER SETUP
// ================================

function setupFocusManager() {
  // Handle app state changes for React Native
  if (Platform.OS !== 'web') {
    const handleAppStateChange = (state: any) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(state === 'active');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }
  
  // Handle focus/blur for web
  if (Platform.OS === 'web') {
    const handleFocus = () => focusManager.setFocused(true);
    const handleBlur = () => focusManager.setFocused(false);
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }
}

// ================================
// QUERY CLIENT INSTANCE
// ================================

const queryClient = createQueryClient();

// ================================
// ERROR BOUNDARY FOR QUERIES
// ================================

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class QueryErrorBoundary extends React.Component<
  QueryErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: QueryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    if (CONFIG.DEV.LOG_LEVEL === 'debug') {
      console.error('Query Error Boundary caught an error:', error, errorInfo);
    }
    
    // TODO: Send to error monitoring service (Sentry, Bugsnag, etc.)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError} 
        />
      );
    }

    return this.props.children;
  }
}

// ================================
// DEFAULT ERROR FALLBACK
// ================================

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center',
    }}>
      <h2 style={{ color: '#ff6b6b', marginBottom: '16px' }}>
        Something went wrong
      </h2>
      <p style={{ marginBottom: '16px', color: '#666' }}>
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetError}
        style={{
          backgroundColor: '#9610FF',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Try Again
      </button>
    </div>
  );
};

// ================================
// QUERY PROVIDER COMPONENT
// ================================

interface QueryProviderProps {
  children: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ 
  children, 
  errorFallback 
}) => {
  React.useEffect(() => {
    const cleanup = setupFocusManager();
    return cleanup;
  }, []);

  // Set up global error handling for queries
  React.useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'error') {
        const { error, query } = event;
        
        // Log query errors in development
        if (CONFIG.DEV.LOG_LEVEL === 'debug') {
          console.error('Query error:', {
            queryKey: query.queryKey,
            error: error,
          });
        }
        
        // TODO: Send critical errors to monitoring service
        if (error && 'status' in error && (error as any).status >= 500) {
          // Log server errors
          console.error('Server error in query:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Set up global error handling for mutations
  React.useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'error') {
        const { error, mutation } = event;
        
        // Log mutation errors in development
        if (CONFIG.DEV.LOG_LEVEL === 'debug') {
          console.error('Mutation error:', {
            mutationKey: mutation.options.mutationKey,
            variables: mutation.state.variables,
            error: error,
          });
        }
        
        // TODO: Send critical errors to monitoring service
      }
    });

    return unsubscribe;
  }, []);

  return (
    <QueryErrorBoundary fallback={errorFallback}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </QueryErrorBoundary>
  );
};

// ================================
// DEVTOOLS (Development Only)
// ================================

let ReactQueryDevtools: React.ComponentType<any> | null = null;

if (CONFIG.DEV.ENABLE_DEBUG_MODE && __DEV__) {
  try {
    const { ReactQueryDevtools: DevtoolsComponent } = require('@tanstack/react-query-devtools');
    ReactQueryDevtools = DevtoolsComponent;
  } catch (error) {
    console.warn('React Query Devtools not available');
  }
}

// ================================
// QUERY PROVIDER WITH DEVTOOLS
// ================================

export const QueryProviderWithDevtools: React.FC<QueryProviderProps> = ({ 
  children, 
  errorFallback 
}) => {
  return (
    <QueryProvider errorFallback={errorFallback}>
      {children}
      {ReactQueryDevtools && CONFIG.DEV.ENABLE_DEBUG_MODE && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryProvider>
  );
};

// ================================
// QUERY CLIENT ACCESS
// ================================

export const getQueryClient = () => queryClient;

// ================================
// EXPORTS
// ================================

export default QueryProvider;

// Re-export commonly used React Query hooks
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useSuspenseQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';

// Export types
export type {
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  QueryKey,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
