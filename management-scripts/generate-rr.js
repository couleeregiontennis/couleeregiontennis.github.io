const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'ltta.csv';
const OUTPUT_DIR = 'team_schedules';

function loadSheet(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

function groupByNight(rows) {
  const groups = {};

  rows.forEach(row => {
    const night = row['Night'];
    const teamName = row['TEAM NAME']?.trim();
    if (!night || !teamName) return;

    if (!groups[night]) {
      groups[night] = new Set();
    }
    groups[night].add(teamName);
  });

  // Convert sets to arrays
  for (const night in groups) {
    groups[night] = Array.from(groups[night]);
  }

  return groups;
}

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

function createTeamSchedules(teams, matchesByWeek) {
  const schedules = {};
  teams.forEach(t => schedules[t] = []);

  matchesByWeek.forEach((matches, i) => {
    const week = i + 1;
    matches.forEach(([a, b]) => {
      schedules[a].push({ week, vs: b });
      schedules[b].push({ week, vs: a });
    });
  });

  return schedules;
}

function writeSchedules(groupName, teamSchedules) {
  const groupDir = path.join(OUTPUT_DIR, groupName);
  if (!fs.existsSync(groupDir)) fs.mkdirSync(groupDir, { recursive: true });

  for (const [team, schedule] of Object.entries(teamSchedules)) {
    const fileName = `${team.replace(/\s+/g, '_')}.json`;
    const fullPath = path.join(groupDir, fileName);

    const json = {
      team,
      night: groupName,
      schedule
    };

    fs.writeFileSync(fullPath, JSON.stringify(json, null, 2));
  }
}

function writeGroupMatches(groupName, matchesByWeek) {
  const groupDir = path.join(OUTPUT_DIR, groupName);
  if (!fs.existsSync(groupDir)) fs.mkdirSync(groupDir, { recursive: true });

  // Collect unique matches as {week, teamA, teamB}
  const uniqueMatches = [];
  const seen = new Set();

  matchesByWeek.forEach((matches, i) => {
    const week = i + 1;
    matches.forEach(([a, b]) => {
      // Sort team names to avoid duplicates
      const [teamA, teamB] = [a, b].sort();
      const key = `${teamA}__${teamB}`;
      if (!seen.has(key)) {
        uniqueMatches.push({ week, teamA, teamB });
        seen.add(key);
      }
    });
  });

  const fileName = `all_matches.json`;
  const fullPath = path.join(groupDir, fileName);
  fs.writeFileSync(fullPath, JSON.stringify(uniqueMatches, null, 2));
}

function main() {
  const rows = loadSheet(INPUT_FILE);
  const groups = groupByNight(rows);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  for (const [night, teams] of Object.entries(groups)) {
    if (teams.length < 2) {
      console.log(`Skipping '${night}' (only ${teams.length} team)`);
      continue;
    }

    const matches = generateRoundRobin(teams);
    const teamSchedules = createTeamSchedules(teams, matches);
    writeSchedules(night, teamSchedules);
    writeGroupMatches(night, matches);

    console.log(`✅ Generated ${teams.length} team schedules for '${night}'`);
  }
}

main();
