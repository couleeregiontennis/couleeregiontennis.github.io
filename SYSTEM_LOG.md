# Automated Auditor System Log

## 2025-05-XX - XSS Sanitization Bypass via HTML Entities
**Vulnerability:** A bot (Sentinel) attempted to implement a `sanitizeUrl` function to block `javascript:`, `data:`, and `vbscript:` schemes using `startsWith()`. However, when this sanitized URL is injected into the DOM via `innerHTML` (e.g., `href="${sanitizeUrl(url)}"`), the browser's HTML parser decodes HTML entities *before* evaluating the URL scheme. An attacker can supply `javascript&#58;alert(1)` which bypasses the `startsWith('javascript:')` check but executes successfully in the browser.
**Learning:** URL sanitizers must decode HTML entities and strip control characters/whitespaces before validating the scheme, or better yet, parse the URL using the `URL` API and check the `.protocol` property.

## 2025-05-XX - Reverse Tabnabbing Regression in Audit
**Vulnerability:** A bot (Jules) performed an audit and explicitly removed `rel="noopener noreferrer"` from `target="_blank"` anchor tags. This reintroduced a reverse tabnabbing security vulnerability.
**Learning:** Automated auditors can suffer from destructive confirmation bias, removing essential security attributes if they don't understand their purpose. Security invariants must be hardcoded in memory/checklists for future bots.
