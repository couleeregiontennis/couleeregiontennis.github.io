// This script generates a React JSX file for the Tuesday or Wednesday night schedule from the JSON files in the teams folder.
// NEEDS TO BE RUN AFTER 'generate-rr'

const fs = require('fs');
const path = require('path');

const day = "tuesday"; // Change to "tuesday" or "wednesday"
const year = 2025;       // Change if needed

const teamsDir = path.join(__dirname, '..', 'teams', day);
const schedulesDir = path.join(teamsDir, 'schedules');
const rostersDir = path.join(teamsDir, 'rosters');
const outputFile = path.join(teamsDir, 'AllSchedule.jsx');
const scheduleTitle = `${day.charAt(0).toUpperCase() + day.slice(1)} NIGHT SCHEDULE ${year} - LTTA`;

// Helper to format date as D-MMM (e.g., 3-Jun)
function formatDate(dateStr) {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayNum = d.getDate();
  const monthName = d.toLocaleString('en-US', { month: 'short' });
  return `${dayNum}-${monthName}`;
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

// Generate JSX
let jsx = `import React from "react";

export default function AllSchedule() {
  return (
    <div className="all-schedule-root">
      <h1 style={{
        fontSize: "2rem",
        textAlign: "center",
        marginBottom: "14px",
        letterSpacing: "1px",
        color: "#2a4d69"
      }}>${scheduleTitle}</h1>
      <table className="schedule-table" style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "18px",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        borderRadius: "8px",
        overflow: "hidden"
      }}>
        <thead>
          <tr>
            <th className="court-header">Court Group</th>
            ${allTimes.map(t => `<th className="time-header">${t}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
`;

weeks.forEach(week => {
  jsx += `          <tr className="date-row"><td colSpan="${1 + allTimes.length}">${weekDates[week]}</td></tr>\n`;
  allCourts.forEach(court => {
    jsx += `          <tr className="court-row">\n`;
    jsx += `            <td className="court-header">${court}</td>\n`;
    allTimes.forEach(time => {
      const matchups = schedule[week][court][time];
      jsx += `            <td className="match-cell">`;
      if (matchups && matchups.length > 0) {
        matchups.slice(0, 2).forEach(m => {
          jsx += `<span className="team-num">${m.team}</span>${teams[m.team]} vs <span className="team-num">${m.opponent}</span>${teams[m.opponent]}<br />`;
        });
      }
      jsx += `</td>\n`;
    });
    jsx += `          </tr>\n`;
  });
});

jsx += `        </tbody>
      </table>
    </div>
  );
}
`;

fs.writeFileSync(outputFile, jsx);
console.log('AllSchedule.jsx generated! for ' + day.charAt(0).toUpperCase() + day.slice(1) + ' night');