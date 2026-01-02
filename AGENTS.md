# Agent Instructions

## UI Changes
*   **Screenshots**: Whenever you make a change to a UI page (HTML, CSS, JSX), you must generate and present a screenshot of the "before" state (if possible/relevant) and the "after" state. Use the `frontend_verification_instructions` tool to help with this.

## Git Workflow
*   **Branch Names**: Always use meaningful, descriptive branch names for your submissions (e.g., `jules/feature/add-login-tests`, `jules/fix/mobile-nav-bug`). Avoid generic or generated names.

## Code Comments
*   **Signatures**: Do not include agent signatures (e.g., "🛡️ Sentinel:", "🤖 Bot:") in code comments.

## Testing
*   **Environment**: Running Playwright tests locally (`pnpm run test:e2e`) requires a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` defined (dummy values are sufficient for mocked tests).
