const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');
const { fetchCSV } = require('./fetch-csv');

const CSV_PATH = '/Users/brett/Downloads/2026 LTTA TEAM ROSTERS.xlsx - ROSTERS-2.csv';

async function createRostersFromCSV() {
  try {
    const csvContent = await fetchCSV(CSV_PATH);
    console.log('Fetched CSV data successfully');
    
    // Log the first few lines to debug
    console.log('CSV Preview:', csvContent.split('\n').slice(0, 3));
    
    const records = parse.parse(csvContent, { 
      columns: true, 
      skip_empty_lines: true,
      trim: true // Add trim to handle extra whitespace
    });
    
    console.log(`Parsed ${records.length} records from CSV`);

    // Group by night and team number
    const rosters = {};
    records.forEach(row => {
      // Update column names to match new CSV format
      if (!row.Night || !row['Team/'] || !row['1-Name'] || !row.Level) {
        console.log('Skipping incomplete row:', row);
        return;
      }

      const night = row.Night.trim();
      const teamNum = row['Team/'].trim(); // Updated from Team to Team/
      const teamName = row['TEAM NAME'] ? row['TEAM NAME'].trim() : `Team ${teamNum}`;
      const key = `${night}-${teamNum}`;

      if (!rosters[key]) {
        rosters[key] = { night, teamNum, teamName, roster: [] };
      }

      rosters[key].roster.push({
        position: Number(row.Level),
        name: row['1-Name'].trim(),
        captain: row['C/CC'] && row['C/CC'].trim() ? '✓' : '' // Still using C/CC
      });
    });

    // Write one file per team, in subfolders by night
    for (const [key, teamObj] of Object.entries(rosters)) {
      const { night, teamNum, teamName, roster } = teamObj;
      const jsonFileFolderNight = night == "Tues" ? "tuesday" : "wednesday";
      const outDir = path.join(__dirname, '..', 'teams', jsonFileFolderNight, 'rosters');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `${teamNum}.json`);
      fs.writeFileSync(outPath, JSON.stringify({ teamName, roster }, null, 2));
      console.log(`Wrote roster for ${night} team ${teamNum} (${teamName})`);
    }
  } catch (error) {
    console.error('Error processing CSV:', error);
    throw error;
  }
}

createRostersFromCSV(path.join(__dirname, '..', 'ltta.csv'));