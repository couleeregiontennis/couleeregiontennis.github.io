const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');

function createRostersFromCSV(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse.parse(csvContent, { columns: true, skip_empty_lines: true });

  // Group by night and team number
  const rosters = {};
  records.forEach(row => {
    if (!row.Night || !row.Team || !row['1-Name'] || !row.Level) return; // Skip incomplete rows
    const night = row.Night.trim();
    const teamNum = row.Team.trim();
    const teamName = row['TEAM NAME'] ? row['TEAM NAME'].trim() : `Team ${teamNum}`;
    const key = `${night}-${teamNum}`;
    if (!rosters[key]) {
      rosters[key] = { night, teamNum, teamName, roster: [] };
    }
    rosters[key].roster.push({
      position: Number(row.Level),
      name: row['1-Name'].trim(),
      captain: row['C/CC'] && row['C/CC'].trim() ? '✓' : ''
    });
  });

  // Write one file per team, in subfolders by night
  for (const [key, teamObj] of Object.entries(rosters)) {
    const { night, teamNum, teamName, roster } = teamObj;
    const outDir = path.join(__dirname, '..', 'teams', night, 'rosters');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${teamNum}_${teamName.replace(/\s+/g, '_')}_roster.json`);
    fs.writeFileSync(outPath, JSON.stringify({ roster }, null, 2));
    console.log(`Wrote roster for ${night} team ${teamNum} (${teamName})`);
  }
}

createRostersFromCSV(path.join(__dirname, '..', 'ltta.csv'));