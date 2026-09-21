import { test, expect } from '@playwright/test';
import { GoRestUser } from '../../src/api/gorest-user';
import type { CreateUserPayload, Gender, UserStatus } from '../../src/types/gorest';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS: Gender[] = ['male', 'female'];
const STATUSES: UserStatus[] = ['active', 'inactive'];

function uniqueUserPayload(
  gender: Gender = 'male',
  status: UserStatus = 'active',
): CreateUserPayload {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    name: 'Testy McTestFace',
    email: `test.user.${suffix}@example.com`,
    gender,
    status,
  };
}

test.describe('GoRest Users API', () => {
  test.skip(!process.env.GOREST_TOKEN, 'Requires GOREST_TOKEN for write operations');

  for (const gender of GENDERS) {
    for (const status of STATUSES) {
      test(`creates a user with gender "${gender}" and status "${status}"`, async ({ request }) => {
        const goRestUser = new GoRestUser(request);
        const payload = uniqueUserPayload(gender, status);

        const { status: createStatus, body: createdUser } = await goRestUser.create(payload);

        expect(createStatus).toBe(201);
        expect(typeof createdUser.id).toBe('number');
        expect(createdUser.name).toBe(payload.name);
        expect(createdUser.email).toBe(payload.email);
        expect(createdUser.gender).toBe(gender);
        expect(createdUser.status).toBe(status);

        await goRestUser.delete(createdUser.id);
      });
    }
  }

  test('rejects unauthorized access to a created user', async ({ request }) => {
    const goRestUser = new GoRestUser(request);
    const unauthorizedGoRestUser = new GoRestUser(request, 'invalid-token');
    const payload = uniqueUserPayload();

    const { status: createStatus, body: createdUser } = await goRestUser.create(payload);

    expect(createStatus).toBe(201);
    expect(typeof createdUser.id).toBe('number');
    expect(createdUser.name).toBe(payload.name);
    expect(createdUser.email).toBe(payload.email);
    expect(createdUser.gender).toBe(payload.gender);
    expect(createdUser.status).toBe(payload.status);

    const { status: unauthorizedUpdateStatus, body: unauthorizedUpdateBody } =
      await unauthorizedGoRestUser.update(createdUser.id, { status: 'inactive' });

    expect(unauthorizedUpdateStatus).toBe(401);
    expect(unauthorizedUpdateBody).toEqual(
      expect.objectContaining({ message: expect.stringContaining('Invalid token') as unknown }),
    );

    const { status: unauthorizedDeleteStatus } = await unauthorizedGoRestUser.delete(
      createdUser.id,
    );

    expect(unauthorizedDeleteStatus).toBe(401);

    const { status: getStatus, body: fetchedUser } = await goRestUser.get(createdUser.id);

    expect(getStatus).toBe(200);
    expect(fetchedUser.status).toBe(payload.status);

    await goRestUser.delete(createdUser.id);
  });

  test('lists the default page of users with valid fields', async ({ request }) => {
    const goRestUser = new GoRestUser(request);

    const { status, body: users } = await goRestUser.list();

    expect(status).toBe(200);
    expect(users.length).toBeGreaterThan(0);

    for (const user of users) {
      expect(typeof user.id).toBe('number');
      expect(typeof user.email).toBe('string');
      expect(user.email).toMatch(EMAIL_FORMAT);
      expect(typeof user.name).toBe('string');
      expect(user.name.length).toBeGreaterThan(0);
      expect(['male', 'female']).toContain(user.gender);
      expect(['active', 'inactive']).toContain(user.status);
    }
  });
});
