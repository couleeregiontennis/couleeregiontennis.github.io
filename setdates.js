const fs = require('fs');
const path = require('path');

// ---- CONFIGURE THESE ----
const startDate = '2025-06-05'; // YYYY-MM-DD, must be a Tuesday
const numWeeks = 11;            // Number of weeks to update
const dir = path.join(__dirname, 'data', 'wednesday');
// -------------------------

function getNextTuesdays(start, count) {
  const dates = [];
  let d = new Date(start);
  for (let i = 0; i < count; i++) {
    // Format as YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

const tuesdayDates = getNextTuesdays(startDate, numWeeks);

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(data.matches)) {
      data.matches.forEach((match, idx) => {
        if (idx < tuesdayDates.length) {
          match.date = tuesdayDates[idx];
        }
      });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Updated ${file}`);
    }
  }
});