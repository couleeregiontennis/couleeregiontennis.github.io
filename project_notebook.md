# Project Notebook

This file serves as a persistent memory for our work on this project, tracking key decisions, configurations, and corrections.

## 2025-12-12 - Initial Setup and Qdrant Integration

*   **Supabase Environment Setup:**
    *   Confirmed Supabase CLI installation (`v2.58.5`).
    *   Linked the local project directory to the remote Supabase project using reference ID `mzheoplkuuzsegpetukq`.
    *   Updated `supabase/config.toml`: Changed `db.major_version` from `17` to `15` to match the remote database version, resolving a warning.
*   **Qdrant Vector Database Integration:**
    *   Identified the need for a Qdrant client library.
    *   Installed `@qdrant/js-client-rest` (after correcting initial package name error) to allow client-side interaction with Qdrant.
    *   Created a `.env` file in the project root to securely store `VITE_QDRANT_URL` and `VITE_QDRANT_API_KEY`.
    *   Added `.env` to `.gitignore` to prevent sensitive credentials from being committed.
    *   Created `src/scripts/qdrantClient.js`: Configured and exported a `QdrantClient` instance using the environment variables for connection.
*   **Workflow and Agent Collaboration:**
    *   Established a "backend-first" workflow for feature development: Gemini (me) will implement backend/data changes and expose functions, which Jules (the frontend agent) will then consume via the UI.
    *   Clarified that Gemini will manage and optimize the Qdrant database, while Jules will build the UI that utilizes the data exposed by Gemini.

## 2025-12-12 - Adding "Third Set Format" Feature (Schema Retrieval Challenges)

*   **Goal:** Add a `third_set_format` column to the `matches` table to allow users to select the third set type (7-point tiebreak, 10-point tiebreak, full third set).
*   **Initial Plan:** Use `supabase db pull` to get the current schema, then create a migration.
*   **Roadblocks Encountered:**
    1.  `supabase/migrations` directory missing. Attempted `supabase db pull`.
    2.  `supabase db pull` failed due to migration history mismatch. Ran `supabase migration repair` commands (multiple times) as suggested by CLI.
    3.  `supabase db pull` failed again, requiring Docker Desktop. User installed Docker Desktop (`brew install --cask docker`).
    4.  `supabase db pull` failed *again* after Docker was running, due to an `error running container` and `Migration iceberg-catalog-ids not found` error, indicating an internal issue with the CLI's Docker interaction.
    5.  Attempted alternative: `supabase inspect db dump` - proved to be the wrong command.
    6.  Attempted programmatic schema retrieval (Node.js script querying `information_schema`):
        *   Initial script failed due to missing Supabase environment variables in Node.js context.
        *   Attempted to resolve by installing `dotenv` and moving credentials to `.env`. Script *still* failed due to complex environment variable loading between Vite/Node.js.
        *   Attempted simpler script directly importing `supabaseClient.js` (reverting `supabaseClient.js` to hardcoded values temporarily) - failed due to Supabase client library reporting "Could not find the table 'public.information_schema.columns' in the schema cache".
    7.  **Investigation into Gemini CLI & Supabase MCP:** User provided a Reddit link describing a custom `mcp_servers` configuration for Gemini CLI to directly execute SQL against Supabase. The user configured this.
    8.  **MCP Tool Invocation Failure:** Despite user configuration and instruction to use `#supabase SELECT version();`, I was unable to invoke the custom `supabase` MCP tool. My tool registry does not recognize "supabase" or "mcp" as available tools, indicating a limitation in how `mcp_servers` are exposed to me.
*   **Current Status:** Due to persistent technical roadblocks with programmatic schema retrieval and tool invocation, **manual intervention is required.**
*   **Next Step:** User needs to provide the `CREATE TABLE` statement for the `matches` table directly from their Supabase dashboard.
