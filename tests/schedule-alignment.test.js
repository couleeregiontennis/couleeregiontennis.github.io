const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const TEAMS_DIR = path.join(__dirname, '../teams');
const SCORESHEETS_DIR = path.join(__dirname, '../management-scripts/scoresheets');

function parseICS(content) {
  const events = [];
  let currentEvent = null;
  const lines = content.split(/\r?\n/);
  
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent) events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      const match = line.match(/^([^:]+):(.*)$/);
      if (match) {
        const [, key, val] = match;
        currentEvent[key] = val;
      }
    }
  }
  return events;
}

test('Schedules, ICS calendars, and Scoresheets should all have matching data for every week', () => {
  ['tuesday', 'wednesday'].forEach(night => {
    const masterPath = path.join(TEAMS_DIR, night, 'schedules', 'master_schedule.json');
    assert.ok(fs.existsSync(masterPath), `Master schedule JSON should exist for ${night}`);

    const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

    master.forEach(match => {
      const { week, date, time, courts } = match;
      const teamA = match.teamA.number;
      const teamAName = match.teamA.name;
      const teamB = match.teamB.number;
      const teamBName = match.teamB.name;

      // 1. Assert Team A Individual JSON Schedule has matching entry
      const schedAPath = path.join(TEAMS_DIR, night, 'schedules', `${teamA}.json`);
      assert.ok(fs.existsSync(schedAPath), `Individual schedule JSON should exist for Team ${teamA}`);
      const schedA = JSON.parse(fs.readFileSync(schedAPath, 'utf8'));
      const entryA = schedA.schedule.find(m => m.week === week);
      assert.ok(entryA, `Team ${teamA} individual schedule should have an entry for week ${week}`);
      assert.strictEqual(entryA.date, date, `Team ${teamA} week ${week} match date mismatch`);
      assert.strictEqual(entryA.time, time, `Team ${teamA} week ${week} match time mismatch`);
      assert.strictEqual(entryA.courts, courts, `Team ${teamA} week ${week} match courts mismatch`);

      // 2. Assert Team B Individual JSON Schedule has matching entry
      const schedBPath = path.join(TEAMS_DIR, night, 'schedules', `${teamB}.json`);
      assert.ok(fs.existsSync(schedBPath), `Individual schedule JSON should exist for Team ${teamB}`);
      const schedB = JSON.parse(fs.readFileSync(schedBPath, 'utf8'));
      const entryB = schedB.schedule.find(m => m.week === week);
      assert.ok(entryB, `Team ${teamB} individual schedule should have an entry for week ${week}`);
      assert.strictEqual(entryB.date, date, `Team ${teamB} week ${week} match date mismatch`);
      assert.strictEqual(entryB.time, time, `Team ${teamB} week ${week} match time mismatch`);
      assert.strictEqual(entryB.courts, courts, `Team ${teamB} week ${week} match courts mismatch`);

      // 3. Assert Team A Week ICS file matches schedule
      const icsAPath = path.join(TEAMS_DIR, night, 'ics', teamA, `week${week}.ics`);
      assert.ok(fs.existsSync(icsAPath), `Week ICS file should exist for Team ${teamA} week ${week}`);
      const icsContent = fs.readFileSync(icsAPath, 'utf8');
      const events = parseICS(icsContent);
      assert.strictEqual(events.length, 1, `Team ${teamA} week ${week} ICS should have exactly 1 event`);
      
      const ev = events[0];
      const expectedDtStart = `${date.replace(/-/g, '')}T${time.replace(':', '').replace('pm', '') === '700' ? '1900' : '1730'}00`;
      assert.strictEqual(ev['DTSTART;TZID=America/Chicago'], expectedDtStart, `Team ${teamA} week ${week} ICS DTSTART mismatch`);
      
      const expectedLocation = courts === 'Logan' ? 'Logan Tennis Courts' : `Green Island Park - ${courts}`;
      assert.strictEqual(ev['LOCATION'], expectedLocation, `Team ${teamA} week ${week} ICS LOCATION mismatch`);

      // 4. Assert Team A master team.ics file contains matching event
      const teamIcsAPath = path.join(TEAMS_DIR, night, 'ics', teamA, `team.ics`);
      assert.ok(fs.existsSync(teamIcsAPath), `Master team.ics file should exist for Team ${teamA}`);
      const teamIcsContent = fs.readFileSync(teamIcsAPath, 'utf8');
      const teamEvents = parseICS(teamIcsContent);
      const matchEvent = teamEvents.find(e => e['DTSTART;TZID=America/Chicago'] === expectedDtStart);
      assert.ok(matchEvent, `Team ${teamA} master team.ics should contain match event at ${expectedDtStart}`);
      assert.strictEqual(matchEvent['LOCATION'], expectedLocation, `Team ${teamA} master team.ics LOCATION mismatch`);

      // 5. Assert Week Scoresheet matches schedule details
      const sheetPath = path.join(SCORESHEETS_DIR, `week${week}`, `week${week}-${night}.html`);
      assert.ok(fs.existsSync(sheetPath), `Scoresheet should exist for week ${week} ${night}`);
      const html = fs.readFileSync(sheetPath, 'utf8');
      assert.ok(html.includes(teamAName), `Scoresheet should contain Team A name: "${teamAName}"`);
      assert.ok(html.includes(teamBName), `Scoresheet should contain Team B name: "${teamBName}"`);
      assert.ok(html.includes(courts), `Scoresheet should contain Court location: "${courts}"`);
    });
  });
});
