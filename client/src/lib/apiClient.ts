import { toast } from '@/hooks/use-toast';

/**
 * Global API client with automatic 401 (Unauthorized) handling
 * Redirects to login page when token is invalid or expired
 */

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Make an authenticated API request
   * Automatically handles 401 responses by clearing auth and redirecting to login
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { skipAuth = false, ...fetchOptions } = options;

    // Get token from localStorage
    const token = localStorage.getItem('auth_token');

    // Add Authorization header if token exists and not skipped
    if (token && !skipAuth) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Unauthorized - Session expired');
      }

      return response;
    } catch (error) {
      // Re-throw the error after handling
      throw error;
    }
  }

  /**
   * Handle unauthorized access
   * Clears authentication data and redirects to login
   */
  private handleUnauthorized() {
    // Clear authentication data
    localStorage.removeItem('auth_token');
    
    // Show toast notification
    toast({
      title: 'Session Expired',
      description: 'Your session has expired. Please log in again.',
      variant: 'destructive',
      duration: 5000,
    });

    // Redirect to login page after a short delay
    setTimeout(() => {
      // Check if we're not already on the auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }, 1000);
  }

  /**
   * Convenience method for GET requests
   */
  async get(url: string, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  /**
   * Convenience method for POST requests
   */
  async post(url: string, data?: unknown, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Convenience method for PUT requests
   */
  async put(url: string, data?: unknown, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete(url: string, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch(url: string, data?: unknown, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export convenience function for direct usage
export const api = {
  get: (url: string, options?: FetchOptions) => apiClient.get(url, options),
  post: (url: string, data?: unknown, options?: FetchOptions) => apiClient.post(url, data, options),
  put: (url: string, data?: unknown, options?: FetchOptions) => apiClient.put(url, data, options),
  delete: (url: string, options?: FetchOptions) => apiClient.delete(url, options),
  patch: (url: string, data?: unknown, options?: FetchOptions) => apiClient.patch(url, data, options),
  fetch: (url: string, options?: FetchOptions) => apiClient.fetch(url, options),
};
