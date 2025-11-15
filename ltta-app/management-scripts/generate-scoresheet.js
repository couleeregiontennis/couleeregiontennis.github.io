const fs = require('fs').promises;
const path = require('path');

const TEAMS_DIR = '../teams';
const TEMPLATE_PATH = './scoresheet.html';
const OUTPUT_DIR = './scoresheets';

/**
 * Validates that a roster has the required structure
 * @param {Array} roster - Team roster array
 * @returns {boolean} - True if valid
 */
function validateRoster(roster) {
  if (!Array.isArray(roster)) return false;
  
  return roster.every(player => 
    player && 
    typeof player === 'object' && 
    typeof player.name === 'string' && 
    typeof player.position === 'string'
  );
}

/**
 * Gets a player by position with captain indicator
 * @param {Array} roster - Team roster
 * @param {number} position - Position number
 * @returns {string} - Formatted player name or placeholder
 */
function getPlayerByPosition(roster, position) {
  if (!validateRoster(roster)) return '_______';
  
  const player = roster.find(p => parseInt(p.position) === position);
  if (!player || !player.name) return '_______';
  
  return player.name + (player.captain ? ' (C)' : '');
}

/**
 * Gets all players at position 3
 * @param {Array} roster - Team roster
 * @returns {Array} - Array of formatted player names
 */
function getPosition3Players(roster) {
  if (!validateRoster(roster)) return ['_______', '_______', '_______', '_______'];
  
  const players = roster.filter(p => parseInt(p.position) === 3);
  const formattedPlayers = players.map(player => 
    player.name + (player.captain ? ' (C)' : '')
  );
  
  // Ensure we always return 4 players for position 3 slots
  while (formattedPlayers.length < 4) {
    formattedPlayers.push('_______');
  }
  
  return formattedPlayers.slice(0, 4);
}

/**
 * Generates a combined scoresheet HTML for multiple matches
 * @param {Array} matches - Array of match objects
 * @param {string} night - Night of the week
 * @param {string} template - HTML template string
 * @returns {string} - Combined HTML content
 */
function generateCombinedScoresheet(matches, night, template) {
  // Validate inputs
  if (!Array.isArray(matches) || matches.length === 0) {
    throw new Error('Invalid matches array provided');
  }
  if (!night || typeof night !== 'string') {
    throw new Error('Invalid night parameter provided');
  }
  if (!template || typeof template !== 'string') {
    throw new Error('Invalid template provided');
  }

  // Extract CSS from template
  const styleMatch = template.match(/<style>[\s\S]*?<\/style>/);
  if (!styleMatch) {
    throw new Error('Template missing <style> section');
  }

  let combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scoresheets - ${night.charAt(0).toUpperCase() + night.slice(1)}</title>
  ${styleMatch[0]}
</head>
<body>`;

  // Extract body content from template
  const bodyMatch = template.match(/<body>([\s\S]*?)<\/body>/);
  if (!bodyMatch) {
    throw new Error('Template missing <body> section');
  }
  const sheetTemplate = bodyMatch[1];

  matches.forEach((match, index) => {
    console.log(`Processing match ${index + 1}/${matches.length}:`, {
      date: match.date,
      night,
      teams: `${match.teamA.number} vs ${match.teamB.number}`,
      courts: match.courts
    });

    // Validate match data
    if (!match.teamA || !match.teamB) {
      console.error('Invalid match data: missing teamA or teamB', match);
      return;
    }

    let html = sheetTemplate;

    // Fill in header information
    html = html.replace('[TUES]', night.toLowerCase() === 'tuesday' ? '✓' : ' ');
    html = html.replace('[WED]', night.toLowerCase() === 'wednesday' ? '✓' : ' ');
    html = html.replace('[DATE]', match.date || 'TBD');
    html = html.replace('[COURTS]', match.courts || 'TBD');

    // Team information
    html = html.replace('[T1NUM]', match.teamA.number || '??');
    html = html.replace('[T1NAME]', match.teamA.name || 'Unknown');
    html = html.replace('[T2NUM]', match.teamB.number || '??');
    html = html.replace('[T2NAME]', match.teamB.name || 'Unknown');

    // Pre-fill player positions
    const team1Roster = match.teamA.roster || [];
    const team2Roster = match.teamB.roster || [];

    // Positions 1 & 2
    html = html.replace('[P1T1]', getPlayerByPosition(team1Roster, 1));
    html = html.replace('[P2T1]', getPlayerByPosition(team1Roster, 2));
    html = html.replace('[P1T2]', getPlayerByPosition(team2Roster, 1));
    html = html.replace('[P2T2]', getPlayerByPosition(team2Roster, 2));

    // Position 3 players
    const team1Pos3Players = getPosition3Players(team1Roster);
    const team2Pos3Players = getPosition3Players(team2Roster);

    html = html.replaceAll('[P3T1A]', team1Pos3Players[0]);
    html = html.replaceAll('[P3T1B]', team1Pos3Players[1]);
    html = html.replaceAll('[P3T1C]', team1Pos3Players[2]);
    html = html.replaceAll('[P3T1D]', team1Pos3Players[3]);
    html = html.replaceAll('[P3T2A]', team2Pos3Players[0]);
    html = html.replaceAll('[P3T2B]', team2Pos3Players[1]);
    html = html.replaceAll('[P3T2C]', team2Pos3Players[2]);
    html = html.replaceAll('[P3T2D]', team2Pos3Players[3]);

    // Positions 4 & 5
    html = html.replace('[P4T1]', getPlayerByPosition(team1Roster, 4));
    html = html.replace('[P5T1]', getPlayerByPosition(team1Roster, 5));
    html = html.replace('[P4T2]', getPlayerByPosition(team2Roster, 4));
    html = html.replace('[P5T2]', getPlayerByPosition(team2Roster, 5));

    // Add point placeholders
    html = html.replace('[T1POINTS]', '_____');
    html = html.replace('[T2POINTS]', '_____');

    // Add page break between matches
    combinedHtml += `<div class="match-sheet">${html}</div>`;
    
    if (index < matches.length - 1) {
      combinedHtml += '<div style="page-break-after: always;"></div>';
    }
  });

  combinedHtml += '</body></html>';
  return combinedHtml;
}

/**
 * Main function to generate scoresheets for all nights and weeks
 */
async function main() {
  try {
    console.log('Starting scoresheet generation...');
    
    // Read template file
    const template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
    console.log('Template loaded successfully');

    const nights = ['tuesday', 'wednesday'];
    
    for (const night of nights) {
      console.log(`\nProcessing ${night} matches...`);
      
      const schedulePath = path.join(TEAMS_DIR, night, 'schedules', 'master_schedule.json');
      const rostersPath = path.join(TEAMS_DIR, night, 'rosters');
      
      // Check if schedule exists
      try {
        await fs.access(schedulePath);
      } catch (error) {
        console.log(`No schedule found for ${night}, skipping...`);
        continue;
      }

      // Read schedule
      const scheduleData = await fs.readFile(schedulePath, 'utf-8');
      const schedule = JSON.parse(scheduleData);
      console.log(`Loaded ${schedule.length} matches for ${night}`);

      const rosters = {};

      // Load all team rosters
      if (await fs.access(rostersPath).then(() => true).catch(() => false)) {
        const rosterFiles = await fs.readdir(rostersPath);
        
        for (const file of rosterFiles) {
          if (file.endsWith('.json')) {
            const teamNum = file.replace('.json', '');
            try {
              const rosterData = JSON.parse(await fs.readFile(path.join(rostersPath, file), 'utf-8'));
              rosters[teamNum] = rosterData.roster || [];
              console.log(`Loaded roster for team ${teamNum}: ${rosters[teamNum].length} players`);
            } catch (e) {
              console.error(`Error loading roster for team ${teamNum}:`, e.message);
              rosters[teamNum] = [];
            }
          }
        }
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
      for (const [week, matches] of Object.entries(matchesByWeek)) {
        try {
          const combinedHtml = generateCombinedScoresheet(matches, night, template);
          const filename = `week${week}-${night}.html`;
          const outputPath = path.join(OUTPUT_DIR, `week${week}`, filename);
          
          // Ensure directory exists
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await fs.writeFile(outputPath, combinedHtml);
          console.log(`✓ Generated ${filename} with ${matches.length} matches`);
        } catch (error) {
          console.error(`Error generating week ${week} for ${night}:`, error.message);
        }
      }
    }
    
    console.log('\nScoresheet generation completed successfully!');
  } catch (error) {
    console.error('Fatal error in main:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
