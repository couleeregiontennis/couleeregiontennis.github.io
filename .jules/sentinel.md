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
