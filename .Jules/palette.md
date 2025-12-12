## 2024-05-24 - Semantic Toggle Buttons
**Learning:** Toggle buttons that switch between mutually exclusive views (like Login vs Sign Up) are semantically Tabs, not Buttons.
**Action:** Use `role="tablist"` and `role="tab"` with `aria-selected` instead of just buttons. This informs screen readers that selecting one option deselects the other and switches the view.
