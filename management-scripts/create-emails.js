// Creates emails to send out to ltta teams at the beginning of the season.

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { fetchCSV } = require('./fetch-csv');

const OUTPUT_DIR = '../output_emails';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlgS5yGzip6doLKqud9BDdpCt1_8CPWNjUxFmYgVdkdbQ_MNIc1ku1GJoZ2NBEuw/pub?gid=270023155&single=true&output=csv';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

const coordinator = {
  name: 'Brett Meddaugh',
  phone: '907-980-1293',
  email: 'brett.meddaugh@gmail.com'
};

const tuesdayCoordinator = {
    name: 'Tom Dwyer',
    phone: '815-904-0008'
}
 wednesdayCoordinator = {
    name: 'Mark Hoff',
    phone: '608-386-9310'
}

// Utility: Generate a team ID like "Wed-2"
function teamKey(night, teamNumber) {
  return `${night}-${teamNumber}`;
}

// Store players by team
const teams = {};

async function main() {
  try {
    const csvContent = await fetchCSV(CSV_URL);
    console.log('Fetched CSV data successfully');
    
    // Parse CSV content
    const records = [];
    const parser = csv({
      mapValues: ({ header, value }) => value.trim()
    });

    parser.on('data', (data) => {
      // Map new column names to expected format
      const record = {
        Night: data.Night,
        Team: data['Team/'],
        Captain: data['C/CC'] === 'C' ? '✓' : '',
        CoCaptain: data['C/CC'] === 'CC' ? '✓' : '',
        Level: data.Level,
        Name: data['1-Name'],
        TeamName: data['TEAM NAME']
      };
      records.push(record);
    });

    parser.on('end', () => {
      // Group players by team
      records.forEach(record => {
        if (!record.Night || !record.Team || !record.Name) {
          console.warn('Skipping incomplete record:', record);
          return;
        }

        const key = teamKey(record.Night, record.Team);
        
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
        const { night, teamNumber, teamName, players, captain } = team;

        if (!captain) {
          console.warn(`⚠️  No captain found for ${night} Team ${teamNumber}`);
          return;
        }

        const fileName = path.join(
          OUTPUT_DIR,
          `${night}_Team_${teamNumber}_${teamName.replace(/\s+/g, '_')}.html`
        );

        const coCaptain = team.coCaptain;
        const nightCoordinator = night === 'Tues' ? tuesdayCoordinator : wednesdayCoordinator;

        const body = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>LTTA Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; color: #111111; line-height: 1.6; margin: 0; padding: 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; margin: auto;">
              <tr>
                <td style="padding: 20px;">
                  <h2 style="color: #004080; margin-bottom: 5px;">Hello LTTA ${night} Team ${teamNumber} ${teamName}:</h2>
                  <p style="margin-top: 5px;">Here we go – our 42nd year for La Crosse Team Tennis Association (LTTA) tennis league.</p>
        
                  <div style="background:#f5f8fb; border-radius:8px; padding:18px 16px; margin:28px 0;">
                    <p>We're trying something a little different this year. Visit:</p>
                    <p><a href="https://couleeregiontennis.github.io" style="color: #0066cc;">https://couleeregiontennis.github.io</a></p>
                    <p>There you’ll find:</p>
                    <ul style="padding-left: 20px;">
                      <li>Your team schedule</li>
                      <li>Printable schedule for all teams</li>
                      <li>The ability to add matches to your calendar</li>
                      <li>Team rosters</li>
                      <li>Rules</li>
                      <li>Green Island info</li>
                      <li>GroupMe chats to help find a sub</li>
                    </ul>
                    <p>Once the season starts, we’ll add team standings. Feel free to send any feedback.</p>
                  </div>
        
                  <div style="background:#f5f8fb; border-radius:8px; padding:18px 16px; margin:28px 0;">
                    <p><strong>Your Team Captain</strong><br>
                    ${captain.name}<br>
                    📞 ${captain.phone}</p>
                    ${coCaptain ? `
                    <p><strong>Your Co-Captain</strong><br>
                    ${coCaptain.name}<br>
                    📞 ${coCaptain.phone}</p>
                    ` : ''}
                    <p><span style="font-size:0.95em; color:#666;">(see Rules area of website for info on On-Site Coordinator)</span><br>
                    <strong>On-Site Coordinator</strong><br>
                    ${nightCoordinator.name}<br>
                    📞 ${nightCoordinator.phone}</p>
                  </div>
        
                  <div style="background:#f5f8fb; border-radius:8px; padding:18px 16px; margin:28px 0;">
                    <p><strong>League Start:</strong> ${night === 'Tues' ? 'Tuesday, June 3' : 'Wednesday, June 4'} at 5:30 PM or 7:00 PM<br>
                    Some courts at 5:30 may be in use by Aquinas tennis. If it affects your team, we’ll let you know.</p>
                    <p><strong>Location:</strong> Green Island Park Tennis Courts</p>
                    <p><strong>Player Fee:</strong> $25 – Pay your captain within the first two weeks.<br>
                    Checks payable to <em>LTTA</em> (confirm preferred method with your captain).</p>
                  </div>
        
                  <div style="background:#f5f8fb; border-radius:8px; padding:18px 16px; margin:28px 0;">
                    <p><strong>Scheduling Note:</strong><br>
                    Match times don't always alternate between 5:30 and 7:00 PM. Some teams may have the same time multiple weeks in a row. It should even out (or close to) by season’s end.</p>
                  </div>
        
                  <div style="background:#f5f8fb; border-radius:8px; padding:18px 16px; margin:28px 0;">
                    <p><strong>Sub Policy:</strong></p>
                    <ul style="padding-left: 20px;">
                      <li>Tell your captain if you can’t make a match</li>
                      <li>Try find a sub that doesn't get to play normally, before asking players from the other night</li>
                      <li>Use GroupMe – it makes finding subs easier</li>
                    </ul>
                    <p>Players reported that finding a sub is sometimes difficult. Please use GroupMe to find a sub, it should make the process easier.</p>
                  </div>
        
                  <div style="background:#f5f8fb; border-radius:8px; padding:18px 16px; margin:28px 0;">
                    <p><strong>What’s New This Season:</strong></p>
                    <ol style="padding-left: 20px;">
                      <li>Teams now have 8 players.</li>
                      <li>Players #1 & #2 defaults to doubles, but may choose to play singles (if all players agree and match is scheduled for courts 1–5).</li>
                      <li>There will be a Singles Night. If you’re interested, sign up:<br>
                        <a href="https://forms.gle/mUgE38YeV7rNLduR8" style="color: #0066cc;">https://forms.gle/mUgE38YeV7rNLduR8</a>
                      </li>
                      <li>Line 3 now has both lines as doubles. You may mix and match partners as usual.</li>
                    </ol>
                  </div>
        
                  <div style="background:#f5f8fb; border-radius:8px; padding:18px 16px; margin:28px 0;">
                    <p><strong>Thanks to Roxie Anderson</strong> (Wed Team 4 Captain) for updating our Facebook page.</p>
                    <p>
                      Follow us:<br>
                      <a href="https://facebook.com/couleeregiontennis" style="color: #0066cc;">facebook.com/couleeregiontennis</a><br>
                      <a href="https://www.couleeregiontennis.com" style="color: #0066cc;">www.couleeregiontennis.com</a>
                    </p>
                  </div>
        
                  <div style="background:#f5f8fb; border-radius:8px; padding:18px 16px; margin:28px 0;">
                    <p>See you on the courts,</p>
                    <p><strong>${coordinator.name}</strong><br>
                    LTTA Coordinator<br>
                    📞 ${coordinator.phone}<br>
                    ✉️ ${coordinator.email}</p>
                  </div>
                </td>
              </tr>
            </table>
          </body>
        </html>
        `;
        
        const emailContent = `${body}`;
        fs.writeFileSync(fileName, emailContent, 'utf8');
        console.log(`✅ Created email for ${night} Team ${teamNumber} – ${fileName}`);
      });
    });
    
    parser.write(csvContent);
    parser.end();

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

main().catch(console.error);
