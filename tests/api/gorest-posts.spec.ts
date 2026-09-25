import { test, expect } from '@playwright/test';
import { GoRestUser } from '../../src/api/gorest-user';
import { GoRestPost } from '../../src/api/gorest-post';
import type { CreateUserPayload } from '../../src/types/gorest';

function uniqueUserPayload(): CreateUserPayload {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: 'Testy PostAuthor',
    email: `test.postauthor.${suffix}@example.com`,
    gender: 'male',
    status: 'active',
  };
}

test.describe('GoRest Posts API', () => {
  test.skip(!process.env.GOREST_TOKEN, 'Requires GOREST_TOKEN for write operations');

  test('creates, updates, and deletes a post', async ({ request }) => {
    const goRestUser = new GoRestUser(request);
    const goRestPost = new GoRestPost(request);

    const { status: userStatus, body: author } = await goRestUser.create(uniqueUserPayload());
    expect(userStatus).toBe(201);

    try {
      const { status: createStatus, body: post } = await goRestPost.create({
        user_id: author.id,
        title: 'Original title',
        body: 'Original body',
      });
      expect(createStatus).toBe(201);
      expect(post.user_id).toBe(author.id);
      expect(post.title).toBe('Original title');

      try {
        const { status: getStatus, body: fetchedPost } = await goRestPost.get(post.id);
        expect(getStatus).toBe(200);
        expect(fetchedPost.title).toBe('Original title');

        const { status: updateStatus, body: updatedPost } = await goRestPost.update(post.id, {
          title: 'Updated title',
        });
        expect(updateStatus).toBe(200);
        expect(updatedPost.title).toBe('Updated title');
        expect(updatedPost.body).toBe('Original body');

        const { status: deleteStatus } = await goRestPost.delete(post.id);
        expect(deleteStatus).toBe(204);

        const { status: getAfterDeleteStatus } = await goRestPost.get(post.id);
        expect(getAfterDeleteStatus).toBe(404);
      } finally {
        // Best-effort: already deleted above unless an earlier assertion
        // failed first and left it behind.
        await goRestPost.delete(post.id).catch(() => undefined);
      }
    } finally {
      await goRestUser.delete(author.id);
    }
  });
});
