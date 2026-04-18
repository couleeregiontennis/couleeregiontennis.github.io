# Zeffy Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Zeffy script and registration link to the latest version.

**Architecture:** Replace existing script tags in all HTML files, update the registration button in the navigation partial, and ensure the modal logic is compatible.

**Tech Stack:** HTML, JavaScript

---

### Task 1: Replace Zeffy Script Tag in all HTML files

**Files:**
- Modify: `index.html`
- Modify: `pages/greenisland.html`
- Modify: `pages/ltta-rules.html`
- Modify: `pages/standings.html`
- Modify: `pages/subs.html`
- Modify: `pages/team.html`

- [ ] **Step 1: Replace the script tag in `index.html`**

Old script: `<script src="https://js.zeffy.com/embed-form-opener.bundle.js"></script>`
New script: `<script src="https://zeffy-scripts.s3.ca-central-1.amazonaws.com/embed-form-script.min.js"></script>`

- [ ] **Step 2: Replace the script tag in `pages/greenisland.html`**

Old script: `<script src="https://js.zeffy.com/embed-form-opener.bundle.js"></script>`
New script: `<script src="https://zeffy-scripts.s3.ca-central-1.amazonaws.com/embed-form-script.min.js"></script>`

- [ ] **Step 3: Replace the script tag in `pages/ltta-rules.html`**

Old script: `<script src="https://js.zeffy.com/embed-form-opener.bundle.js"></script>`
New script: `<script src="https://zeffy-scripts.s3.ca-central-1.amazonaws.com/embed-form-script.min.js"></script>`

- [ ] **Step 4: Replace the script tag in `pages/standings.html`**

Old script: `<script src="https://js.zeffy.com/embed-form-opener.bundle.js"></script>`
New script: `<script src="https://zeffy-scripts.s3.ca-central-1.amazonaws.com/embed-form-script.min.js"></script>`

- [ ] **Step 5: Replace the script tag in `pages/subs.html`**

Old script: `<script src="https://js.zeffy.com/embed-form-opener.bundle.js"></script>`
New script: `<script src="https://zeffy-scripts.s3.ca-central-1.amazonaws.com/embed-form-script.min.js"></script>`

- [ ] **Step 6: Replace the script tag in `pages/team.html`**

Old script: `<script src="https://js.zeffy.com/embed-form-opener.bundle.js"></script>`
New script: `<script src="https://zeffy-scripts.s3.ca-central-1.amazonaws.com/embed-form-script.min.js"></script>`

---

### Task 2: Update Registration Button in `partials/nav.html`

**Files:**
- Modify: `partials/nav.html`

- [ ] **Step 1: Update the registration button URL and attribute**

Old button:
```html
      <button 
        type="button" 
        data-zeffy-form-url="https://www.zeffy.com/en-US/ticketing/2026-la-crosse-team-tennis" 
        class="pay-button-final"
      >Continue to Registration</button>
```

New button:
```html
      <button 
        type="button" 
        data-zeffy-form-link="https://www.zeffy.com/embed/ticketing/2026-la-crosse-team-tennis?modal=true" 
        class="pay-button-final"
      >Continue to Registration</button>
```

---

### Task 3: Update `scripts/nav.js` Modal Logic

**Files:**
- Modify: `scripts/nav.js`

- [ ] **Step 1: Ensure modal closing logic works with Zeffy script**

Update the delay to 200ms to be safer.

```javascript
        payButtonFinal.addEventListener('click', () => {
          // Use a tiny delay to ensure Zeffy script sees the click before we hide the button
          setTimeout(() => {
            modal.style.display = 'none';
          }, 200);
        });
```

---

### Task 4: Verification

- [ ] **Step 1: Verify script tags**
- [ ] **Step 2: Verify registration link and attribute**
- [ ] **Step 3: Verify modal closing delay**
