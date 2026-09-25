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

test.describe('GoRest Comments API', () => {
  test.skip(!process.env.GOREST_TOKEN, 'Requires GOREST_TOKEN for write operations');

  test('creates, updates, and deletes a comment', async ({ request }) => {
    const goRestUser = new GoRestUser(request);
    const goRestPost = new GoRestPost(request);
    const goRestComment = new GoRestComment(request);

    const { status: authorStatus, body: author } = await goRestUser.create(
      uniqueUserPayload('Author'),
    );
    expect(authorStatus).toBe(201);

    try {
      const { status: commenterStatus, body: commenter } = await goRestUser.create(
        uniqueUserPayload('Commenter'),
      );
      expect(commenterStatus).toBe(201);

      try {
        const { status: postStatus, body: post } = await goRestPost.create({
          user_id: author.id,
          title: 'A post to comment on',
          body: 'Post body.',
        });
        expect(postStatus).toBe(201);

        try {
          const { status: createStatus, body: comment } = await goRestComment.createForPost(
            post.id,
            {
              name: commenter.name,
              email: commenter.email,
              body: 'Original comment',
            },
          );
          expect(createStatus).toBe(201);
          expect(comment.post_id).toBe(post.id);

          const { status: getStatus, body: fetchedComment } = await goRestComment.get(comment.id);
          expect(getStatus).toBe(200);
          expect(fetchedComment.body).toBe('Original comment');

          const { status: updateStatus, body: updatedComment } = await goRestComment.update(
            comment.id,
            { body: 'Updated comment' },
          );
          expect(updateStatus).toBe(200);
          expect(updatedComment.body).toBe('Updated comment');

          const { status: deleteStatus } = await goRestComment.delete(comment.id);
          expect(deleteStatus).toBe(204);

          const { status: getAfterDeleteStatus } = await goRestComment.get(comment.id);
          expect(getAfterDeleteStatus).toBe(404);
        } finally {
          await goRestPost.delete(post.id);
        }
      } finally {
        await goRestUser.delete(commenter.id);
      }
    } finally {
      await goRestUser.delete(author.id);
    }
  });
});
