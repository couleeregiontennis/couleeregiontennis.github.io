// tests/utils/auth-mock.js

export async function mockSupabaseAuth(page, userDetails = {}) {
  // Disable navigator.locks to prevent Supabase client from hanging in some environments (like Playwright in CI/Docker)
  await page.addInitScript(() => {
    if (navigator.locks) {
      try {
        Object.defineProperty(navigator, 'locks', { value: undefined });
      } catch (e) {
        console.error('Failed to disable navigator.locks', e);
      }
    }
  });

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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co';

  let projectRef = 'example';
  try {
    const hostname = new URL(supabaseUrl).hostname;
    projectRef = hostname.split('.')[0];
  } catch (e) {
    // fallback or ignore
  }
  const storageKey = `sb-${projectRef}-auth-token`;

  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: storageKey, value: session });

  // Mock token response (login, refresh, etc.)
  await page.route('**/auth/v1/token*', async (route) => {
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
  await page.route(`**/rest/v1/${table}*`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
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
