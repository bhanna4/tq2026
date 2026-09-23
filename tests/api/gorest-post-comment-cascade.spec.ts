import { test, expect } from '@playwright/test';
import { GoRestUser } from '../../src/api/gorest-user';
import { GoRestPost } from '../../src/api/gorest-post';
import { GoRestComment } from '../../src/api/gorest-comment';
import type { CreateUserPayload } from '../../src/types/gorest';

function uniqueUserPayload(label: string): CreateUserPayload {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: `Testy ${label}`,
    email: `test.${label.toLowerCase()}.${suffix}@example.com`,
    gender: 'male',
    status: 'active',
  };
}

test.describe('GoRest post deletion cascades to comments', () => {
  test.skip(!process.env.GOREST_TOKEN, 'Requires GOREST_TOKEN for write operations');

  test("removes a post's comment once the post is deleted", async ({ request }) => {
    const goRestUser = new GoRestUser(request);
    const goRestPost = new GoRestPost(request);
    const goRestComment = new GoRestComment(request);

    const { status: firstUserStatus, body: firstUser } = await goRestUser.create(
      uniqueUserPayload('Author'),
    );
    expect(firstUserStatus).toBe(201);

    const { status: secondUserStatus, body: secondUser } = await goRestUser.create(
      uniqueUserPayload('Commenter'),
    );
    expect(secondUserStatus).toBe(201);

    const { status: postStatus, body: post } = await goRestPost.create({
      user_id: firstUser.id,
      title: 'A post about to be deleted',
      body: 'This post will be removed along with its comments.',
    });
    expect(postStatus).toBe(201);
    expect(post.user_id).toBe(firstUser.id);

    const { status: commentStatus, body: comment } = await goRestComment.createForPost(post.id, {
      name: secondUser.name,
      email: secondUser.email,
      body: 'A comment from the second user.',
    });
    expect(commentStatus).toBe(201);
    expect(comment.post_id).toBe(post.id);

    const { status: deletePostStatus } = await goRestPost.delete(post.id);
    expect(deletePostStatus).toBe(204);

    const { status: getCommentStatus } = await goRestComment.get(comment.id);
    expect(getCommentStatus).toBe(404);

    const { status: listCommentsStatus, body: postComments } = await goRestComment.listForPost(
      post.id,
    );
    expect(listCommentsStatus).toBe(200);
    expect(postComments).toEqual([]);

    await goRestUser.delete(firstUser.id);
    await goRestUser.delete(secondUser.id);
  });
});
