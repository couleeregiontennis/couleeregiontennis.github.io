const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');

function createRostersFromCSV(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse.parse(csvContent, { columns: true, skip_empty_lines: true });

  // Group by team
  const rosters = {};
  records.forEach(row => {
    if (!row.Team || !row.Name) return; // Skip incomplete rows
    const team = row.Team.trim();
    if (!rosters[team]) rosters[team] = [];
    rosters[team].push({
      position: Number(row.Position),
      name: row.Name.trim(),
      captain: row.Captain && row.Captain.trim() === '✓' ? '✓' : ''
    });
  });

  // Write one file per team
  for (const [team, roster] of Object.entries(rosters)) {
    const outPath = path.join(__dirname, 'rosters', `${team.replace(/\s+/g, '_')}_roster.json`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ roster }, null, 2));
    console.log(`Wrote roster for ${team}`);
  }
}

createRostersFromCSV(path.join(__dirname, '..', 'ltta.csv'));