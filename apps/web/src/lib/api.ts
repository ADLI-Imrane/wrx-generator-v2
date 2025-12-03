import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, skipAuth, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Get token automatically if not provided and auth not skipped
    const authToken = token || (!skipAuth ? await this.getAuthToken() : null);

    if (authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });
    } catch (err) {
      // Network error or CORS failure
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Network error while calling ${this.baseUrl}${endpoint}: ${message}`);
    }

    // Attempt to read body safely. Some endpoints may return non-JSON (e.g., file downloads or empty body).
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      // Read body as text if it's not JSON, otherwise parse JSON to extract message
      let bodyText = '';
      if (contentType.includes('application/json')) {
        try {
          const errJson = await response.json();
          bodyText = typeof errJson === 'object' ? JSON.stringify(errJson) : String(errJson);
        } catch {
          bodyText = await response.text().catch(() => '');
        }
      } else {
        bodyText = await response.text().catch(() => '');
      }

      const status = response.status;
      const statusText = response.statusText;
      const message = bodyText || `${status} ${statusText}`;
      throw new Error(`HTTP ${status} error from ${this.baseUrl}${endpoint}: ${message}`);
    }

    // Success: return parsed JSON when available, otherwise return raw text (casted to T)
    if (contentType.includes('application/json')) {
      return response.json();
    }

    // If consumer expects a blob/other, they should call fetch directly. Here we return text as fallback.
    const text = await response.text().catch(() => '');
    return text as unknown as T;
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', token });
  }

  async post<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async put<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

export const api = new ApiClient(`${API_URL}`);
