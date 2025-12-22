## 2024-05-22 - [Unbounded Input DoS Risk]
**Vulnerability:** The `notes` field in `AddScore.jsx` was an unbounded text area, allowing potentially unlimited character input.
**Learning:** Frontend input validation is a critical first line of defense against Denial of Service (DoS) and database exhaustion attacks. Without limits, a malicious user could submit massive payloads, degrading server performance or filling storage.
**Prevention:** Always enforce `maxLength` on text inputs and textareas. Couple this with visual feedback (character counters) for usability and ensure backend validation mirrors these constraints.
