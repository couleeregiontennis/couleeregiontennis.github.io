## 2024-05-23 - AuthProvider Context Stability
**Learning:** `AuthProvider` was recreating its context `value` object on every render because `signOut` was an inline function and the object itself was not memoized. This caused all `useAuth` consumers to re-render whenever `AuthProvider` re-rendered (e.g., due to parent updates like theme toggle), even if authentication state hadn't changed.
**Action:** Always memoize context values (`useMemo`) and functions (`useCallback`) exposed via Context to prevent unnecessary re-renders in consumers.

## 2024-05-23 - Playwright Mocking for Supabase
**Learning:** Playwright `page.route` handlers are evaluated in reverse registration order (last registered = first checked). Also, mocking Supabase `single()` queries requires returning a JSON object, while `.in()` queries require a JSON array, even if checking `includes` on the URL. Mismatched response shapes can cause silent failures or retries.
**Action:** Register specific route handlers *after* generic ones, and ensure mock response bodies match the expected return type (Object vs Array) of the Supabase method being optimized.
