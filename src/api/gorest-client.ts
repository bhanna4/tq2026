import type { APIRequestContext, APIResponse } from '@playwright/test';

const API_BASE_PATH = '/public/v2';

export interface ApiResult<T> {
  status: number;
  ok: boolean;
  body: T;
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Thin wrapper around Playwright's APIRequestContext for the GoRest public API.
 * Handles the base path, bearer auth, and response parsing (GoRest returns an
 * empty body on 204 DELETE responses, which response.json() cannot handle).
 */
export class GoRestClient {
  private readonly request: APIRequestContext;
  private readonly token: string;

  constructor(request: APIRequestContext, token: string = process.env.GOREST_TOKEN ?? '') {
    this.request = request;
    this.token = token;
  }

  async get<T>(path: string, params?: QueryParams): Promise<ApiResult<T>> {
    const response = await this.request.get(`${API_BASE_PATH}${path}${this.toQueryString(params)}`, {
      headers: this.authHeaders(),
    });
    return this.toResult<T>(response);
  }

  async post<T>(path: string, data: unknown): Promise<ApiResult<T>> {
    const response = await this.request.post(`${API_BASE_PATH}${path}`, {
      data,
      headers: this.authHeaders(),
    });
    return this.toResult<T>(response);
  }

  async put<T>(path: string, data: unknown): Promise<ApiResult<T>> {
    const response = await this.request.put(`${API_BASE_PATH}${path}`, {
      data,
      headers: this.authHeaders(),
    });
    return this.toResult<T>(response);
  }

  async delete<T>(path: string): Promise<ApiResult<T>> {
    const response = await this.request.delete(`${API_BASE_PATH}${path}`, {
      headers: this.authHeaders(),
    });
    return this.toResult<T>(response);
  }

  private authHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private toQueryString(params?: QueryParams): string {
    if (!params) {
      return '';
    }

    const entries = Object.entries(params).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return '';
    }

    const search = new URLSearchParams();
    for (const [key, value] of entries) {
      search.set(key, String(value));
    }
    return `?${search.toString()}`;
  }

  private async toResult<T>(response: APIResponse): Promise<ApiResult<T>> {
    const text = await response.text();
    const body = (text ? JSON.parse(text) : undefined) as T;
    return { status: response.status(), ok: response.ok(), body };
  }
}
