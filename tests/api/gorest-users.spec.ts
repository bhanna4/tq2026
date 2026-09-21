import { test, expect } from '@playwright/test';
import { GoRestUser } from '../../src/api/gorest-user';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

test.describe('GoRest Users API', () => {
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
