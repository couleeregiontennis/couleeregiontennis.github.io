/**
 * LTTA Email Draft Generator - FINAL POLISHED VERSION
 * Automatically groups players by team and creates Gmail drafts.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('LTTA Tools')
      .addItem('Create Season Start Email Drafts', 'createLTTADrafts')
      .addItem('Create Picnic Email Drafts (OLD)', 'createPicnicDrafts')
      .addItem('🏆 Create 2026 Picnic & Playoff Drafts (NEW)', 'create2026PicnicPlayoffDrafts')
      .addToUi();
}

function create2026PicnicPlayoffDrafts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ROSTERS");

  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: Tab 'ROSTERS' not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });

  function findCol(possibleNames) {
    for (var i = 0; i < possibleNames.length; i++) {
      var target = possibleNames[i].toLowerCase();
      var foundIdx = headers.indexOf(target);
      if (foundIdx !== -1) return foundIdx;
    }
    return -1;
  }

  const idx = {
    night: findCol(["Night", "Day"]),
    team: findCol(["Team/", "Team"]),
    name: findCol(["Name", "1-Name"]),
    email: findCol(["Email"]),
    teamName: findCol(["TEAM NAME"])
  };

  const teams = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const night = row[idx.night];
    const teamNum = row[idx.team];
    const name = row[idx.name];

    if (!night || !teamNum || !name) continue;

    const key = night + "-" + teamNum;
    if (!teams[key]) {
      teams[key] = {
        night: night,
        teamNumber: teamNum,
        teamName: (idx.teamName !== -1 && row[idx.teamName]) ? row[idx.teamName] : "Team " + teamNum,
        emails: []
      };
    }

    const email = row[idx.email];
    if (email && email.toString().includes("@")) {
      teams[key].emails.push(email.toString().trim());
    }
  }

  let count = 0;
  for (let key in teams) {
    const team = teams[key];
    if (String(team.teamName).toUpperCase() === 'BYE') continue;
    if (team.emails.length === 0) continue;

    const subject = "LTTA Update: End-of-Season Picnic & Playoff Night!";
    const bodyHtml = generatePicnicHtml(team);
    const bodyPlain = generatePicnicPlain(team);

    GmailApp.createDraft(team.emails.join(","), subject, bodyPlain, {
      htmlBody: bodyHtml
    });
    count++;
  }

  SpreadsheetApp.getUi().alert("Done! Created " + count + " NEW 2026 Picnic & Playoff Email drafts in Gmail.");
}

function createPicnicDrafts() {
  create2026PicnicPlayoffDrafts();
}

function createLTTADrafts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ROSTERS");

  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: Tab 'ROSTERS' not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });

  function findCol(possibleNames) {
    for (var i = 0; i < possibleNames.length; i++) {
      var target = possibleNames[i].toLowerCase();
      var foundIdx = headers.indexOf(target);
      if (foundIdx !== -1) return foundIdx;
    }
    return -1;
  }

  const idx = {
    night: findCol(["Night", "Day"]),
    team: findCol(["Team/", "Team"]),
    role: findCol(["C/CC", "Role"]),
    name: findCol(["Name", "1-Name"]),
    email: findCol(["Email"]),
    teamName: findCol(["TEAM NAME"])
  };

  const teams = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const night = row[idx.night];
    const teamNum = row[idx.team];
    const name = row[idx.name];

    if (!night || !teamNum || !name) continue;

    const key = night + "-" + teamNum;
    if (!teams[key]) {
      teams[key] = {
        night: night,
        teamNumber: teamNum,
        teamName: (idx.teamName !== -1 && row[idx.teamName]) ? row[idx.teamName] : "Team " + teamNum,
        emails: [],
        captain: "TBD",
        coCaptain: ""
      };
    }

    const email = row[idx.email];
    if (email && email.toString().includes("@")) {
      teams[key].emails.push(email.toString().trim());
    }

    const role = (idx.role !== -1) ? String(row[idx.role]).trim().toUpperCase() : "";
    if (role === 'C') teams[key].captain = name;
    if (role === 'CC') teams[key].coCaptain = name;
  }

  let count = 0;
  for (let key in teams) {
    const team = teams[key];
    if (String(team.teamName).toUpperCase() === 'BYE') continue;
    if (team.emails.length === 0) continue;

    const subject = "Welcome to the 2026 LTTA Season - " + team.night + " Team " + team.teamNumber;
    const bodyHtml = generateEmailHtml(team);
    const bodyPlain = generatePlainText(team);

    GmailApp.createDraft(team.emails.join(","), subject, bodyPlain, {
      htmlBody: bodyHtml
    });
    count++;
  }

  SpreadsheetApp.getUi().alert("Done! Created " + count + " drafts in Gmail.");
}

function generatePlainText(team) {
  const isTues = (String(team.night).toLowerCase().indexOf('tue') !== -1);
  const startDate = isTues ? 'May 26th' : 'May 27th';
  return "Welcome to the 2026 LTTA Season!\n\n" +
         "The season kicks off on " + startDate + ".\n\n" +
         "Your Team: " + team.teamName + "\n" +
         "Captain: " + team.captain + "\n\n" +
         "Website: https://couleeregiontennis.org";
}

function generateEmailHtml(team) {
  var night = team.night;
  var isTues = (String(night).toLowerCase().indexOf('tue') !== -1);
  var matchDay = isTues ? 'Tuesday' : 'Wednesday';
  var startDate = isTues ? 'May 26th' : 'May 27th';
  var coord = isTues ?
    { n: 'Tom Dwyer', p: '608-386-3536' } :
    { n: 'Mark Hoff', p: '608-769-1416' };

  var coCapHtml = team.coCaptain ? '<p style="margin: 5px 0;"><strong>Co-Captain:</strong> ' + team.coCaptain + '</p>' : '';

  // HTML Entities for icons:
  var racketIcon = '&#127934;';
  var clipboardIcon = '&#128203;';
  var warningIcon = '&#9888;';
  var sirenIcon = '&#128680;';

  return '<div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6; max-width: 650px; margin: 0 auto; border: 1px solid #eeeeee; border-radius: 8px; overflow: hidden; background-color: #ffffff;">' +      
      '<div style="background-color: #2e7d32; color: #ffffff; padding: 20px; text-align: center;">' +
        '<h1 style="margin: 0; font-size: 24px;">Welcome to the 2026 LTTA Season! ' + racketIcon + '</h1>' +    
      '</div>' +
      '<div style="padding: 20px 30px;">' +
        '<p>Hello ' + team.teamName + ' players,</p>' +
        '<p>The season kicks off on <strong>' + startDate + '</strong>!</p>' +
        '<p>Welcome to the 2026 season of the La Crosse Team Tennis Association (LTTA)! We are thrilled to get back out on the courts for another great summer of tennis.</p>' +

        '<div style="background-color: #e8f5e9; border-left: 5px solid #2e7d32; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">' +
          '<h3 style="margin-top: 0; color: #2e7d32;">' + clipboardIcon + ' Your Team: ' + team.teamName + ' (' + night + ' #' + team.teamNumber + ')</h3>' +
          '<p style="margin: 5px 0;"><strong>Captain:</strong> ' + team.captain + '</p>' +
          coCapHtml +
          '<p style="margin: 5px 0;"><strong>Night Coordinator:</strong> ' + coord.n + ' (' + coord.p + ')</p>' +
        '</div>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">First Night Onboarding</h2>' +
        '<ul style="padding-left: 20px;">' +
          '<li style="margin-bottom: 10px;"><strong>Check-in:</strong> Arrive 15 minutes early for your first match.</li>' +
          '<li style="margin-bottom: 10px;"><strong>Balls:</strong> Tennis balls are provided by the league for every match.</li>' +
          '<li style="margin-bottom: 10px;"><strong style="color: #d32f2f;">Hydration:</strong> ' + warningIcon + ' <strong>IMPORTANT:</strong> The water fountain at Green Island is currently out of order. Please bring plenty of your own water.</li>' +
        '</ul>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">The Basics</h2>' +
        '<ul style="padding-left: 20px;">' +
          '<li style="margin-bottom: 10px;"><strong>When & Where:</strong> Matches are played on ' + matchDay + ' evenings at Green Island Park. Start times rotate between 5:30 pm and 7:00 pm. <strong>Please pay attention to the schedule location.</strong></li>' +
          '<li style="margin-bottom: 10px;"><strong>Punctuality:</strong> Please arrive 10 minutes prior to your scheduled match time.</li>' +
          '<li style="margin-bottom: 10px;"><strong>League Website:</strong> <a href="https://couleeregiontennis.org" style="color: #2e7d32; font-weight: bold;">couleeregiontennis.org</a></li>' +
        '</ul>' +

        '<div style="background-color: #fff3e0; border-left: 5px solid #ef6c00; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">' +
          '<h3 style="margin-top: 0; color: #ef6c00;">' + sirenIcon + ' 2026 Rule Reminders</h3>' +
          '<ul style="padding-left: 20px; margin-bottom: 0;">' +
            '<li style="margin-bottom: 5px;"><strong>Scoring:</strong> 1 point per set won (including tiebreakers) + 1 point for participation.</li>' +
            '<li style="margin-bottom: 5px;"><strong>Heat Rule:</strong> Over 95&deg;F = optional 2-2 start; over 104&deg;F = automatic cancellation.</li>' +
            '<li style="margin-bottom: 5px;"><strong>Home Team:</strong> For line 3, if there is a dispute over who assigns teams first, home team must assign lines first.</li>' +
          '</ul>' +
        '</div>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">League Dues</h2>' +
        '<p>Dues are <strong>$25 for the season</strong>, due by the 2nd week of play. Please pay your captain who will pass it on to a Coordinator.</p>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">Year-End Picnic & Championship</h2>' +
        '<p>The season wraps up with our picnic and a new crossover championship! The top teams from Tuesday will face off against the top teams from Wednesday to determine the overall league champion. Additionally, the 'winningest lines' will be invited to play in this event.</p>' +

        '<p style="margin-top: 30px;">Best regards,<br><strong>The LTTA League Committee</strong></p>' +        
      '</div>' +
      '<div style="background-color: #f9f9f9; text-align: center; padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee;">' +
        'La Crosse Team Tennis Association (LTTA)' +
      '</div>' +
    '</div>';
}

function createPicnicDrafts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ROSTERS");

  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: Tab 'ROSTERS' not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });

  function findCol(possibleNames) {
    for (var i = 0; i < possibleNames.length; i++) {
      var target = possibleNames[i].toLowerCase();
      var foundIdx = headers.indexOf(target);
      if (foundIdx !== -1) return foundIdx;
    }
    return -1;
  }

  const idx = {
    night: findCol(["Night", "Day"]),
    team: findCol(["Team/", "Team"]),
    name: findCol(["Name", "1-Name"]),
    email: findCol(["Email"]),
    teamName: findCol(["TEAM NAME"])
  };

  const teams = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const night = row[idx.night];
    const teamNum = row[idx.team];
    const name = row[idx.name];

    if (!night || !teamNum || !name) continue;

    const key = night + "-" + teamNum;
    if (!teams[key]) {
      teams[key] = {
        night: night,
        teamNumber: teamNum,
        teamName: (idx.teamName !== -1 && row[idx.teamName]) ? row[idx.teamName] : "Team " + teamNum,
        emails: []
      };
    }

    const email = row[idx.email];
    if (email && email.toString().includes("@")) {
      teams[key].emails.push(email.toString().trim());
    }
  }

  let count = 0;
  for (let key in teams) {
    const team = teams[key];
    if (String(team.teamName).toUpperCase() === 'BYE') continue;
    if (team.emails.length === 0) continue;

    const subject = "LTTA Update: End-of-Season Picnic & Final Match Week!";
    const bodyHtml = generatePicnicHtml(team);
    const bodyPlain = generatePicnicPlain(team);

    GmailApp.createDraft(team.emails.join(","), subject, bodyPlain, {
      htmlBody: bodyHtml
    });
    count++;
  }

  SpreadsheetApp.getUi().alert("Done! Created " + count + " Picnic Email drafts in Gmail.");
}

function generatePicnicPlain(team) {
  return "LTTA Update: End-of-Season Picnic & Playoff Night!\n\n" +
         "Current Standings & Top Teams:\n" +
         "Check the website (https://couleeregiontennis.org) for full updated standings!\n" +
         "- Tuesday Night Top 2: Spin Doctors (#1), Bounce It (#2)\n" +
         "- Wednesday Night Top 2: Backhand Bandits (#1), Not My Fault (#2)\n\n" +
         "Event Schedule & Rain Backup:\n" +
         "• Primary Event Date: Tuesday, August 11th\n" +
         "• Match Start Time: 5:30 PM sharp\n" +
         "• Rain Backup Date: Wednesday, August 12th at 5:30 PM (if Tuesday is rained out, we try again Wednesday!)\n" +
         "• Location: Green Island Park\n\n" +
         "New Playoff Format (2-Match Night):\n" +
         "• Matches start at 2-2 in games to fit two complete match rounds.\n" +
         "• Total games won across all lines will be used as the tiebreaker if team match wins are tied.\n" +
         "• Round 1 (5:30 PM - Semi-Finals):\n" +
         "  - Tuesday #1 vs Wednesday #2\n" +
         "  - Wednesday #1 vs Tuesday #2\n" +
         "• Round 2 (Finals & 3rd Place):\n" +
         "  - Championship Final: Winner Match A vs Winner Match B\n" +
         "  - 3rd Place Match: Loser Match A vs Loser Match B\n\n" +
         "Open Courts & Exhibition Play:\n" +
         "We have reserved all 13 courts at Green Island Park! Open courts will be available starting at 5:30 PM for non-playoff teams, winningest lines, and open hits.\n\n" +
         "Food, Drinks & Courtesy:\n" +
         "• Food & Drinks: Main food is provided by Spin Doctors, drinks by Not My Fault. Extra side dishes or desserts are welcome!\n" +
         "• Food Courtesy Note: Please hold off on taking seconds or taking food home until everyone (especially championship match players finishing later) has had a chance to eat!\n\n" +
         "Important Reminders:\n" +
         "1. Friends & Family: Family and friends are welcome! Bring your own lawn chairs.\n" +
         "2. Season Feedback: Please share any thoughts or ideas for next season with your team captain or directly with Brett!\n\n" +
         "Let us know if you have any questions.\nThanks!\nLTTA League Committee";
}

function generatePicnicHtml(team) {
  var trophyIcon = '&#127942;';
  var picnicIcon = '&#129369;';
  var tennisIcon = '&#127934;';

  return '<div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6; max-width: 650px; margin: 0 auto; border: 1px solid #eeeeee; border-radius: 8px; overflow: hidden; background-color: #ffffff;">' +
      '<div style="background-color: #2e7d32; color: #ffffff; padding: 20px; text-align: center;">' +
        '<h1 style="margin: 0; font-size: 24px;">End-of-Season Picnic & Playoff Night! ' + picnicIcon + '</h1>' +
      '</div>' +
      '<div style="padding: 20px 30px;">' +
        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 10px;">' + picnicIcon + ' Date & Match Start Time</h2>' +
        '<div style="background-color: #e8f5e9; border: 1px solid #a5d6a7; padding: 15px; border-radius: 6px; margin: 15px 0;">' +
          '<p style="margin: 0 0 8px 0; font-size: 16px;"><strong>Primary Date:</strong> Tuesday, August 11th</p>' +
          '<p style="margin: 0 0 8px 0; font-size: 16px; color: #2e7d32;"><strong>Match Start Time:</strong> 5:30 PM sharp</p>' +
          '<p style="margin: 0 0 8px 0;"><strong>Location:</strong> Green Island Park</p>' +
          '<p style="margin: 0; font-weight: bold; color: #c62828;">&#9748; Rain Backup Plan: If Tuesday is rained out, we will try again on Wednesday, August 12th at 5:30 PM!</p>' +
        '</div>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + trophyIcon + ' Current Standings & Top Teams</h2>' +
        '<p>Check the website (<a href="https://couleeregiontennis.org" style="color: #2e7d32; font-weight: bold;">couleeregiontennis.org</a>) for full updated standings!</p>' +
        '<ul style="padding-left: 20px;">' +
          '<li style="margin-bottom: 5px;"><strong>Tuesday Night Top Teams:</strong> #1 Spin Doctors, #2 Bounce It</li>' +
          '<li style="margin-bottom: 5px;"><strong>Wednesday Night Top Teams:</strong> #1 Backhand Bandits, #2 Not My Fault</li>' +
        '</ul>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + tennisIcon + ' New 2-Match Playoff Rules</h2>' +
        '<p>This season features an expanded <strong>2-Match Crossover Tournament</strong> among the top 2 teams from each night!</p>' +
        '<ul style="padding-left: 20px;">' +
          '<li style="margin-bottom: 5px;"><strong>5:30 PM Match Start:</strong> Semi-Finals start promptly at 5:30 PM.</li>' +
          '<li style="margin-bottom: 5px;"><strong>2-2 Game Start:</strong> Matches will start at <strong>2-2 in games</strong> to fit both semi-finals and finals in one night.</li>' +
          '<li style="margin-bottom: 5px;"><strong>Tiebreaker Rule:</strong> If team match wins are tied, <strong>total games won</strong> across all lines will determine the winner.</li>' +
        '</ul>' +

        /* HTML Visual Playoff Bracket Card */
        '<div style="background-color: #f4fbf7; border: 2px dashed #2e7d32; border-radius: 8px; padding: 18px; margin: 20px 0;">' +
          '<h3 style="margin-top: 0; text-align: center; color: #1b5e20; font-size: 16px;">' + trophyIcon + ' Picnic Night Playoff Bracket</h3>' +
          '<table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-top: 10px; text-align: center; font-size: 13px;">' +
            '<tr>' +
              '<td style="background: #ffffff; border: 1px solid #a5d6a7; border-radius: 6px; padding: 10px; width: 48%; vertical-align: top;">' +
                '<div style="font-weight: bold; color: #2e7d32; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 6px;">ROUND 1: SEMI-FINALS (5:30 PM)</div>' +
                '<div style="background: #e8f5e9; padding: 6px; border-radius: 4px; margin-bottom: 6px;"><strong>Match A:</strong> Tuesday #1 vs Wednesday #2</div>' +
                '<div style="background: #e8f5e9; padding: 6px; border-radius: 4px;"><strong>Match B:</strong> Wednesday #1 vs Tuesday #2</div>' +
              '</td>' +
              '<td style="background: #ffffff; border: 1px solid #81c784; border-radius: 6px; padding: 10px; width: 48%; vertical-align: top;">' +
                '<div style="font-weight: bold; color: #1b5e20; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 6px;">ROUND 2: FINALS</div>' +
                '<div style="background: #c8e6c9; padding: 6px; border-radius: 4px; margin-bottom: 6px; font-weight: bold; color: #1b5e20;">&#127942; Championship Match<br><span style="font-weight: normal; font-size: 12px; color: #333;">Winner Match A vs Winner Match B</span></div>' +
                '<div style="background: #f1f8e9; padding: 6px; border-radius: 4px; font-weight: bold; color: #33691e;">&#129353; 3rd Place Match<br><span style="font-weight: normal; font-size: 12px; color: #333;">Loser Match A vs Loser Match B</span></div>' +
              '</td>' +
            '</tr>' +
          '</table>' +
        '</div>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + tennisIcon + ' Open Courts Reserved (All 13 Courts)</h2>' +
        '<p>We have reserved <strong>all 13 courts at Green Island Park</strong>! Open courts will be available starting at 5:30 PM for all non-playoff teams, winningest lines, and casual hits throughout the evening.</p>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + picnicIcon + ' Food, Drinks & Courtesy</h2>' +
        '<ul style="padding-left: 20px;">' +
          '<li style="margin-bottom: 5px;"><strong>Spin Doctors</strong> will provide main food arrangements.</li>' +
          '<li style="margin-bottom: 5px;"><strong>Not My Fault</strong> will provide drinks.</li>' +
          '<li style="margin-bottom: 5px;"><strong>Potluck Sides:</strong> Bringing extra side dishes or desserts is welcome and appreciated, though food is already provided!</li>' +
          '<li style="margin-bottom: 5px; color: #b71c1c;"><strong>Food Courtesy Note:</strong> Please do <strong>not take food home</strong> or grab seconds until everyone (especially players finishing late championship matches) has had a chance to eat!</li>' +
        '</ul>' +

        '<div style="background-color: #e8f5e9; border-left: 5px solid #2e7d32; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">' +
          '<h3 style="margin-top: 0; color: #2e7d32;">Important Reminders</h3>' +
          '<ol style="padding-left: 20px; margin-bottom: 0;">' +
            '<li style="margin-bottom: 8px;"><strong>Friends & Family:</strong> All friends and family are welcome! Please bring your own lawn chairs.</li>' +
            '<li style="margin-bottom: 8px;"><strong>Season Feedback:</strong> Have feedback or ideas for next year? Please share your thoughts with your captain or directly with Brett!</li>' +
            '<li style="margin-bottom: 0;"><strong>Donations:</strong> Welcome but not required.</li>' +
          '</ol>' +
        '</div>' +

        '<p style="margin-top: 30px;">Let us know if you have any questions.<br>Thanks!<br><strong>The LTTA League Committee</strong></p>' +
      '</div>' +
      '<div style="background-color: #f9f9f9; text-align: center; padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee;">' +
        'La Crosse Team Tennis Association (LTTA)' +
      '</div>' +
    '</div>';
}';
}