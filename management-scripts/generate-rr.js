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

// Helper to create ICS event content
function createICSEvent({summary, description, location, startDate, startTime, endTime, uid}) {
  // startDate: 'YYYY-MM-DD', startTime: 'HH:MM', endTime: 'HH:MM'
  const dtStart = `${startDate.replace(/-/g, '')}T${startTime.replace(':', '')}00`;
  const dtEnd = `${startDate.replace(/-/g, '')}T${endTime.replace(':', '')}00`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coulee Region Tennis//LTTA//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStart}Z`,
    `DTSTART;TZID=America/Chicago:${dtStart}`,
    `DTEND;TZID=America/Chicago:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// Helper to get end time (assume 1.5 hours for each match)
function getEndTime(startTime) {
  const [h, m] = startTime.split(':').map(Number);
  let hour = h, min = m;
  min += 90;
  hour += Math.floor(min / 60);
  min = min % 60;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
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

    const rosterDir = path.join(OUTPUT_DIR, night, "rosters");
    const rosters = {};
    if (fs.existsSync(rosterDir)) {
      fs.readdirSync(rosterDir).forEach(file => {
        const teamNum = file.replace(/\.json$/, '');
        const data = JSON.parse(fs.readFileSync(path.join(rosterDir, file)));
        rosters[teamNum] = data.roster || [];
      });
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

    // Write ICS files
    const icsDirBase = path.join(OUTPUT_DIR, night, "ics");
    for (const [team, sched] of Object.entries(schedules)) {
      const icsDir = path.join(icsDirBase, team.replace(/\s+/g, '_'));
      if (!fs.existsSync(icsDir)) fs.mkdirSync(icsDir, { recursive: true });

      // Collect all VEVENTs for this team
      const vevents = sched.map(match => {
        const startTime = match.time.replace('pm', '') === '7:00' ? '19:00' : '17:30';
        const endTime = getEndTime(startTime);
        const summary = `LTTA Tennis: vs ${match.opponent.name}`;
        const opponentNum = match.opponent.number;
        const opponentRoster = rosters[opponentNum] || [];
        const rosterText = opponentRoster.length
          ? '\\nOpponent Roster: ' + opponentRoster.map(p => `${p.name} (${p.position})`).join('; ')
          : '';
        const description = `LTTA Tennis match: ${team} vs ${match.opponent.name} at ${match.courts}${rosterText}`;
        const location = match.courts;
        const uid = `ltta-${night}-${team}-week${match.week}@couleeregiontennis.org`;
        // Only return the VEVENT block (not the full VCALENDAR)
        return [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${match.date.replace(/-/g, '')}T${startTime.replace(':', '')}00Z`,
          `DTSTART;TZID=America/Chicago:${match.date.replace(/-/g, '')}T${startTime.replace(':', '')}00`,
          `DTEND;TZID=America/Chicago:${match.date.replace(/-/g, '')}T${endTime.replace(':', '')}00`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description}`,
          `LOCATION:${location}`,
          'BEGIN:VALARM',
          `TRIGGER:-PT4H`,
          'ACTION:DISPLAY',
          'DESCRIPTION:LTTA Tennis Match Reminder',
          'END:VALARM',
          'END:VEVENT'
        ].join('\r\n');
      });

      // Write the single .ics file for this team
      const teamIcsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Coulee Region Tennis//LTTA//EN',
        ...vevents,
        'END:VCALENDAR'
      ].join('\r\n');

      fs.writeFileSync(
        path.join(icsDir, `team.ics`),
        teamIcsContent
      );

      sched.forEach(match => {
        const startTime = match.time.replace('pm', '') === '7:00' ? '19:00' : '17:30';
        const endTime = getEndTime(startTime);
        const summary = `LTTA Tennis: vs ${match.opponent.name}`;
        const opponentNum = match.opponent.number;
        const opponentRoster = rosters[opponentNum] || [];
        const rosterText = opponentRoster.length
          ? '\\nOpponent Roster: ' + opponentRoster.map(p => `${p.name} (${p.position})`).join('; ')
          : '';
        const description = `LTTA Tennis match: ${team} vs ${match.opponent.name} at ${match.courts}${rosterText}`;
        const location = match.courts;
        const uid = `ltta-${night}-${team}-week${match.week}@couleeregiontennis.org`;
        const icsContent = createICSEvent({
          summary,
          description,
          location,
          startDate: match.date,
          startTime,
          endTime,
          uid
        });
        const icsPath = path.join(icsDir, `week${match.week}.ics`);
        fs.writeFileSync(icsPath, icsContent);
        match.ics = `/teams/${night}/ics/${team.replace(/\s+/g, '_')}/week${match.week}.ics`;
      });
      // Overwrite JSON with ICS links included
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
