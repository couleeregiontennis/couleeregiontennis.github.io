# DeepSeek Agent Conventions: Coulee Region Tennis

The Coulee Region Tennis Association (CRTA) official website, hosted as a static GitHub Pages site.

## 🏗️ Architecture & Tech Stack
- **Site Structure:** Static HTML with modular `pages` and `partials`.
- **Styling:** CSS in the `/styles` directory.
- **Client-Side Logic:** JavaScript in the `/scripts` directory.
- **Testing:** Playwright for ensuring all static links and pages are healthy.
- **Management:** Custom automation scripts in `/management-scripts` for handling team data.

## 🛠️ Operational Workflow
- **Updates:** Since the site is static, editing `index.html` or files in `pages/` directly updates the site.
- **Deployment:** Automatically deployed via GitHub Pages from the `main` branch.
- **Verification:** Always run existing tests to ensure no broken links after editing templates:
  ```bash
  npx playwright test
  ```

## 🎾 Organization Logic
- **Scope:** CRTA covers the broader Coulee Region (La Crosse area), while LTTA is the specific summer league.
- **Content:** The site serves as the primary portal for registration (via Ryzer), court maintenance fund status, and board information.

## 🧠 DeepSeek V3.2 Specifics
- **Architect Mode:** Use `deepseek-reasoner` for restructuring the template system (partials/pages) or designing new automation scripts for team management.
- **Editor Mode:** Use `deepseek-chat` for fast content updates, style tweaks, and maintaining the project's documentation.
- **Tool-Use:** Leverage DeepSeek to automate repetitive static site maintenance, like updating the `CNAME` or updating year-based strings across multiple files.
