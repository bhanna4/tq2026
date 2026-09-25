// Types for the GoRest public API (https://gorest.co.in/public/v2)

export type Gender = 'male' | 'female';

export type UserStatus = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  gender: Gender;
  status: UserStatus;
}

export type CreateUserPayload = Omit<User, 'id'>;

export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface Post {
  id: number;
  user_id: number;
  title: string;
  body: string;
}

export type CreatePostPayload = Omit<Post, 'id'>;

export type UpdatePostPayload = Partial<CreatePostPayload>;

export interface Comment {
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
}

export type CreateCommentPayload = Omit<Comment, 'id'>;

export type UpdateCommentPayload = Partial<CreateCommentPayload>;

export interface GoRestErrorDetail {
  field: string;
  message: string;
}

export type GoRestErrorResponse = GoRestErrorDetail[];

// GoRest returns pagination info as response headers (x-pagination-*), not a
// body wrapper - this shape mirrors those headers.
export interface GoRestPagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}
