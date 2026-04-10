## 2024-04-10 - DOM XSS via innerHTML and missing URL sanitization
**Vulnerability:** XSS and `javascript:` bypass via unsanitized data and URLs injected via `innerHTML` in frontend scripts (`scripts/team.js` and `scripts/standings.js`).
**Learning:** External data sources (like Google Sheets or local JSON) used in `innerHTML` are treated as trusted implicitly. Using `startsWith` or partial matching for URL sanitization leaves room for entity encoding bypasses when injected through `innerHTML`.
**Prevention:** Implement `escapeHTML` for all dynamic data injected via `innerHTML` and use the `URL` API to strictly validate `.protocol` to avoid entity bypasses (`javascript:`, `data:`, `vbscript:`).
