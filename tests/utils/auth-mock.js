// tests/utils/auth-mock.js

export async function mockSupabaseAuth(page, userDetails = {}) {
  const defaultUser = {
    id: 'fake-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    ...userDetails,
  };

  const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlLXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjE5OTk5OTk5OTksImlhdCI6MTYwMDAwMDAwMCwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.fake-signature';

  const session = {
    access_token: validJwt,
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'fake-refresh-token',
    user: defaultUser,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };

  // Inject session into localStorage so the app thinks we are logged in
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
  let projectRef = 'example';
  try {
    // If URL is valid, extract subdomain
    const hostname = new URL(supabaseUrl).hostname;
    projectRef = hostname.split('.')[0];
  } catch (e) {
    // fallback or ignore
  }
  const storageKey = `sb-${projectRef}-auth-token`;

  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: storageKey, value: session });

  // Mock token response (login)
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
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
