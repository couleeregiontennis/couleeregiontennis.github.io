const fs = require('fs');
const path = require('path');

const TEAMS_DIR = '../teams';
const TEMPLATE_PATH = './scoresheet.html';
const OUTPUT_DIR = './scoresheets';

function generateCombinedScoresheet(matches, night, template) {
  let combinedHtml = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
  combinedHtml += template.match(/<style>[\s\S]*?<\/style>/)[0]; // Get CSS
  combinedHtml += '</head><body>';

  matches.forEach((match, index) => {
    const sheetHtml = template.match(/<body>([\s\S]*?)<\/body>/)[1];
    let html = sheetHtml;

    // Add debug logging
    console.log('Processing match:', {
      date: match.date,
      night,
      teams: `${match.teamA.number} vs ${match.teamB.number}`,
      courts: match.courts
    });

    // Fill in header information (exact matches from template)
    html = html.replace('[TUES]', night.toLowerCase() === 'tuesday' ? '✓' : ' ');
    html = html.replace('[WED]', night.toLowerCase() === 'wednesday' ? '✓' : ' ');
    html = html.replace('[DATE]', match.date);
    html = html.replace('[COURTS]', match.courts);

    // Team information
    html = html.replace('[T1NUM]', match.teamA.number);
    html = html.replace('[T1NAME]', match.teamA.name);
    html = html.replace('[T2NUM]', match.teamB.number);
    html = html.replace('[T2NAME]', match.teamB.name);

    // Pre-fill player positions based on roster
    if (match.teamA.roster && match.teamB.roster) {
      // Positions 1 & 2
      html = html.replace('[P1T1]', getPlayerByPosition(match.teamA.roster, 1) || '_______');
      html = html.replace('[P2T1]', getPlayerByPosition(match.teamA.roster, 2) || '_______');
      html = html.replace('[P1T2]', getPlayerByPosition(match.teamB.roster, 1) || '_______');
      html = html.replace('[P2T2]', getPlayerByPosition(match.teamB.roster, 2) || '_______');

      // Position 3 first match
      const team1Pos3Players = getPosition3Players(match.teamA.roster);
      const team2Pos3Players = getPosition3Players(match.teamB.roster);

      html = html.replaceAll('[P3T1A]', team1Pos3Players[0] || '_______');
      html = html.replaceAll('[P3T1B]', team1Pos3Players[1] || '_______');
      html = html.replaceAll('[P3T1C]', team1Pos3Players[2] || '_______');
      html = html.replaceAll('[P3T1D]', team1Pos3Players[3] || '_______');
      html = html.replaceAll('[P3T2A]', team2Pos3Players[0] || '_______');
      html = html.replaceAll('[P3T2B]', team2Pos3Players[1] || '_______');
      html = html.replaceAll('[P3T2C]', team2Pos3Players[2] || '_______');
      html = html.replaceAll('[P3T2D]', team2Pos3Players[3] || '_______');

      // Positions 4 & 5
      html = html.replace('[P4T1]', getPlayerByPosition(match.teamA.roster, 4) || '_______');
      html = html.replace('[P5T1]', getPlayerByPosition(match.teamA.roster, 5) || '_______');
      html = html.replace('[P4T2]', getPlayerByPosition(match.teamB.roster, 4) || '_______');
      html = html.replace('[P5T2]', getPlayerByPosition(match.teamB.roster, 5) || '_______');

      // Add point placeholders (empty for now)
      html = html.replace('[T1POINTS]', '_____');
      html = html.replace('[T2POINTS]', '_____');
    }

    // Add verification logging
    console.log('Replacements completed:', {
      hasTeam1: html.includes(match.teamA.name),
      hasTeam2: html.includes(match.teamB.name),
      hasDate: html.includes(match.date),
      hasCourts: html.includes(match.courts)
    });

    // Wrap each scoresheet in a div with page break
    combinedHtml += `<div class="match-sheet">${html}</div>`;
  });

  combinedHtml += '</body></html>';
  return combinedHtml;
}

async function main() {
  try {
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    ['tuesday', 'wednesday'].forEach(night => {
      const schedulePath = path.join(TEAMS_DIR, night, 'schedules', 'master_schedule.json');
      const rostersPath = path.join(TEAMS_DIR, night, 'rosters');
      
      if (!fs.existsSync(schedulePath)) {
        console.log(`No schedule found for ${night}`);
        return;
      }

      const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
      const rosters = {};

      // Load all team rosters
      if (fs.existsSync(rostersPath)) {
        fs.readdirSync(rostersPath).forEach(file => {
          if (file.endsWith('.json')) {
            const teamNum = file.replace('.json', '');
            try {
              const rosterData = JSON.parse(fs.readFileSync(path.join(rostersPath, file), 'utf-8'));
              rosters[teamNum] = rosterData.roster || [];
              console.log(`Loaded roster for team ${teamNum}:`, rosters[teamNum]);
            } catch (e) {
              console.error(`Error loading roster for team ${teamNum}:`, e);
            }
          }
        });
      }

      // Group matches by week
      const matchesByWeek = {};
      schedule.forEach(match => {
        // Add rosters to match data
        match.teamA.roster = rosters[match.teamA.number] || [];
        match.teamB.roster = rosters[match.teamB.number] || [];
        
        const weekNum = match.week;
        if (!matchesByWeek[weekNum]) {
          matchesByWeek[weekNum] = [];
        }
        matchesByWeek[weekNum].push(match);
      });

      // Generate one file per week
      Object.entries(matchesByWeek).forEach(([week, matches]) => {
        const combinedHtml = generateCombinedScoresheet(matches, night, template);
        const filename = `week${week}-${night}.html`;
        const outputPath = path.join(OUTPUT_DIR, `week${week}`, filename);
        
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, combinedHtml);
        console.log(`Generated combined scoresheet for week ${week}, ${night}`);
      });
    });
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

// Helper function to get single player by position (for positions 1,2,4,5)
function getPlayerByPosition(roster, position) {
  const player = roster.find(p => parseInt(p.position) === position);
  return player ? player.name + (player.captain ? ' (C)' : '') : '';
}

// Helper function to get all players at position 3
function getPosition3Players(roster) {
  const players = roster.filter(p => parseInt(p.position) === 3);
  return players.map((player, index) => {
    return player ? player.name + (player.captain ? ' (C)' : '') : '_______';
  });
}

main().catch(console.error);