const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { fetchCSV } = require('./fetch-csv');

const OUTPUT_DIR = path.join(__dirname, '..', 'output_emails');
const CSV_PATH = '/Users/brett/Downloads/2026 LTTA TEAM ROSTERS.xlsx - ROSTERS-2.csv';

const coordinator = {
  name: 'Brett Meddaugh',
  phone: '907-980-1293',
  email: 'brett.meddaugh@gmail.com'
};

const tuesdayCoordinator = {
  name: 'Tom Dwyer',
  phone: '815-904-0008'
};

const wednesdayCoordinator = {
  name: 'Mark Hoff',
  phone: '608-386-9310'
};

// Utility: Escape HTML to prevent XSS
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateEmailTemplate(team) {
  const { night, teamNumber, teamName, captain, coCaptain } = team;
  const nightCoordinator = night === 'Tues' ? tuesdayCoordinator : wednesdayCoordinator;
  const leagueStart = night === 'Tues' ? 'Tuesday, June 3' : 'Wednesday, June 4';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LTTA 2026 Season Kickoff</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f0f2f5; padding: 40px; color: #1c1e21; }
        .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #004080; color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 32px 24px; }
        .team-banner { background: #e7f3ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #0066cc; }
        .team-banner h2 { margin: 0; font-size: 18px; color: #004080; }
        .action-box { background: #ffffff; border: 2px solid #0066cc; border-radius: 10px; padding: 20px; margin: 24px 0; }
        .action-box h3 { margin-top: 0; color: #0066cc; display: flex; align-items: center; }
        .btn { display: inline-block; background: #0066cc; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px; }
        .update-item { border-bottom: 1px solid #e5e7eb; padding: 16px 0; }
        .update-item:last-child { border-bottom: none; }
        .update-item strong { display: block; color: #004080; margin-bottom: 4px; }
        .footer { background: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb; color: #65676b; font-size: 14px; }
        .coordinator-card { display: flex; align-items: center; margin-top: 16px; gap: 12px; }
        .coordinator-info strong { color: #1c1e21; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>LTTA 2026 Season Kickoff</h1>
        </div>
        <div class="content">
            <p>Hello LTTA Player,</p>
            <p>Welcome to our 43rd year! We're excited to get back on the courts at Green Island.</p>
            
            <div class="team-banner">
                <h2>${escapeHTML(night)} Team ${escapeHTML(teamNumber)}: ${escapeHTML(teamName)}</h2>
            </div>

            <div class="action-box">
                <h3>🚀 Essential Links</h3>
                <p>Access your team schedule, current standings, and sub lists on the league website:</p>
                <a href="https://couleeregiontennis.github.io" class="btn">Visit Website</a>
                <p style="margin-top:15px; font-size: 14px;"><strong>Player Fee:</strong> $25 due by Week 2. Pay via your captain or online (Zeffy link on website).</p>
            </div>

            <div style="background:#f8f9fa; border-radius:8px; padding:20px; margin:24px 0; border: 1px solid #dee2e6;">
                <h3 style="margin-top:0; font-size: 16px; color: #004080;">📞 Your Team Contacts</h3>
                <p style="margin: 8px 0;"><strong>Captain:</strong> ${escapeHTML(captain.name)} (${escapeHTML(captain.phone)})</p>
                ${coCaptain ? `<p style="margin: 8px 0;"><strong>Co-Captain:</strong> ${escapeHTML(coCaptain.name)} (${escapeHTML(coCaptain.phone)})</p>` : ''}
                <p style="margin: 8px 0;"><strong>On-Site Coordinator:</strong> ${escapeHTML(nightCoordinator.name)} (${escapeHTML(nightCoordinator.phone)})</p>
            </div>

            <h3>🎾 2026 Season Updates</h3>
            
            <div class="update-item">
                <strong>New Participation Point</strong>
                Every match earns 1 point just for showing up. You only lose this point for a forfeit.
            </div>

            <div class="update-item">
                <strong>"Feels Like" Heat Rule</strong>
                We now use the "Feels Like" temperature on weather.com. Over 95&deg;F = optional 2-2 start; over 104&deg;F = automatic cancellation.
            </div>

            <div class="update-item">
                <strong>Home Team Responsibility</strong>
                If neither team is willing to put their #3 line out first, the Home team must complete their official lineup sheet first.
            </div>

            <div class="update-item">
                <strong>Championship Picnic</strong>
                The season finale features the top two teams from both nights playing cross-night matches to determine the overall champion. All matches at the picnic start at 2-all.
            </div>

            <div style="margin-top: 32px;">
                <p><strong>League Start:</strong> ${escapeHTML(leagueStart)}<br>
                <strong>Location:</strong> Green Island Park</p>
            </div>

            <p style="margin-top: 24px; font-size: 14px; color: #65676b; font-style: italic;">
                Once the season starts, please provide feedback on the new digital scoring site.
            </p>
        </div>
        <div class="footer">
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0;"><strong>Sub Policy:</strong> If you cannot play, you are responsible for finding a sub from the official sub list on the website.</p>
            </div>
            <div class="coordinator-card">
                <div class="coordinator-info">
                    <p style="margin-bottom: 10px;"><strong>LTTA Leadership Team</strong></p>
                    <table style="width: 100%; font-size: 13px; color: #65676b; border-collapse: collapse;">
                        <tr>
                            <td style="padding-bottom: 8px;"><strong>Brett Meddaugh</strong><br>League Coordinator</td>
                            <td style="padding-bottom: 8px;"><strong>Jenn Carr</strong><br>Teams & Rosters</td>
                        </tr>
                        <tr>
                            <td><strong>Tom Dwyer</strong><br>Tuesday Coordinator</td>
                            <td><strong>Mark Hoff</strong><br>Wednesday Coordinator</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

async function main() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const csvContent = await fetchCSV(CSV_PATH);
    console.log('Fetched CSV data successfully');
    
    // Parse CSV content
    const parsedData = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const records = [];
    parsedData.forEach((data) => {
      // Map new column names to expected format
      const record = {
        Night: data['v'],
        Team: data['Team/'],
        Captain: data['C/CC'] === 'C' ? '✓' : '',
        CoCaptain: data['C/CC'] === 'CC' ? '✓' : '',
        Level: data.Level,
        Name: data['1-Name'],
        Phone: data['1-Telephone'],
        Email: data['Email'],
        TeamName: data['TEAM NAME']
      };
      records.push(record);
    });

    const teams = {};

    // Group players by team
    records.forEach(record => {
      if (!record.Night || !record.Team || !record.Name) {
        console.warn('Skipping incomplete record:', record);
        return;
      }

      const key = `${record.Night}-${record.Team}`;
      
      if (!teams[key]) {
        teams[key] = {
          night: record.Night,
          teamNumber: record.Team,
          teamName: record.TeamName || `Team ${record.Team}`,
          players: [],
          captain: null,
          coCaptain: null
        };
      }

      const player = {
        name: record.Name,
        phone: record.Phone || '',
        email: record.Email || '',
        position: parseInt(record.Level) || 0
      };

      teams[key].players.push(player);

      // Set captain/co-captain
      if (record.Captain) {
        teams[key].captain = player;
      }
      if (record.CoCaptain) {
        teams[key].coCaptain = player;
      }
    });

    Object.values(teams).forEach(team => {
      const { night, teamNumber, teamName, captain } = team;

      if (!captain) {
        console.warn(`⚠️  No captain found for ${night} Team ${teamNumber}`);
        return;
      }

      // Sanitize teamName for filename to prevent Path Traversal
      const safeTeamName = teamName.replace(/[^a-zA-Z0-9_-]/g, '_');

      const fileName = path.join(
        OUTPUT_DIR,
        `${night}_Team_${teamNumber}_${safeTeamName}.html`
      );

      const emailContent = generateEmailTemplate(team);
      fs.writeFileSync(fileName, emailContent, 'utf8');
      console.log(`✅ Created email for ${night} Team ${teamNumber} – ${fileName}`);
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Add debug logging
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  process.exit(1);
});

module.exports = {
  generateEmailTemplate,
  main,
  escapeHTML
};

if (require.main === module) {
  main().catch(console.error);
}
