const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const INPUT_CSV = 'ltta.csv';
const OUTPUT_DIR = 'output_emails';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

const coordinator = {
  name: 'Brett Meddaugh',
  phone: '907-980-1293'
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

fs.createReadStream(INPUT_CSV)
  .pipe(csv())
  .on('data', (row) => {
    const key = teamKey(row.Night, row.Team);
    if (!teams[key]) {
      teams[key] = {
        night: row.Night,
        teamNumber: row.Team,
        teamName: row['TEAM NAME'],
        players: [],
        captain: null,
        coCaptain: null
      };
    }

    const player = {
      name: row['1-Name']?.trim(),
      email: row.Email?.trim(),
      isCaptain: row['C'] === 'C',
      isCoCaptain: row['C'] === 'CC',
      phone: row['1-Telephone']?.trim()
    };

    teams[key].players.push(player);

    if (!teams[key].captain && row['C/CC'] === 'C') {
    teams[key].captain = player;
    }
    if (!teams[key].coCaptain && row['C/CC'] === 'CC') {
    teams[key].coCaptain = player;
    }

  })
  .on('end', () => {
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

const captainSection = `
Your Team Captain  
#3 ${captain.name}  
📞 ${captain.phone}
`;

const coCaptainSection = coCaptain
  ? `\nYour Co-Captain  
${coCaptain.name}  
📞 ${coCaptain.phone}
`
  : '';

const nightCoordinatorSection = `
Your Night Coordinator  
${nightCoordinator.name}  
📞 ${nightCoordinator.phone}
`;


const body = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6; padding: 20px; max-width: 700px; margin: auto; background-color: #ffffff;">
    
    <h2 style="color: #004080; margin-bottom: 0;">Hello LTTA ${night} Team ${teamNumber} ${teamName}:</h2>
    <p style="margin-top: 5px;">Here we go – our 42nd year for La Crosse Team Tennis Association (LTTA) tennis league.</p>

    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />

    <p>We're trying something a little different this year. Visit:</p>
    <p><a href="https://couleeregiontennis.github.io" style="color: #0066cc;">https://couleeregiontennis.github.io</a></p>

    <p>There you’ll find:</p>
    <ul style="margin-top: 0; padding-left: 20px;">
      <li>Your team schedule</li>
      <li>Printable schedule for all teams</li>
      <li>The ability to add matches to your calendar</li>
      <li>Team rosters</li>
      <li>Rules</li>
      <li>Green Island info</li>
      <li>GroupMe chats to help find a sub</li>
    </ul>

    <p>Once the season starts, we’ll add team standings. Feel free to send any feedback.</p>

    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />

    <p><strong>Your Team Captain</strong><br>
    #3 ${captain.name}<br>
    📞 ${captain.phone}</p>

    ${coCaptain ? `
    <p><strong>Your Co-Captain</strong><br>
    ${coCaptain.name}<br>
    📞 ${coCaptain.phone}</p>
    ` : ''}

    <p><span style="font-size:0.50em; color:#666;">(see Rules area of website for info on On-Site Coordinator)</span><br>
    <strong>On-Site Coordinator</strong><br>
    ${nightCoordinator.name}<br>
    📞 ${nightCoordinator.phone}</p>

    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />

    <p><strong>League Start:</strong> ${night === 'Tues' ? 'Tuesday, June 3' : 'Wednesday, June 4'} at 5:30 PM or 7:00 PM<br>
    Some courts at 5:30 may be in use by Aquinas tennis. If it affects your team, we’ll let you know.</p>
    
    <p><strong>Location:</strong> Green Island Park Tennis Courts</p>

    <p><strong>Player Fee:</strong> $25 – Pay your captain within the first two weeks.<br>
    Checks payable to <em>LTTA</em> (confirm preferred method with your captain).</p>

    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />

    <p><strong>Scheduling Note:</strong> Match times don't always alternate between 5:30 and 7:00 PM. Some teams may have the same time multiple weeks in a row. It should even out (or close to) by season’s end.</p>

    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />

    <p><strong>Sub Policy:</strong></p>
    <ul style="padding-left: 20px;">
      <li>Tell your captain if you can’t make a match</li>
      <li>Try using a roster sub before asking players from the other night</li>
      <li>Use GroupMe – it makes finding subs easier</li>
    </ul>

    <p>Players reported that subbing was hard in past seasons. Use GroupMe early if you’ll miss a match.</p>

    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />

    <p><strong>What’s New This Season:</strong></p>
    <ol style="padding-left: 20px;">
      <li>8-player teams as in the past, playing doubles. Players #1 & #2 can play singles (if all agree and courts 1–5 are available).</li>
      <li>Bonus point for teams playing with all roster players (no subs) that week.</li>
      <li>There will be a Singles Night. If you’re interested, sign up:
        <br><a href="https://forms.gle/mUgE38YeV7rNLduR8" style="color: #0066cc;">https://forms.gle/mUgE38YeV7rNLduR8</a>
      </li>
    </ol>

    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />

    <p><strong>Thanks to Roxie Anderson</strong> (Wed Team 4 Captain) for updating our Facebook page.</p>

    <p>Follow us:<br>
    <a href="https://facebook.com/couleeregiontennis" style="color: #0066cc;">facebook.com/couleeregiontennis</a><br>
    <a href="https://www.couleeregiontennis.com" style="color: #0066cc;">www.couleeregiontennis.com</a></p>

    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />

    <p>See you on the courts,</p>

    <p><strong>${coordinator.name}</strong><br>
    LTTA Coordinator<br>
    📞 ${coordinator.phone}</p>
  </body>
</html>
`;



      const emailContent = `${body}`;
      fs.writeFileSync(fileName, emailContent, 'utf8');
      console.log(`✅ Created email for ${night} Team ${teamNumber} – ${fileName}`);
    });
  });
