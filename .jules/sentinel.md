## 2025-05-18 - XSS via Unsafe innerHTML Injection in Standings and Teams Components
**Vulnerability:** External data sourced from CSVs and JSON endpoints was directly injected into the DOM via `innerHTML` without sanitization. URLs from these sources were assigned to `href` attributes unchecked.
**Learning:** Pure vanilla JS implementation heavily relies on string concatenation to construct DOM elements (`<tr>`, `<td>`, `<a>`). Unlike modern frameworks, it lacks automatic context-aware escaping.
**Prevention:** Always implement an `escapeHTML` function for any external text injected via string concatenation into `innerHTML`. Implement a `sanitizeUrl` function to drop `javascript:`, `data:`, and `vbscript:` schemes for any external data assigned to `href` or other URI sinks.
