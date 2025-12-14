## 2025-05-23 - Privilege Escalation via Profile Update
**Vulnerability:** Users could self-promote to "Captain" (Admin) status by manipulating the `is_captain` field in their profile update request, or simply by checking a checkbox in the UI if it was enabled.
**Learning:** Never trust client-side data for privileged roles. Authorization fields should be immutable by the user and strictly controlled by backend policies (RLS). UI controls for these fields must be read-only or removed for non-admins.
**Prevention:**
1. Exclude sensitive fields (like `is_captain`, `role`, `permissions`) from user-editable forms and update payloads.
2. Ensure Row Level Security (RLS) policies explicitly forbid users from updating these columns on their own records.
