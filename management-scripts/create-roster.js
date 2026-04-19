const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { fetchCSV } = require('./fetch-csv');

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlgS5yGzip6doLKqud9BDdpCt1_8CPWNjUxFmYgVdkdbQ_MNIc1ku1GJoZ2NBEuw/pub?gid=270023155&single=true&output=csv';

async function createRostersFromCSV() {
  try {
    const csvContent = await fetchCSV(CSV_URL);

    console.log('Fetched CSV data successfully');
    
    // Log the first few lines to debug
    console.log('CSV Preview:', csvContent.split('\n').slice(0, 3));
    
    const records = parse(csvContent, { 
      columns: true, 
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true
    });
    
    console.log(`Parsed ${records.length} records from CSV`);

    // Group by night and team number
    const rosters = {};
    records.forEach(row => {
      const nightRaw = row['v'] || '';
      const teamNum = row['Team/'] || '';
      const name = row['1-Name'] || '';
      const level = row['Level'] || '';

      if (!nightRaw || !teamNum || !name) {
        return;
      }

      const night = nightRaw.startsWith('Tue') ? 'tuesday' : (nightRaw.startsWith('Wed') ? 'wednesday' : null);
      if (!night) return;

      const teamName = row['TEAM NAME'] ? row['TEAM NAME'].trim() : null;
      const key = `${night}-${teamNum}`;

      if (!rosters[key]) {
        rosters[key] = { night, teamNum, teamName, roster: [] };
      }
      
      // Update team name if we find it later in the CSV
      if (teamName && !rosters[key].teamName) {
        rosters[key].teamName = teamName;
      }

      rosters[key].roster.push({
        position: level,
        name: name,
        captain: row['C/CC'] && row['C/CC'].trim() ? '✓' : ''
      });
    });

    // Write one file per team, in subfolders by night
    for (const [key, teamObj] of Object.entries(rosters)) {
      const { night, teamNum, teamName, roster } = teamObj;
      const finalTeamName = teamName || `Team ${teamNum}`;
      const outDir = path.join(__dirname, '..', 'teams', night, 'rosters');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `${teamNum}.json`);
      fs.writeFileSync(outPath, JSON.stringify({ teamName: finalTeamName, roster }, null, 2));
      console.log(`Wrote roster for ${night} team ${teamNum} (${finalTeamName})`);
    }
  } catch (error) {
    console.error('Error processing CSV:', error);
    throw error;
  }
}

createRostersFromCSV();