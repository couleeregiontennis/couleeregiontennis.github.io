# Ask the Umpire & Rules Management

This project uses a **Single Source of Truth** architecture for the League Rules. This ensures that the "Ask the Umpire" AI bot and the "Rules" page on the website always present the same information.

## How it Works

1.  **The Source:** The file `public/rules_context.md` is the master document.
2.  **The Website:** The `Rules.jsx` component fetches this file (`/rules_context.md`) and renders it for users.
3.  **The Bot:** The `ask-umpire` Supabase Edge Function fetches this file from the live website (`https://couleeregiontennis.org/rules_context.md`) every time a question is asked.

## How to Update the Rules

1.  **Edit the File:** Open `public/rules_context.md` in your editor.
2.  **Make Changes:** Update the text, dates, or fees as needed using standard Markdown.
3.  **Deploy:** Commit and push your changes to GitHub.
    ```bash
    git add public/rules_context.md
    git commit -m "update: 2025 season rules"
    git push origin main
    ```
4.  **Done:** 
    *   The website will update automatically upon deployment.
    *   The bot will start using the new rules immediately after the site deployment is finished.

## Troubleshooting

*   **Bot is giving old answers:** 
    *   Check if the website deployment has finished.
    *   Verify the file exists at `https://couleeregiontennis.org/rules_context.md`.
*   **Bot Error:** 
    *   Ensure the `UMPIRE_GEMINI_API_KEY` secret is set in your Supabase project.

## Architecture Diagram

```mermaid
graph TD
    A[public/rules_context.md] -->|Fetches| B[Website UI (Rules.jsx)]
    A -->|Hosted at URL| C[Live Site]
    C -->|Fetches| D[Supabase Edge Function (ask-umpire)]
    D -->|Sends Context + Question| E[Gemini AI]
    E -->|Returns Answer| D
    D -->|Returns Answer| F[Chat Widget (AskTheUmpire.jsx)]
```
