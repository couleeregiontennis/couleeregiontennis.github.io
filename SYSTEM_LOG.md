# Automated Auditor System Log

## 2025-05-XX - XSS Sanitization Bypass via HTML Entities
**Vulnerability:** A bot (Sentinel) attempted to implement a `sanitizeUrl` function to block `javascript:`, `data:`, and `vbscript:` schemes using `startsWith()`. However, when this sanitized URL is injected into the DOM via `innerHTML` (e.g., `href="${sanitizeUrl(url)}"`), the browser's HTML parser decodes HTML entities *before* evaluating the URL scheme. An attacker can supply `javascript&#58;alert(1)` which bypasses the `startsWith('javascript:')` check but executes successfully in the browser.
**Learning:** URL sanitizers must decode HTML entities and strip control characters/whitespaces before validating the scheme, or better yet, parse the URL using the `URL` API and check the `.protocol` property.

## 2025-05-XX - Reverse Tabnabbing Regression in Audit
**Vulnerability:** A bot (Jules) performed an audit and explicitly removed `rel="noopener noreferrer"` from `target="_blank"` anchor tags. This reintroduced a reverse tabnabbing security vulnerability.
**Learning:** Automated auditors can suffer from destructive confirmation bias, removing essential security attributes if they don't understand their purpose. Security invariants must be hardcoded in memory/checklists for future bots.
## 2024-05-18 - [Nemesis Prime] Inadequate URL validation via startsWith
**Vulnerability:** URL validation uses `startsWith` instead of the `URL` API, which is susceptible to entity/whitespace bypass (e.g. ` javascript:`, or `jav&#x09;ascript:`).
**Learning:** Simple string checks are insufficient for URL validation due to browser normalization.
**Prevention:** Use the `URL` API's `.protocol` property to identify and block dangerous schemes.

## 2024-05-18 - [Nemesis Prime] Loose falsy check in escapeHTML
**Vulnerability:** The escapeHTML function contains a loose falsy check (`if (!val)`) that inadvertently discards valid numerical values like `0`, returning an empty string instead of the escaped number.
**Learning:** When writing sanitization functions, ensure inputs are properly cast to strings (e.g. `String(val)`) instead of using a loose truthiness check.
**Prevention:** Avoid `if (!val)` checks before string conversion in security helpers.

## 2024-05-18 - [Nemesis Prime] Node built-in modules as dependencies
**Vulnerability:** Adding built-in Node modules (e.g. `fs`, `path`) to `package.json` dependencies instead of relying on the environment.
**Learning:** This expands the attack surface, allowing potential malicious packages of the same name on the npm registry to be downloaded instead of the built-ins.
**Prevention:** Do not list built-in Node.js modules in `package.json`.
