const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// CONFIG
const INPUT_FILE = 'ltta.csv';
const OUTPUT_DIR = 'teams';
const START_DATE = '2025-06-03'; // Change as needed
const NUM_WEEKS = 11; // Or set dynamically
const COURT_GROUPS = ["Courts 1–5", "Courts 6–9", "Courts 10–13"];
const TIMES = ["5:30pm", "7:00pm"];

// Helper to add days to a date
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Load CSV or Excel
function loadSheet(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws);
}

function groupByNight(rows) {
  const groups = {};
  rows.forEach(row => {
    const night = row.Night && row.Night.trim();
    const number = row.Team != null ? String(row.Team).trim() : null;
    const name = row['TEAM NAME'] ? row['TEAM NAME'].trim() : null;
    if (!night || !number) return;
    if (!groups[night]) groups[night] = new Map();
    if (!groups[night].has(number)) {
      groups[night].set(number, { number, name });
    }
  });
  // Convert maps to arrays
  Object.keys(groups).forEach(night => {
    groups[night] = Array.from(groups[night].values());
  });
  return groups;
}

// Standard round robin generator
function generateRoundRobin(teams) {
  if (teams.length < 2) return [];
  const localTeams = [...teams];
  if (localTeams.length % 2 !== 0) localTeams.push('BYE');
  const schedule = [];
  const half = localTeams.length / 2;
  for (let round = 0; round < localTeams.length - 1; round++) {
    const matches = [];
    for (let i = 0; i < half; i++) {
      const teamA = localTeams[i];
      const teamB = localTeams[localTeams.length - 1 - i];
      if (teamA !== 'BYE' && teamB !== 'BYE') {
        matches.push([teamA, teamB]);
      }
    }
    schedule.push(matches);
    // Rotate
    const fixed = localTeams[0];
    const rotated = [fixed, localTeams[localTeams.length - 1], ...localTeams.slice(1, -1)];
    for (let j = 0; j < localTeams.length; j++) localTeams[j] = rotated[j];
  }
  return schedule;
}

// Assign slots (court group + time) to matches for each week
function assignSlotsToMatches(matchesByWeek, teams) {
  const slots = [];
  COURT_GROUPS.forEach(court => TIMES.forEach(time => slots.push({ court, time })));

  // Track how many times each team has played at each time
  const teamTimeCounts = {};
  teams.forEach(t => teamTimeCounts[t] = { "5:30pm": 0, "7:00pm": 0 });

  const weekAssignments = [];

  matchesByWeek.forEach((matches, weekIdx) => {
    // Shuffle slots for fairness
    const weekSlots = [...slots];
    
    // Rotate slots for variety
    if (weekIdx % 2 === 1) weekSlots.reverse();

    const assignments = [];
    matches.forEach(([a, b], i) => {
      // Try to balance time slots for teams
      weekSlots.sort((s1, s2) => {
        const t1 = teamTimeCounts[a][s1.time] + teamTimeCounts[b][s1.time];
        const t2 = teamTimeCounts[a][s2.time] + teamTimeCounts[b][s2.time];
        return t1 - t2;
      });
      const slot = weekSlots.shift();
      teamTimeCounts[a][slot.time]++;
      teamTimeCounts[b][slot.time]++;
      assignments.push({ teamA: a, teamB: b, court: slot.court, time: slot.time });
    });
    weekAssignments.push(assignments);
  });

  return weekAssignments;
}

// Main
function main() {
  const rows = loadSheet(INPUT_FILE);

  // Normalize Night field to "tuesday" or "wednesday"
  rows.forEach(row => {
    if (row.Night) {
      const n = row.Night.trim().toLowerCase();
      if (n.startsWith('tue')) row.Night = 'tuesday';
      else if (n.startsWith('wed')) row.Night = 'wednesday';
    }
  });
  const groups = groupByNight(rows);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  for (const [night, teams] of Object.entries(groups)) {
    if (teams.length < 2) {
      console.log(`Skipping '${night}' (only ${teams.length} team)`);
      continue;
    }

    const matchesByWeek = generateRoundRobin(teams);

    // Check that each week has exactly as many matches as slots
    const slotsPerWeek = COURT_GROUPS.length * TIMES.length;
    matchesByWeek.forEach((matches, weekIdx) => {
      if (matches.length !== slotsPerWeek) {
        throw new Error(
          `Week ${weekIdx + 1} for '${night}' has ${matches.length} matches, but there are ${slotsPerWeek} slots. ` +
          `You need exactly ${slotsPerWeek * (matchesByWeek.length)} matches in total for a perfect fit. ` +
          `Check your number of teams.`
        );
      }
    });

    const weekAssignments = assignSlotsToMatches(matchesByWeek, teams);

    // Set start date based on night
    let startDate = START_DATE;
    if (/^wed/i.test(night)) {
      // Add 1 day for Wednesday
      const d = new Date(START_DATE);
      d.setDate(d.getDate() + 1);
      startDate = d.toISOString().slice(0, 10);
    }

    // Generate dates for each week
    const weekDates = [];
    for (let i = 0; i < weekAssignments.length; i++) {
      weekDates.push(addDays(startDate, i * 7));
    }

    // Write per-team schedules
    const schedules = {};
    teams.forEach(t => schedules[t.number] = []);
    weekAssignments.forEach((matches, weekIdx) => {
      matches.forEach(match => {
        // Find team objects for A and B
        const teamA = teams.find(t => t.number === match.teamA.number);
        const teamB = teams.find(t => t.number === match.teamB.number);
        const entry = {
          week: weekIdx + 1,
          date: weekDates[weekIdx],
          time: match.time,
          courts: match.court,
          opponent: {
            name: teamB.name,
            number: teamB.number,
            file: `/pages/team.html?day=${night}&team=${teamB.number}`
          }
        };
        const entryB = {
          week: weekIdx + 1,
          date: weekDates[weekIdx],
          time: match.time,
          courts: match.court,
          opponent: {
            name: teamA.name,
            number: teamA.number,
            file: `/pages/team.html?day=${night}&team=${teamA.number}`
          }
        };
        schedules[teamA.number].push(entry);
        schedules[teamB.number].push(entryB);
      });
    });

    // Write JSON files
    const groupDir = path.join(OUTPUT_DIR, night, "schedules");
    if (!fs.existsSync(groupDir)) fs.mkdirSync(groupDir, { recursive: true });
    for (const [team, sched] of Object.entries(schedules)) {
      fs.writeFileSync(
        path.join(groupDir, `${team.replace(/\s+/g, '_')}.json`),
        JSON.stringify({ team, night: night, schedule: sched }, null, 2)
      );
    }
    console.log(`✅ Generated ${teams.length} team schedules for '${night}'`);

    // Write master schedule for this night
    const masterSchedule = [];
    weekAssignments.forEach((matches, weekIdx) => {
      matches.forEach(match => {
        masterSchedule.push({
          week: weekIdx + 1,
          date: weekDates[weekIdx],
          time: match.time,
          courts: match.court,
          teamA: match.teamA,
          teamB: match.teamB
        });
      });
    });
    fs.writeFileSync(
      path.join(groupDir, `master_schedule.json`),
      JSON.stringify(masterSchedule, null, 2)
    );
    console.log(`✅ Master schedule written for '${night}'`);
  }
}

main();
