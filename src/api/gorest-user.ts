import type { APIRequestContext } from '@playwright/test';
import { GoRestClient, type ApiResult, type QueryParams } from './gorest-client';
import type { CreateUserPayload, UpdateUserPayload, User } from '../types/gorest';

/**
 * Orchestrates GoRest `/users` API calls for tests. Mirrors the Page Object
 * pattern used for UI pages: tests call these methods rather than building
 * requests themselves.
 */
export class GoRestUser {
  private readonly client: GoRestClient;

  constructor(request: APIRequestContext) {
    this.client = new GoRestClient(request);
  }

  async list(params?: QueryParams): Promise<ApiResult<User[]>> {
    return this.client.get<User[]>('/users', params);
  }

  async get(id: number): Promise<ApiResult<User>> {
    return this.client.get<User>(`/users/${id}`);
  }

  async create(payload: CreateUserPayload): Promise<ApiResult<User>> {
    return this.client.post<User>('/users', payload);
  }

  async update(id: number, payload: UpdateUserPayload): Promise<ApiResult<User>> {
    return this.client.put<User>(`/users/${id}`, payload);
  }

  async delete(id: number): Promise<ApiResult<undefined>> {
    return this.client.delete<undefined>(`/users/${id}`);
  }
}
