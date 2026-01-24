import { API_BASE_URL } from '@/src/utils/constants';

// Request configuration
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

// API Error type
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

// Build URL with query params
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(endpoint, API_BASE_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  return url.toString();
}

// Get auth token (from zustand store or secure storage)
function getAuthToken(): string | null {
  // TODO: Get from secure storage or auth provider
  return null;
}

// Base fetch wrapper with auth and error handling
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...fetchConfig } = config;
  
  const url = buildUrl(endpoint, params);
  
  // Add default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...config.headers,
  };
  
  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...fetchConfig,
      headers,
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, data);
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other error
    throw new ApiError(0, 'Network Error', { message: (error as Error).message });
  }
}

// HTTP method helpers
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean>) =>
    request<T>(endpoint, { method: 'GET', params }),
    
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};
