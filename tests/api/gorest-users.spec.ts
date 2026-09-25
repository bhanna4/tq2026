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
  test.describe('write operations', () => {
    test.skip(!process.env.GOREST_TOKEN, 'Requires GOREST_TOKEN for write operations');

    for (const gender of GENDERS) {
      for (const status of STATUSES) {
        test(`creates a user with gender "${gender}" and status "${status}"`, async ({
          request,
        }) => {
          const goRestUser = new GoRestUser(request);
          const payload = uniqueUserPayload(gender, status);

          const { status: createStatus, body: createdUser } = await goRestUser.create(payload);

          try {
            expect(createStatus).toBe(201);
            expect(typeof createdUser.id).toBe('number');
            expect(createdUser.name).toBe(payload.name);
            expect(createdUser.email).toBe(payload.email);
            expect(createdUser.gender).toBe(gender);
            expect(createdUser.status).toBe(status);
          } finally {
            await goRestUser.delete(createdUser.id);
          }
        });
      }
    }

    test('rejects creating a user with an invalid email', async ({ request }) => {
      const goRestUser = new GoRestUser(request);
      const payload = { ...uniqueUserPayload(), email: 'not-an-email' };

      const { status, body } = await goRestUser.create(payload);

      expect(status).toBe(422);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email', message: 'is invalid' }),
        ]),
      );
    });

    test('rejects unauthorized access to a created user', async ({ request }) => {
      const goRestUser = new GoRestUser(request);
      const unauthorizedGoRestUser = new GoRestUser(request, 'invalid-token');
      const payload = uniqueUserPayload();

      const { status: createStatus, body: createdUser } = await goRestUser.create(payload);

      try {
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
      } finally {
        await goRestUser.delete(createdUser.id);
      }
    });
  });

  test('lists the default page of users with valid fields', async ({ request }) => {
    const goRestUser = new GoRestUser(request);

    const { status, body: users } = await goRestUser.list();

    expect(status).toBe(200);
    expect(users.length).toBeGreaterThan(0);

    // This page is shared, public GoRest data this suite doesn't own, but
    // GoRest's own /users POST validates email format and the gender/status
    // enums at write time, so every record here should already conform.
    // Collecting every violation (rather than failing on the first) gives a
    // full, actionable diagnostic if that assumption is ever wrong, instead
    // of hiding which record and which field actually broke the contract.
    const violations = users.flatMap((user) => {
      const problems: string[] = [];
      if (typeof user.id !== 'number') problems.push('id is not a number');
      if (typeof user.email !== 'string' || !EMAIL_FORMAT.test(user.email)) {
        problems.push(`email "${user.email}" is not a valid email`);
      }
      if (typeof user.name !== 'string' || user.name.length === 0) {
        problems.push('name is empty or not a string');
      }
      if (!['male', 'female'].includes(user.gender)) {
        problems.push(`gender "${user.gender}" is not "male" or "female"`);
      }
      if (!['active', 'inactive'].includes(user.status)) {
        problems.push(`status "${user.status}" is not "active" or "inactive"`);
      }
      return problems.map((problem) => `user ${user.id}: ${problem}`);
    });

    expect(violations).toEqual([]);
  });

  test('paginates results using page and per_page params', async ({ request }) => {
    const goRestUser = new GoRestUser(request);

    const {
      status: firstPageStatus,
      body: firstPageUsers,
      pagination: firstPagination,
    } = await goRestUser.list({ page: 1, per_page: 3 });
    const {
      status: secondPageStatus,
      body: secondPageUsers,
      pagination: secondPagination,
    } = await goRestUser.list({ page: 2, per_page: 3 });

    expect(firstPageStatus).toBe(200);
    expect(secondPageStatus).toBe(200);
    expect(firstPageUsers).toHaveLength(3);
    expect(secondPageUsers).toHaveLength(3);

    expect(firstPagination?.limit).toBe(3);
    expect(firstPagination?.page).toBe(1);
    expect(secondPagination?.page).toBe(2);
    // Both pages share the same total/pages count of the same underlying
    // dataset, confirming per_page actually changed the page size rather
    // than being silently ignored.
    expect(secondPagination?.total).toBe(firstPagination?.total);
    expect(secondPagination?.pages).toBe(firstPagination?.pages);

    const firstPageIds = firstPageUsers.map((user) => user.id);
    const secondPageIds = secondPageUsers.map((user) => user.id);
    expect(firstPageIds.some((id) => secondPageIds.includes(id))).toBe(false);
  });
});
