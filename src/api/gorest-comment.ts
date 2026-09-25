import type { APIRequestContext } from '@playwright/test';
import { GoRestClient, type ApiResult } from './gorest-client';
import type { CreateCommentPayload, Comment, UpdateCommentPayload } from '../types/gorest';

/**
 * Orchestrates GoRest `/comments` and `/posts/{id}/comments` API calls for
 * tests. Mirrors the Page Object pattern used for UI pages: tests call these
 * methods rather than building requests themselves.
 */
export class GoRestComment {
  private readonly client: GoRestClient;

  constructor(request: APIRequestContext, token?: string) {
    this.client = new GoRestClient(request, token);
  }

  async get(id: number): Promise<ApiResult<Comment>> {
    return this.client.get<Comment>(`/comments/${id}`);
  }

  async listForPost(postId: number): Promise<ApiResult<Comment[]>> {
    return this.client.get<Comment[]>(`/posts/${postId}/comments`);
  }

  async createForPost(
    postId: number,
    payload: Omit<CreateCommentPayload, 'post_id'>,
  ): Promise<ApiResult<Comment>> {
    return this.client.post<Comment>(`/posts/${postId}/comments`, payload);
  }

  async update(id: number, payload: UpdateCommentPayload): Promise<ApiResult<Comment>> {
    return this.client.put<Comment>(`/comments/${id}`, payload);
  }

  async delete(id: number): Promise<ApiResult<undefined>> {
    return this.client.delete<undefined>(`/comments/${id}`);
  }
}
