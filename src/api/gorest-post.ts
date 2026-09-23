import type { APIRequestContext } from '@playwright/test';
import { GoRestClient, type ApiResult } from './gorest-client';
import type { CreatePostPayload, Post } from '../types/gorest';

/**
 * Orchestrates GoRest `/posts` API calls for tests. Mirrors the Page Object
 * pattern used for UI pages: tests call these methods rather than building
 * requests themselves.
 */
export class GoRestPost {
  private readonly client: GoRestClient;

  constructor(request: APIRequestContext, token?: string) {
    this.client = new GoRestClient(request, token);
  }

  async get(id: number): Promise<ApiResult<Post>> {
    return this.client.get<Post>(`/posts/${id}`);
  }

  async create(payload: CreatePostPayload): Promise<ApiResult<Post>> {
    return this.client.post<Post>('/posts', payload);
  }

  async delete(id: number): Promise<ApiResult<undefined>> {
    return this.client.delete<undefined>(`/posts/${id}`);
  }
}
