/**
 * LTTA Email Draft Generator - FINAL POLISHED VERSION
 * Automatically groups players by team and creates Gmail drafts.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('LTTA Tools')
      .addItem('Create Email Drafts', 'createLTTADrafts')
      .addToUi();
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
          '<li style="margin-bottom: 10px;"><strong>When & Where:</strong> Matches are played on ' + matchDay + ' evenings at Green Island Park. Start times rotate between 5:30 pm and 7:00 pm. <strong>Please pay attention to the schedule location, as a few matches are at Logan due to court conflicts.</strong></li>' +
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