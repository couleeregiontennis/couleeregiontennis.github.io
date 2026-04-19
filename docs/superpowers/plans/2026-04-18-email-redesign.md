# 2026 Email Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `create-emails.js` to a modern, mobile-responsive layout that includes 2026 rule changes and dynamic leadership contacts.

**Architecture:** Refactor the monolithic script into a template-based generation system that pulls from the 2026 rosters CSV.

**Tech Stack:** Node.js, `csv-parse`, `fs`.

---

### Task 1: Setup Testing & Refactor Template Function

**Files:**
- Create: `tests/email-template.test.js`
- Modify: `management-scripts/create-emails.js`

- [ ] **Step 1: Create a test for the template generation**
```javascript
// tests/email-template.test.js
const { generateEmailTemplate } = require('../management-scripts/create-emails');

describe('Email Template', () => {
  test('should include team name and captain info', () => {
    const mockTeam = {
      night: 'Tues',
      teamNumber: '1',
      teamName: 'Spin Doctors',
      captain: { name: 'Jim', phone: '123' },
      coCaptain: null
    };
    const html = generateEmailTemplate(mockTeam);
    expect(html).toContain('Spin Doctors');
    expect(html).toContain('Jim');
  });
});
```

- [ ] **Step 2: Refactor `create-emails.js` to export a template function**
Extract the HTML body into a `generateEmailTemplate` function. Use the approved mockup HTML from `docs/superpowers/specs/2026-04-18-email-redesign-spec.md`.

- [ ] **Step 3: Implement minimal template function in `create-emails.js`**
Ensure it takes a `team` object and returns the full HTML string.

- [ ] **Step 4: Commit**
```bash
git add management-scripts/create-emails.js tests/email-template.test.js
git commit -m "refactor: extract email template to function"
```

---

### Task 2: Implement 2026 Rule Content & Logic

**Files:**
- Modify: `management-scripts/create-emails.js`

- [ ] **Step 1: Update the "2026 Season Updates" section**
Include Participation Point, Heat Rule, Home Team responsibility, and Championship Picnic (with 2-all scoring).

- [ ] **Step 2: Add Feedback Loop**
Include a line requesting feedback on the digital scoring site: "Once the season starts, please provide feedback on the new digital scoring site."

- [ ] **Step 3: Commit**
```bash
git commit -am "feat: add 2026 rule updates and feedback loop to email template"
```

---

### Task 3: Dynamic Leadership & Contact Sections

**Files:**
- Modify: `management-scripts/create-emails.js`

- [ ] **Step 1: Implement Night-specific Coordinator logic**
If `night === 'Tues'`, show Tom Dwyer. If `night === 'Wed'`, show Mark Hoff.

- [ ] **Step 2: Add the "Your Team Contacts" box to template**
Include Captain, Co-Captain (if exists), and the Night Coordinator.

- [ ] **Step 3: Add Leadership Footer**
Include Brett, Jenn, Tom, and Mark in the footer table.

- [ ] **Step 4: Commit**
```bash
git commit -am "feat: implement dynamic leadership and team contact blocks"
```

---

### Task 4: Final Validation & Cleanup

- [ ] **Step 1: Run the full script**
Run: `node management-scripts/create-emails.js`

- [ ] **Step 2: Verify output files**
Ensure files are created in `output_emails/` and contain the correct dynamic data.

- [ ] **Step 3: Remove the mockup file**
Run: `rm /Users/brett/.gemini/extensions/superpowers/skills/brainstorming/scripts/mockup.html`

- [ ] **Step 4: Commit all changes**
```bash
git add .
git commit -m "feat: finalize 2026 email redesign"
```
