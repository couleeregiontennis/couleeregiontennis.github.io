const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const TEAMS_DIR = path.join(__dirname, '../teams');
const TEMPLATE_PATH = path.join(__dirname, 'scoresheet.html');
const OUTPUT_DIR = path.join(__dirname, 'scoresheets');

function getPlayerByPosition(roster, position) {
  const player = roster.find(p => parseInt(p.position) === position);
  return player ? player.name + (player.captain ? ' (C)' : '') : '';
}

function getPosition3Players(roster) {
  const players = roster.filter(p => parseInt(p.position) === 3);
  return players.map((player) => {
    return player ? player.name + (player.captain ? ' (C)' : '') : '_______';
  });
}

function generateCombinedScoresheet(matches, night, template) {
  let combinedHtml = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
  combinedHtml += template.match(/<style>[\s\S]*?<\/style>/)[0]; // Get CSS
  combinedHtml += '</head><body>';

  matches.forEach((match, index) => {
    const sheetHtml = template.match(/<body>([\s\S]*?)<\/body>/)[1];
    let html = sheetHtml;

    console.log(`Processing match: Week ${match.week} - ${match.date} - Team ${match.teamA.number} vs ${match.teamB.number}`);

    // Fill in header information
    const matchId = `W${match.week}-${night.substring(0, 3).toUpperCase()}-T${match.teamA.number}vT${match.teamB.number}`;
    html = html.replace('[MATCH_ID]', matchId);
    html = html.replace('[TUES]', night.toLowerCase() === 'tuesday' ? 'TUES' : '');
    html = html.replace('[WED]', night.toLowerCase() === 'wednesday' ? 'WED' : '');
    html = html.replace('[DATE]', match.date);
    html = html.replace('[TIME]', match.time);
    html = html.replace('[COURTS]', match.courts);

    // Team information
    html = html.replace('[T1NUM]', match.teamA.number);
    html = html.replace('[T1NAME]', match.teamA.name);
    html = html.replace('[T2NUM]', match.teamB.number);
    html = html.replace('[T2NAME]', match.teamB.name);

    // Pre-fill player positions based on roster
    if (match.teamA.roster && match.teamB.roster) {
      html = html.replace('[P1T1]', getPlayerByPosition(match.teamA.roster, 1) || '_______');
      html = html.replace('[P2T1]', getPlayerByPosition(match.teamA.roster, 2) || '_______');
      html = html.replace('[P1T2]', getPlayerByPosition(match.teamB.roster, 1) || '_______');
      html = html.replace('[P2T2]', getPlayerByPosition(match.teamB.roster, 2) || '_______');

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

      html = html.replace('[P4T1]', getPlayerByPosition(match.teamA.roster, 4) || '_______');
      html = html.replace('[P5T1]', getPlayerByPosition(match.teamA.roster, 5) || '_______');
      html = html.replace('[P4T2]', getPlayerByPosition(match.teamB.roster, 4) || '_______');
      html = html.replace('[P5T2]', getPlayerByPosition(match.teamB.roster, 5) || '_______');
    }

    if (index > 0) {
      combinedHtml += '<div class="page-break"></div>';
    }
    combinedHtml += `<div class="match-sheet">${html}</div>`;
  });

  combinedHtml += '</body></html>';
  return combinedHtml;
}

async function main() {
  try {
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const browser = await chromium.launch({ headless: true });

    for (const night of ['tuesday', 'wednesday']) {
      const schedulePath = path.join(TEAMS_DIR, night, 'schedules', 'master_schedule.json');
      const rostersPath = path.join(TEAMS_DIR, night, 'rosters');

      if (!fs.existsSync(schedulePath)) {
        console.log(`No schedule found for ${night}`);
        continue;
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
            } catch (e) {
              console.error(`Error loading roster for team ${teamNum}:`, e);
            }
          }
        });
      }

      // Filter matches after week 3 (i.e. week > 3)
      const postWeek3Matches = schedule.filter(match => match.week > 3);
      
      // Sort matches chronologically by date, then week, then matchId/courts to ensure a stable print order
      postWeek3Matches.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.week !== b.week) return a.week - b.week;
        return a.teamA.number - b.teamA.number;
      });

      // Attach rosters to matches
      postWeek3Matches.forEach(match => {
        match.teamA.roster = rosters[match.teamA.number] || [];
        match.teamB.roster = rosters[match.teamB.number] || [];
      });

      if (postWeek3Matches.length === 0) {
        console.log(`No matches found after week 3 for ${night}`);
        continue;
      }

      console.log(`Generating composite HTML for ${night} (Weeks 4+, ${postWeek3Matches.length} matches)...`);
      const combinedHtml = generateCombinedScoresheet(postWeek3Matches, night, template);
      
      const outHtmlName = `${night}-post-week3.html`;
      const outPdfName = `${night}-post-week3.pdf`;
      const outHtmlPath = path.join(OUTPUT_DIR, outHtmlName);
      const outPdfPath = path.join(OUTPUT_DIR, outPdfName);

      fs.writeFileSync(outHtmlPath, combinedHtml, 'utf-8');
      console.log(`Saved HTML to ${outHtmlPath}`);

      // Render PDF using Playwright
      const page = await browser.newPage();
      const fileUrl = `file://${outHtmlPath}`;
      await page.goto(fileUrl, { waitUntil: 'networkidle' });
      await page.pdf({
        path: outPdfPath,
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0px',
          bottom: '0px',
          left: '0px',
          right: '0px'
        }
      });
      await page.close();
      console.log(`Saved PDF to ${outPdfPath}`);
    }

    await browser.close();
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main().catch(console.error);
