## 2024-05-24 - Semantic Toggle Buttons
**Learning:** Toggle buttons that switch between mutually exclusive views (like Login vs Sign Up) are semantically Tabs, not Buttons.
**Action:** Use `role="tablist"` and `role="tab"` with `aria-selected` instead of just buttons. This informs screen readers that selecting one option deselects the other and switches the view.

## 2025-12-13 - Password Visibility Toggles
**Learning:** Users on mobile devices frequently struggle with complex passwords. A visibility toggle drastically reduces frustration and abandonment.
**Action:** Always include a show/hide toggle on password inputs, ensuring it's keyboard accessible and uses proper ARIA labels.
