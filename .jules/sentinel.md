## 2025-05-23 - Privilege Escalation via Profile Update
**Vulnerability:** Users could self-promote to "Captain" (Admin) status by manipulating the `is_captain` field in their profile update request, or simply by checking a checkbox in the UI if it was enabled.
**Learning:** Never trust client-side data for privileged roles. Authorization fields should be immutable by the user and strictly controlled by backend policies (RLS). UI controls for these fields must be read-only or removed for non-admins.
**Prevention:**
1. Exclude sensitive fields (like `is_captain`, `role`, `permissions`) from user-editable forms and update payloads.
2. Ensure Row Level Security (RLS) policies explicitly forbid users from updating these columns on their own records.

## 2025-05-24 - Client-Side Authorization Bypass
**Vulnerability:** Admin and Captain routes were accessible to any authenticated user because `ProtectedRoute` only verified authentication status, not user roles. Access control relied on individual components rendering "Access Denied" messages, which is fragile and poor UX.
**Learning:** Centralized route guards are essential for enforcing authorization at the entry point. Relying on component-level checks spreads security logic thin and increases the risk of accidental exposure.
**Prevention:**
1. Enhanced `ProtectedRoute` to accept `requireAdmin` and `requireCaptain` props.
2. Enforced role checks before rendering any route content.
3. Redirect unauthorized users to a safe default (Home) immediately.
## 2025-12-16 - Edge Function User ID Spoofing
**Vulnerability:** The `submit-suggestion` Edge Function blindly trusted the `userId` provided in the JSON request body, allowing any user (or anonymous actor) to spoof their identity if they knew another user's UUID.
**Learning:** Supabase Edge Functions often use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for specific operations. In these contexts, you cannot trust `auth.uid()` implicitly unless you initialize the client with the user's JWT. Trusting input params for identity is a critical flaw.
**Prevention:**
1. Never destructure sensitive fields like `userId`, `role`, or `permissions` from the request body.
2. If user identity is needed, derive it from the `Authorization` header by initializing a Supabase client with the incoming JWT and calling `auth.getUser()`.
3. If anonymous submission is the goal, explicitly set `user_id` to `null` rather than accepting it from input.

## 2025-10-27 - Unbounded Input on AI/LLM Endpoints
**Vulnerability:** The 'Ask the Umpire' input field allowed unlimited character input, which was passed directly to a Supabase Edge Function (likely wrapping an LLM). This created a risk of Denial of Service (DoS) via cost exhaustion or function timeouts.
**Learning:** Frontend `maxLength` attributes are a critical first line of defense against abuse, especially for features that trigger expensive backend operations (like AI calls). While backend validation is definitive, frontend limits prevent accidental or low-effort abuse.
**Prevention:**
1. Enforce strict `maxLength` attributes on all free-text inputs, especially those hitting paid APIs.
2. Provide visual feedback (character counters) so users understand the constraint.
