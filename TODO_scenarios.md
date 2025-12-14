# Future Features TODO

## Playoff Scenarios ("The Path to Victory")
*   **Goal:** Tell teams exactly what needs to happen for them to win/clinch.
*   **Logic:**
    *   Calculate "Magic Number" (wins needed to clinch).
    *   Simulate remaining matches based on win percentages.
    *   Determine status: "Clinched", "Control Destiny", "In the Hunt", "Eliminated".
*   **Implementation:**
    *   Use `standings_view` data.
    *   Ideally use a Supabase Edge Function for the math.
    *   Display on the Standings page.
