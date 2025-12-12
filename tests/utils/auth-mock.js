// tests/utils/auth-mock.js

export async function mockSupabaseAuth(page, userDetails = {}) {
  const defaultUser = {
    id: 'fake-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    ...userDetails,
  };

  // Mock token response (login)
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-jwt-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh-token',
        user: defaultUser,
      }),
    });
  });

  // Mock user details response (session check)
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(defaultUser),
    });
  });
}

export async function mockSupabaseData(page, table, data) {
  // Simple mock for GET requests to a specific table
  await page.route(`**/rest/v1/${table}*`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    } else {
      await route.continue();
    }
  });
}
