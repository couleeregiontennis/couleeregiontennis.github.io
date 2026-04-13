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
