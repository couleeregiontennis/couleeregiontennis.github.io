const fs = require('fs');
const path = require('path');

const TEAMS_DIR = '../teams';
const TEMPLATE_PATH = './scoresheet.html';
const OUTPUT_DIR = './scoresheets';

function generateScoresheet(date, night, team1, team2, template, courts) {
  let html = template;

  // Fill in the header information
  html = html.replace('TUES ____', `TUES ${night.toLowerCase() === 'tuesday' ? '✓' : ''}`);
  html = html.replace('WED ____', `WED ${night.toLowerCase() === 'wednesday' ? '✓' : ''}`);
  html = html.replace('DATE ________', `DATE ${date}`);
  html = html.replace('COURTS __________', `COURTS ${courts}`);

  // Use the exact string from the template (note the missing space at end)
  const teamInfoReplace = 'TEAM # / NAME: ____ / ____________________ VS TEAM # / NAME: ____ /';
  const teamInfoNew = `TEAM # / NAME: ${team1.number} / ${team1.name} VS TEAM # / NAME: ${team2.number} / ${team2.name}`;
  
  html = html.replace(teamInfoReplace, teamInfoNew);
  
  // Pre-fill player positions based on roster
  if (team1.roster && team2.roster) {
    // Match 1 (Position 1)
    html = html.replace('1 / ____________', 
      `1 / ${getPlayerByPosition(team1.roster, 1) || '____________'}`);
    html = html.replace('1 / ____________', 
      `1 / ${getPlayerByPosition(team2.roster, 1) || '____________'}`);

    // Match 2 (Position 2)
    html = html.replace('2 / ____________', 
      `2 / ${getPlayerByPosition(team1.roster, 2) || '____________'}`);
    html = html.replace('2 / ____________', 
      `2 / ${getPlayerByPosition(team2.roster, 2) || '____________'}`);

    // Match 3 (Position 3)
    html = html.replace('3 / ____________', 
      `3 / ${getPlayersByPosition(team1.roster, 3) || '____________'}`);
    html = html.replace('3 / ____________', 
      `3 / ${getPlayersByPosition(team1.roster, 3) || '____________'}`);

    // Match 3 (Position 3 part 2)
    html = html.replace('3 / ____________', 
      `3 / ${getPlayersByPosition(team2.roster, 3) || '____________'}`);
    html = html.replace('3 / ____________', 
      `3 / ${getPlayersByPosition(team2.roster, 3) || '____________'}`);

    // Match 3.1 (Position 3)
    html = html.replace('3 / ____________', 
      `3 / ${getPlayersByPosition(team1.roster, 3) || '____________'}`);
    html = html.replace('3 / ____________', 
      `3 / ${getPlayersByPosition(team1.roster, 3) || '____________'}`);

    // Match 3.1 (Position 3 part 2)
    html = html.replace('3 / ____________', 
      `3 / ${getPlayersByPosition(team2.roster, 3) || '____________'}`);
    html = html.replace('3 / ____________', 
      `3 / ${getPlayersByPosition(team2.roster, 3) || '____________'}`);

    // Match 4 (Positions 4 & 5)
    html = html.replace('4 / ____________', 
      `4 / ${getPlayerByPosition(team1.roster, 4) || '____________'}`);
    html = html.replace('5 / ____________', 
      `5 / ${getPlayerByPosition(team1.roster, 5) || '____________'}`);
    html = html.replace('4 / ____________', 
      `4 / ${getPlayerByPosition(team2.roster, 4) || '____________'}`);
    html = html.replace('5 / ____________', 
      `5 / ${getPlayerByPosition(team2.roster, 5) || '____________'}`);
  }

  // Create filename
  const filename = `${date}-${night}-${team1.number}-vs-${team2.number}.html`;
  return { html, filename };
}

// Helper function to get all players at a position(for 3s since there are 4 players)
function getPlayersByPosition(roster, position) {
  const players = roster.filter(p => parseInt(p.position) === position);
  return players.map(p => p.name + (p.captain ? ' (C)' : '')).join(', <br/>');
}

// Helper function to get single player by position (for positions 1,2,4,5)
function getPlayerByPosition(roster, position) {
  const player = roster.find(p => parseInt(p.position) === position);
  return player ? player.name + (player.captain ? ' (C)' : '') : '';
}

async function main() {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }

    // Read scoresheet template
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    // Process each night (Tuesday and Wednesday)
    ['tuesday', 'wednesday'].forEach(night => {
      const schedulePath = path.join(TEAMS_DIR, night, 'schedules', 'master_schedule.json');
      const rostersPath = path.join(TEAMS_DIR, night, 'rosters');
      if (!fs.existsSync(schedulePath)) {
        console.log(`No schedule found for ${night}`);
        return;
      }

      const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
      // Verify schedule structure
      if (!Array.isArray(schedule)) {
        console.error(`Invalid schedule format for ${night}: expected array`);
        return;
      }

      const rosters = {};

      // Load all team rosters if directory exists
      if (fs.existsSync(rostersPath)) {
        fs.readdirSync(rostersPath).forEach(file => {
          if (file.endsWith('.json')) {
            const teamNum = file.replace('.json', '');
            const rosterData = JSON.parse(fs.readFileSync(path.join(rostersPath, file), 'utf-8'));
            rosters[teamNum] = rosterData.roster || [];
          }
        });
      }

      // Generate scoresheet for each match
      schedule.forEach((match) => {
        if (!match.teamA || !match.teamB || !match.date) {
          console.error('Invalid match data:', match);
          return;
        }

        const team1 = {
          number: match.teamA.number,
          name: match.teamA.name,
          roster: rosters[match.teamA.number] || []
        };
        
        const team2 = {
          number: match.teamB.number,
          name: match.teamB.name,
          roster: rosters[match.teamB.number] || []
        };

        try {
          const { html, filename } = generateScoresheet(
            match.date,
            night,
            team1,
            team2,
            template,
            match.courts
          );

          // Create week-based subdirectories
          const weekDir = path.join(OUTPUT_DIR, `week${match.week}`);
          if (!fs.existsSync(weekDir)) {
            fs.mkdirSync(weekDir, { recursive: true });
          }

          const outputPath = path.join(weekDir, filename);
          fs.writeFileSync(outputPath, html);
          console.log(`Generated scoresheet: week${match.week}/${filename}`);
        } catch (error) {
          console.error(`Error generating scoresheet for match in week ${match.week}:`, error);
        }
      });
    });
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main().catch(console.error);