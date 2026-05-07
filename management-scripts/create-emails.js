require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { fetchCSV } = require('./fetch-csv');

const OUTPUT_DIR = path.join(__dirname, '..', 'output_emails');
const CSV_URL = process.env.CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRXXJgqymosDbuyhAHCpHHUqQsNxRk0B-3kBGWr7CuPymhKUpT83JKyN7DxkCiaPdKsZEeBaA3GDjH/pub?gid=1666435806&single=true&output=csv';

if (!CSV_URL) {
  console.error('Error: CSV_URL environment variable is not set.');
  process.exit(1);
}

const tuesdayCoordinator = {
  name: 'Tom Dwyer',
  phone: '608-386-3536'
};

const wednesdayCoordinator = {
  name: 'Mark Hoff',
  phone: '608-769-1416'
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
  const matchDay = night === 'Tues' ? 'Tuesday' : 'Wednesday';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the 2026 LTTA Season!</title>
    <style>
        body { font-family: Arial, sans-serif; color: #333333; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .email-container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        .header { background-color: #2e7d32; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px 30px; }
        h2 { color: #2e7d32; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; margin-top: 30px; }
        .highlight-box { background-color: #e8f5e9; border-left: 5px solid #2e7d32; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
        .captain-box { background-color: #fff3e0; border-left: 5px solid #ef6c00; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 10px; }
        .footer { background-color: #f9f9f9; text-align: center; padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to the 2026 LTTA Season! 🎾</h1>
        </div>

        <div class="content">
            <p>Hello ${escapeHTML(teamName)} players,</p>
            <p>Welcome to the 2026 season of the La Crosse Team Tennis Association (LTTA)! We are thrilled to get back out on the courts for another great summer of tennis.</p>

            <div class="highlight-box">
                <h3 style="margin-top: 0; color: #2e7d32;">📋 Your Team: ${escapeHTML(teamName)} (${escapeHTML(night)} #${escapeHTML(teamNumber)})</h3>
                <p><strong>Captain:</strong> ${escapeHTML(captain.name)}</p>
                ${coCaptain ? `<p><strong>Co-Captain:</strong> ${escapeHTML(coCaptain.name)}</p>` : ''}
                <p><strong>Night Coordinator:</strong> ${escapeHTML(nightCoordinator.name)}</p>
            </div>

            <h2>First Night Onboarding</h2>
            <ul>
                <li><strong>Check-in:</strong> Arrive 15 minutes early for your first match.</li>
                <li><strong>Balls:</strong> Tennis balls are provided by the league for every match.</li>
                <li><strong>Hydration:</strong> ⚠️ <strong>IMPORTANT:</strong> The water fountain at Green Island is currently out of order. Please bring plenty of your own water.</li>
            </ul>

            <h2>The Basics</h2>
            <ul>
                <li><strong>When & Where:</strong> Matches are played on ${escapeHTML(matchDay)} evenings at Green Island Park. Start times rotate between 5:30 pm and 7:00 pm. <strong>Please pay attention to the schedule location, as a few matches are at Forest Hills due to court conflicts.</strong></li>
                <li><strong>Punctuality:</strong> Please arrive 10 minutes prior to your scheduled match time. The 15-minute forfeit rule is strictly in effect.</li>
                <li><strong>League Website:</strong> Find schedules, standings, and sub lists at <a href="https://couleeregiontennis.org">couleeregiontennis.org</a></li>
                <li><strong>Subs:</strong> If you can't make a match, you are responsible for finding a sub. Check the <a href="https://couleeregiontennis.org/pages/subs.html">Sub List and GroupMe links</a> on the website.</li>
            </ul>

            <div class="highlight-box">
                <h3 style="margin-top: 0; color: #2e7d32;">🚨 2026 Rule Reminders</h3>
                <ul>
                    <li><strong>Scoring:</strong> Earn <strong>1 point per set won(including tiebreakers)</strong> and <strong>1 point for participation</strong> (showing up on time).</li>
                    <li><strong>Heat Rule:</strong> We use the "RealFeel" temperature on accuweather.com. Over 95&deg;F = optional 2-2 start; over 104&deg;F = automatic cancellation.</li>
                    <li><strong>Lineups:</strong> For line 3, if there is a dispute over who assigns teams first, home team must assign lines first.</li>
                </ul>
            </div>

            <h2>League Dues</h2>
            <p>Dues are <strong>$25 for the season</strong>, due by the 2nd week of play. Please pay your captain who will pass it on to a Coordinator.</p>

            <h2>Year-End Picnic & Championship</h2>
            <p>The season wraps up with our picnic and a new crossover championship! The top teams from Tuesday will face off against the top teams from Wednesday to determine the overall league champion. Additionally, the 'winningest lines' will be invited to play in this event.</p>

            <p>Best regards,<br>
                <strong>The LTTA League Committee</strong>
            </p>
        </div>

        <div class="footer">
            La Crosse Team Tennis Association (LTTA)<br>
            Coulee Region Tennis Association (CRTA)
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

    const csvContent = await fetchCSV(CSV_URL);
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
