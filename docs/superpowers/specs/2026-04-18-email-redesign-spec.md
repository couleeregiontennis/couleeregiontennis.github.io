# Spec: 2026 LTTA Season Kickoff Email Redesign
**Date:** 2026-04-18
**Status:** Approved

## 1. Overview
The goal is to update the automated team email generation script (`create-emails.js`) to support the 2026 season's structural changes and improve the user experience for players and captains.

## 2. Goals
- **Website Adoption:** Make the digital home the primary source for schedules and standings.
- **Clarity on Rules:** Highlight the new 2026 rules (Scoring, Heat, Lineups).
- **Contact Accessibility:** Provide quick access to Captain and Coordinator contact info for "at-the-court" situations.
- **Brand Professionalism:** Show the full leadership team to reinforce league community.

## 3. Design Requirements

### 3.1 Content Structure
1.  **Header:** LTTA 2026 Season Kickoff Branding.
2.  **Team Context:** "Night - Team Number - Team Name" banner.
3.  **Essential Links (Call-to-Action):**
    *   Link to `https://couleeregiontennis.github.io`
    *   Instructions for $25 fee (Zeffy online or Captain).
4.  **Team Contacts:**
    *   Captain Name & Phone.
    *   Night Coordinator (Tues: Tom Dwyer / Wed: Mark Hoff).
5.  **2026 Season Updates Section:**
    *   **Participation Point:** 1pt awarded for attendance.
    *   **Heat Rule:** "Feels Like" temp via weather.com (95°F optional / 104°F auto-cancel).
    *   **Lineup Responsibility:** Home team fills sheet first in a standoff.
    *   **Championship Picnic:** Cross-night matches (1v2), starting at 2-all.
6.  **Footer:**
    *   Leadership recognition: Brett Meddaugh, Jenn Carr, Tom Dwyer, Mark Hoff.
    *   Sub Policy reminder.
    *   Feedback request for digital scoring.

### 3.2 Visual Design
- **Style:** Modern, card-based HTML template.
- **Color Palette:** Primary Blue (`#004080`), Action Blue (`#0066cc`), Light backgrounds (`#f8f9fa`) for content blocks.
- **Mobile UX:** Single-column layout, large tap targets for buttons, bold headers for scannability.

## 4. Technical Implementation
- **Source Script:** `management-scripts/create-emails.js`.
- **CSV Data Source:** `/Users/brett/Downloads/2026 LTTA TEAM ROSTERS.xlsx - ROSTERS-2.csv`.
- **Mapping:**
    *   `Night`: Column `v`
    *   `Team`: Column `Team/`
    *   `Name`: Column `1-Name`
    *   `Phone`: Column `1-Telephone`
    *   `Email`: Column `Email`
    *   `Captain`: `C/CC` field check for 'C'.
- **Output:** HTML files in `output_emails/` (ignored by git).

## 5. Success Criteria
- Emails generate successfully for all teams with valid captains.
- "Feels Like" heat rule and participation point scoring are clearly communicated.
- Layout remains readable on mobile devices.
