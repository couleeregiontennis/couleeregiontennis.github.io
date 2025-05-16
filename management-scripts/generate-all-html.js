// This script generates the html file for the Tuesday or Wednesday night schedule from the JSON files in the teams folder.
const fs = require('fs');
const path = require('path');

const day = "wednesday"; // Change to "tuesday" or "wednesday"
const year = 2025;       // Change if needed

const teamsDir = path.join(__dirname, '..', 'teams', day);
const schedulesDir = path.join(teamsDir, 'schedules');
const rostersDir = path.join(teamsDir, 'rosters');
const outputFile = path.join(teamsDir, 'all.html');
const scheduleTitle = `${day.charAt(0).toUpperCase() + day.slice(1)} NIGHT SCHEDULE ${year} - LTTA`;

// Helper to format date as D-MMM (e.g., 3-Jun), and shift by +1 day for Wednesday
function formatDate(dateStr) {
  const d = new Date(dateStr);
  // If this is a Wednesday schedule, shift date by +1 day
  if (day.toLowerCase().startsWith('wednes')) {
    d.setDate(d.getDate() + 1);
  }
  const dayNum = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${dayNum}-${month}`;
}

// use these court groups, in this order
const allCourts = [
  "Courts 1–5",
  "Courts 6–9",
  "Courts 10–13"
];

// use these times, in this order
const allTimes = [
  "5:30pm",
  "7:00pm"
];

// Read all team schedule files
const teamFiles = fs.readdirSync(schedulesDir)
  .filter(f => /^\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));

// Map team number to team name (from roster files)
const teams = {};
teamFiles.forEach(file => {
  const teamNum = file.replace(/\.json$/, '');
  const rosterPath = path.join(rostersDir, file);
  if (fs.existsSync(rosterPath)) {
    const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
    teams[teamNum] = roster.teamName || `Team ${teamNum}`;
  } else {
    teams[teamNum] = `Team ${teamNum}`;
  }
});

// Gather all matches by week
const matchesByWeek = {};
teamFiles.forEach(file => {
  const teamNum = file.replace(/\.json$/, '');
  const data = JSON.parse(fs.readFileSync(path.join(schedulesDir, file), 'utf8'));
  (data.schedule || []).forEach(match => {
    const week = match.week;
    if (!matchesByWeek[week]) matchesByWeek[week] = [];
    // Avoid duplicate matches (only add if teamNum < opponent.number)
    if (parseInt(teamNum) < parseInt(match.opponent.number)) {
      matchesByWeek[week].push({
        team: teamNum,
        opponent: match.opponent.number,
        time: match.time,
        courts: match.courts,
        date: match.date
      });
    }
  });
});

// Get unique weeks sorted
const weeks = Object.keys(matchesByWeek).map(Number).sort((a, b) => a - b);

// Get dates for each week
const weekDates = {};
weeks.forEach(week => {
  const match = matchesByWeek[week][0];
  weekDates[week] = formatDate(match.date);
});

// Build schedule: week -> court -> time -> [matches]
const schedule = {};
weeks.forEach(week => {
  schedule[week] = {};
  allCourts.forEach(court => {
    schedule[week][court] = {};
    allTimes.forEach(time => {
      schedule[week][court][time] = [];
    });
  });
  matchesByWeek[week].forEach(match => {
    if (allCourts.includes(match.courts) && allTimes.includes(match.time)) {
      schedule[week][match.courts][match.time].push({
        team: match.team,
        opponent: match.opponent
      });
    }
  });
});

// Generate HTML
let html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${scheduleTitle}</title>
    <style>
      html, body {
        font-size: 24px;
      }
      @media print {
        html, body {
          width: 100%;
          margin: 0;
          padding: 0;
          background: #fff !important;
        }
        body {
          font-size: 12px;
          margin: 0;
        }
        .schedule-table {
          margin: 0;
          width: 100%;
        }
        .schedule-table th, .schedule-table td {
          padding: 1px 3px;
        }
        h1 {
          margin: 3px 0 5px 0;
        }
        .schedule-table {
          page-break-after: always;
        }
      }
      /* Mobile-friendly styles */
      @media screen and (max-width: 600px) {
        body {
          font-size: 30px;
          margin: 6px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 18px;
        }
        .schedule-table {
          font-size: 18px;
        }
        .schedule-table th, .schedule-table td {
          padding: 14px 8px;
        }
        .date-row {
          font-size: 20px;
        }
        .court-header, .time-header {
          font-size: 18px;
        }
        .match-cell {
          font-size: 18px;
        }
        .team-num {
          font-size: 1.1em;
          padding: 2px 8px;
        }
      }
      body {
        font-family: "Segoe UI", Arial, sans-serif;
        margin: 18px;
        background: #f9f9fb;
        color: #222;
        line-height: 1.5;
      }
      h1 {
        font-size: 24px;
        text-align: center;
        margin-bottom: 14px;
        letter-spacing: 1px;
        color: #2a4d69;
      }
      .schedule-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        border-radius: 8px;
        overflow: hidden;
      }
      .schedule-table th, .schedule-table td {
        border: 1px solid #e0e0e0;
        padding: 8px 12px;
      }
      .date-row {
        background-color: #e3ecf7 !important;
        font-weight: bold;
        border-top: 2px solid #b3c6e0;
        border-bottom: 1px solid #b3c6e0;
        text-align: center;
      }
      .court-row {
        border-bottom: 1px solid #e0e0e0;
      }
      .time-header {
        text-align: left;
        font-weight: bold;
        padding: 10px 12px;
        border-bottom: 2px solid #b3c6e0;
        background: #f5f8fb;
      }
      .court-header {
        font-weight: bold;
        padding: 10px 12px;
        width: 18%;
        vertical-align: top;
        text-align: left;
        background: #f5f8fb;
        border-right: 2px solid #b3c6e0;
      }
      .match-cell {
        padding: 10px 12px;
        vertical-align: top;
        line-height: 1.5;
        width: 41%;
      }
      .team-num {
        color: #2a4d69;
        font-weight: bold;
        background: #eaf2fa;
        border-radius: 3px;
        padding: 1px 5px;
        margin-right: 4px;
        font-size: 1em;
      }
    </style>
  </head>
  <body>
    <h1>${scheduleTitle}</h1>
    <table class="schedule-table">
      <tr>
        <th class="court-header">Court Group</th>
        ${allTimes.map(t => `<th class="time-header">${t}</th>`).join('')}
      </tr>
`;

weeks.forEach(week => {
  html += `      <tr class="date-row"><td colspan="${1 + allTimes.length}">${weekDates[week]}</td></tr>\n`;
  allCourts.forEach(court => {
    html += `      <tr class="court-row">\n`;
    html += `        <td class="court-header">${court}</td>\n`;
    allTimes.forEach(time => {
      const matchups = schedule[week][court][time];
      html += `        <td class="match-cell">`;
      if (matchups && matchups.length > 0) {
        matchups.slice(0, 2).forEach(m => {
          html += `<span class="team-num">${m.team}</span>${teams[m.team]} vs <span class="team-num">${m.opponent}</span>${teams[m.opponent]}<br>`;
        });
      }
      html += `</td>\n`;
    });
    html += `      </tr>\n`;
  });
});

html += `    </table>\n  </body>\n</html>\n`;

fs.writeFileSync(outputFile, html);
console.log('all.html generated! for ' + day.charAt(0).toUpperCase() + day.slice(1) + ' night');