# LTTA League Management Scripts

Welcome, League Coordinator\!  
This folder contains scripts to help you manage the Coulee Region Tennis Association (LTTA) league. These scripts automate scheduling, roster creation, email generation, and printable scoresheets.

---

## 📦 How to Run Scripts

1. **Open a terminal** (Command Prompt, Terminal, etc.)
2. **Navigate to the `management-scripts` folder**:
   ```bash
   cd management-scripts
   ```
3. **Run a script** by typing:
   ```bash
   node {scriptname}.js
   ```
   Replace `{scriptname}` with the name of the script you want to run (see below).

---

## 🗂️ Script Descriptions & Order

### 1. `generate-roster.js`

- **Purpose:** Generates a roster file for every team.
- **Input:** `ltta.csv` (spreadsheet of all players/teams)
- **Output:** JSON roster files in `teams/{night}/rosters/`
- **Run first\!**
  ```bash
  node generate-roster.js
  ```

---

### 2. `generate-rr.js`

- **Purpose:** Generates the round robin schedule for the league.
- **Input:** `ltta.csv`
- **Output:** Schedule files in `teams/{night}/schedules/`
- **Details:**
  - Uses the year you set in the script.
  - If you keep the same year, you can safely regenerate the schedule after making changes to teams.
  - Changing the year will create a new schedule order.
- **Run after generating rosters.**
  ```bash
  node generate-rr.js
  ```

---

### 3. `generate-all-html.js`

- **Purpose:** Creates a single HTML file showing all matches for all teams (for a given night).
- **Input:** Team schedule JSON files (created by `generate-rr.js`)
- **Output:** `all.html` in `teams/{night}/`
- **Details:**
  - Many players like to see all matches in one place.
  - You may need to edit the script to set the correct night (`tuesday` or `wednesday`).
- **Run after generating the schedule.**
  ```bash
  node generate-all-html.js
  ```

---

### 4. `create-emails.js`

- **Purpose:** Generates "start of year" emails for each team.
- **Input:** `ltta.csv`
- **Output:** HTML email files in `output_emails/`
- **Details:**
  - You may need to update coordinator info at the top of the script.
- **Run after generating rosters and schedules.**
  ```bash
  node create-emails.js
  ```

---

### 5. `generate-scoresheet.js`

- **Purpose:** Creates printable paper scoresheets for each match.
- **Input:** Team rosters and schedules (JSON), `scoresheet.html` template
- **Output:** HTML scoresheets in `scoresheets/` (named by date as `YYYY-MM-DD.html`)
- **Details:**
  - Saves sheets flat inside the `scoresheets/` folder named exactly after their match dates.
  - These files can be opened in a browser and printed.
  - Each match in the file will automatically print on a separate page.
- **Run after generating rosters and schedules.**
  ```bash
  node generate-scoresheet.js
  ```

---

### 6. `generate-pdf.js`

- **Purpose:** Combines all individual HTML scoresheets into a single, high-quality, printable PDF document.
- **Input:** Generated HTML scoresheets `scoresheets/YYYY-MM-DD.html`, `scoresheet.html` template CSS
- **Output:** `scoresheets/all-scoresheets.pdf` (master PDF) and `scoresheets/all-scoresheets.html` (combined HTML)
- **Details:**
  - Scans the flat `scoresheets/` folder for date-named HTML files, sorting them chronologically.
  - Automatically loads and renders all **132 match sheets** in sequential date order.
  - Uses Playwright to print the sheets with professional print-layout margins.
- **Run after generating scoresheets.**
  ```bash
  node generate-pdf.js
  ```

---

## 📝 Typical Workflow (order matters)

1. **Update the Google Sheet** with the latest player/team info
   - The sheet will automatically publish changes to the CSV URL
2. **Run `generate-roster.js`** to create team rosters
3. **Run `generate-rr.js`** to create the season schedule
4. **Run `generate-all-html.js`** to create the all-teams schedule for each night
5. **Run `create-emails.js`** to generate team emails
6. **Run `generate-scoresheet.js`** to generate printable scoresheets
7. **Run `generate-pdf.js`** to compile all scoresheets into a single printable PDF file.

---

## 📁 Output Locations

- **Rosters:** `teams/{night}/rosters/`
- **Schedules:** `teams/{night}/schedules/`
- **All-team HTML:** `teams/{night}/all.html`
- **Emails:** `output_emails/`
- **Scoresheets:** `scoresheets/YYYY-MM-DD.html` (flat in the scoresheets folder)
- **Combined PDF:** `scoresheets/all-scoresheets.pdf`

---

## 🖨️ Printing Scoresheets

You have two options for printing the match scoresheets:

### Option A: The Combined PDF (Recommended)
1. Open the compiled master PDF file: [all-scoresheets.pdf](scoresheets/all-scoresheets.pdf).
2. Open the browser or system print dialog (Cmd+P or Ctrl+P).
3. Ensure **Margins are set to "None"** or **"Default"** (since the layout is perfectly sized for letter sheets).
4. Print the entire season's 132 scoresheets at once!

### Option B: Individual Date-named HTML Files
1. Open any generated HTML file in the `scoresheets/` folder (e.g., `2026-05-26.html`) in your browser.
2. Print (Cmd+P or Ctrl+P).
3. Each match will automatically be on a separate page.

---

## ℹ️ Notes & Tips

- The scripts now pull data directly from the published Google Sheet
- Don't change the website data google sheet format
- For any issues, check the console output for error messages
- You can re-run any script as needed; files will be overwritten with the latest data
- **Calendar (ICS) Caching:** The website uses a cache-buster query parameter (`?v=2026`) when rendering individual and team calendar download links in the UI. This forces browsers and CDNs to fetch the newly generated 2026 `.ics` files and prevents users from downloading cached 2025 versions.

---

**Questions?**  
Contact Brett Meddaugh or your league coordinator for help\!
