## 2025-04-11 - XSS and Protocol-Relative URL bypass in innerHTML

**Vulnerability:** The application was vulnerable to Cross-Site Scripting (XSS) due to unsafe assignment of untrusted data (JSON and CSV) directly into `innerHTML` properties within scripts like `scripts/standings.js` and `scripts/team.js`. Additionally, URLs parsed from external data sources were embedded directly into `href` attributes without sanitization.

**Learning:** This codebase relies on fetching data from remote files (like Google Sheets CSV endpoints or local JSON endpoints structured from external files) and directly injecting it into the DOM. This pattern skips standard XSS mitigations often provided by modern frameworks. To mitigate, an `escapeHTML` helper was added and utilized to encode inputs before interpolation. For links, string manipulations such as checking for `javascript:` via simple string search are insufficient, so a URL parsing function validating against disallowed protocols was required.

**Prevention:** Always use `escapeHTML` for any data being inserted via `innerHTML`. When dynamically constructing URLs from external data to be placed in `href`, always sanitize it using the `URL` API and explicit protocol validation.
