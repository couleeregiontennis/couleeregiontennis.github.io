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

      const subject = `LTTA ${night} Team ${teamNumber} ${teamName} – Summer 2025 Season Details`;
      const fileName = path.join(
        OUTPUT_DIR,
        `${night}_Team_${teamNumber}_${teamName.replace(/\s+/g, '_')}.txt`
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
#1 ${nightCoordinator.name}  
📞 ${nightCoordinator.phone}
`;


      const body = `
Hi ${teamName} Team,

Welcome to the 42nd year of the La Crosse Team Tennis Association (LTTA) league!

We’re trying a few new things this summer. Visit our website:  
👉 https://couleeregiontennis.github.io

You'll find:
- Team and full league schedules (printable)
- Team rosters
- League rules
- Info on Green Island Tennis Courts
- GroupMe links to help you find a sub

I plan to add team standings once the season starts. If you run into any issues, let me know. Feedback is welcome.

---

${captainSection}${coCaptainSection}${nightCoordinatorSection}

---

Key Info

- Start Date: Tuesday, June 3 and Wednesday, June 4  
- Start Times: 5:30 PM or 7:00 PM (check your team schedule)  
- Location: Green Island Park Tennis Courts, La Crosse  
- Fee: $25 – Providate payment to ${captain.name} within the first two weeks. If paying by check, make it out to LTTA (confirm with ${captain.name} first).

---

Court Scheduling Notes

- Match times don’t always alternate each week (some weeks may repeat the same time).
- Over the season, match times balance out across teams (or close to it).
- Start matches on time, a maximum of 10 minutes warm-up is allowed.
- 5:30 matches should finish by 7:00 PM. If your match is still ongoing, you may choose to move locations to finish your match, or split the points as outlined in our rules.
- Some early 5:30 courts may be unavailable due to Aquinas tennis. We’ll notify you if it affects your team.

---

Sub Policy

- Let your team captain ${captain.name} know if you can’t make a week.
- Try to use a sub from the GroupMe list before asking players from the other league night.
- Feedback shows subbing is one of the biggest challenges—GroupMe should help.

---

What’s New This Summer

1. 8-player teams with doubles format (as in the past). Pairs 1 & 2 can opt to play singles (courts 1–5 only, all must agree).
2. Teams earn a bonus point if they play all matches with rostered players (no subs).
3. We’re planning a Singles Night. Interested? Sign up here:  
   https://forms.gle/mUgE38YeV7rNLduR8

---

Stay Connected

- Facebook: https://www.facebook.com/couleeregiontennis  
  (Thanks to Roxie Anderson – Wed Team 4 Captain – for keeping it current!)
- Website: https://www.couleeregiontennis.com

---

See you on the courts,  
${coordinator.name}  
LTTA Coordinator  
📱 ${coordinator.phone}
`;

      const emailContent = `${subject}\n\n${body}`;
      fs.writeFileSync(fileName, emailContent, 'utf8');
      console.log(`✅ Created email for ${night} Team ${teamNumber} – ${fileName}`);
    });
  });
