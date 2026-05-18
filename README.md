# LTTA League Management

## Email Draft Generator (Google Apps Script)

We use a Google Apps Script to automatically generate Gmail drafts for each team captain.

### Setup Instructions:
1. Open the [LTTA Roster Spreadsheet](https://docs.google.com/spreadsheets/d/1Pzj28cWGBFZI7_ZL4-zW3zLVyuIu2XcLUa0s2LDMpE0/edit).
2. Go to **Extensions > Apps Script**.
3. Copy the content from `management-scripts/ltta-apps-script.js` in this repository.
4. Paste it into the Apps Script editor (delete any existing code).
5. Click **Save** (floppy disk icon) and name it \"LTTA Emailer\".
6. Refresh your spreadsheet page.
7. A new menu **\"LTTA Tools\"** will appear at the top.
8. Click **LTTA Tools > Create Email Drafts** to generate drafts in your Gmail account.

*Note: The first time you run it, you will need to authorize the script to access your Gmail and Sheets.*

## Local Scripts
- `management-scripts/create-emails.js`: Refreshes the `ltta-apps-script.js` file with the latest templates and logic.
