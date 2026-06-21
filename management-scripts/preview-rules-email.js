const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateEmailHtml(team) {
  var night = team.night;
  var isTues = (String(night).toLowerCase().indexOf('tue') !== -1);
  var coord = isTues ?
    { n: 'Tom Dwyer', p: '608-386-3536' } :
    { n: 'Mark Hoff', p: '608-769-1416' };

  var coCapHtml = team.coCaptain ? '<p style="margin: 5px 0;"><strong>Co-Captain:</strong> ' + escapeHTML(team.coCaptain) + '</p>' : '';

  // HTML Entities for icons to prevent bad emoji rendering in Sheets/Gmail:
  var racketIcon = '&#127934;';   // Tennis racket
  var clipboardIcon = '&#128203;';// Clipboard
  var sunIcon = '&#9728;';        // Sun
  var trophyIcon = '&#127942;';    // Trophy
  var warningIcon = '&#9888;';     // Warning sign
  var moneyIcon = '&#128176;';     // Money bag

  var scheduleNoticeHtml = '';
  if (isTues) {
    var teamNumStr = String(team.teamNumber).trim();
    var tuesdayMatchLookup = {
      '1': {
        w5: { opp: 'Herons (Team 3)', time: '7:00 PM', courts: 'Courts 10-13' },
        w10: { opp: 'Return to Sender with Love (Team 8)', time: '5:30 PM', courts: 'Courts 6-9' }
      },
      '2': {
        w5: { opp: 'Approach Shots (Team 4)', time: '7:00 PM', courts: 'Courts 6-9' },
        w10: { opp: 'Herons (Team 3)', time: '5:30 PM', courts: 'Courts 10-13' }
      },
      '3': {
        w5: { opp: 'Spin Doctors (Team 1)', time: '7:00 PM', courts: 'Courts 10-13' },
        w10: { opp: 'Subs (Team 2)', time: '5:30 PM', courts: 'Courts 10-13' }
      },
      '4': {
        w5: { opp: 'Subs (Team 2)', time: '7:00 PM', courts: 'Courts 6-9' },
        w10: { opp: 'Easy Overhead (Team 12)', time: '7:00 PM', courts: 'Courts 10-13' }
      },
      '5': {
        w5: { opp: 'Easy Overhead (Team 12)', time: '7:00 PM', courts: 'Courts 1-5' },
        w10: { opp: 'Full Metal Racquet (Team 11)', time: '7:00 PM', courts: 'Courts 6-9' }
      },
      '6': {
        w5: { opp: 'Full Metal Racquet (Team 11)', time: '5:30 PM', courts: 'Courts 1-5' },
        w10: { opp: 'Jetsetters (Team 10)', time: '7:00 PM', courts: 'Courts 1-5' }
      },
      '7': {
        w5: { opp: 'Jetsetters (Team 10)', time: '5:30 PM', courts: 'Courts 6-9' },
        w10: { opp: 'Bounce It (Team 9)', time: '5:30 PM', courts: 'Courts 1-5' }
      },
      '8': {
        w5: { opp: 'Bounce It (Team 9)', time: '5:30 PM', courts: 'Courts 10-13' },
        w10: { opp: 'Spin Doctors (Team 1)', time: '5:30 PM', courts: 'Courts 6-9' }
      },
      '9': {
        w5: { opp: 'Return to Sender with Love (Team 8)', time: '5:30 PM', courts: 'Courts 10-13' },
        w10: { opp: 'Good Ol\' Boys (Team 7)', time: '5:30 PM', courts: 'Courts 1-5' }
      },
      '10': {
        w5: { opp: 'Good Ol\' Boys (Team 7)', time: '5:30 PM', courts: 'Courts 6-9' },
        w10: { opp: 'Rascals (Team 6)', time: '7:00 PM', courts: 'Courts 1-5' }
      },
      '11': {
        w5: { opp: 'Rascals (Team 6)', time: '5:30 PM', courts: 'Courts 1-5' },
        w10: { opp: 'Racquet Scientists (Team 5)', time: '7:00 PM', courts: 'Courts 6-9' }
      },
      '12': {
        w5: { opp: 'Racquet Scientists (Team 5)', time: '7:00 PM', courts: 'Courts 1-5' },
        w10: { opp: 'Approach Shots (Team 4)', time: '7:00 PM', courts: 'Courts 10-13' }
      }
    };

    var matchData = tuesdayMatchLookup[teamNumStr];
    var matchInfoHtml = '';
    if (matchData) {
      matchInfoHtml = 
        '<div style="background-color: #ffffff; border: 1px solid #ffcdd2; padding: 12px; border-radius: 6px; margin: 15px 0 10px 0;">' +
        '<p style="margin: 0 0 8px 0; font-weight: bold; color: #b71c1c;">Your Correct Match Details:</p>' +
        '<table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">' +
        '<thead>' +
        '<tr style="border-bottom: 1px solid #ffcdd2; color: #757575;">' +
        '<th style="padding: 4px 8px;">Week / Date</th>' +
        '<th style="padding: 4px 8px;">Opponent</th>' +
        '<th style="padding: 4px 8px;">Time</th>' +
        '<th style="padding: 4px 8px;">Courts</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '<tr style="border-bottom: 1px solid #ffebee;">' +
        '<td style="padding: 6px 8px;"><strong>Week 5</strong> (June 23)</td>' +
        '<td style="padding: 6px 8px;">' + matchData.w5.opp + '</td>' +
        '<td style="padding: 6px 8px;">' + matchData.w5.time + '</td>' +
        '<td style="padding: 6px 8px;">' + matchData.w5.courts + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td style="padding: 6px 8px;"><strong>Week 10</strong> (July 28)</td>' +
        '<td style="padding: 6px 8px;">' + matchData.w10.opp + '</td>' +
        '<td style="padding: 6px 8px;">' + matchData.w10.time + '</td>' +
        '<td style="padding: 6px 8px;">' + matchData.w10.courts + '</td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>';
    }

    var icsLink = 'https://couleeregiontennis.org/teams/tuesday/ics/' + teamNumStr + '/team.ics?v=2026.8';

    scheduleNoticeHtml = 
      '<div style="background-color: #ffebee; border-left: 5px solid #d32f2f; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">' +
      '<h3 style="margin-top: 0; color: #c62828;">' + warningIcon + ' Important: Tuesday Schedule Swap</h3>' +
      '<p style="margin: 0 0 10px 0;">Due to a schedule conflict, the Tuesday night match schedules for <strong>Week 5 (June 23rd)</strong> and <strong>Week 10 (July 28th)</strong> have been swapped to ensure correct matchups.</p>' +
      '<p style="margin: 0 0 12px 0; font-size: 13px; color: #555555; line-height: 1.5;"><em><strong>Note on Calendars:</strong> If you imported the team calendar (.ics file) or printed/saved your schedule when the website had the incorrect schedule (between May 23rd and June 21st), your calendar will show the incorrect match times. Please download the updated calendar file below (or check the website) to ensure you have the correct match times and courts.</em></p>' +
      matchInfoHtml +
      '<p style="margin: 10px 0 0 0; font-size: 13px;">' +
      '<a href="' + icsLink + '" target="_blank" style="color: #c62828; font-weight: bold; text-decoration: underline;">' +
      '&#128229; Download Updated Calendar (.ics File) for Team ' + teamNumStr +
      '</a>' +
      '</p>' +
      '</div>';
  }

  return '<div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6; max-width: 650px; margin: 0 auto; border: 1px solid #eeeeee; border-radius: 8px; overflow: hidden; background-color: #ffffff;">' +
    '<div style="background-color: #1b5e20; color: #ffffff; padding: 20px; text-align: center;">' +
    '<h1 style="margin: 0; font-size: 24px;">LTTA Rules, Scoring, & Fees Update ' + racketIcon + '</h1>' +
    '</div>' +
    '<div style="padding: 20px 30px;">' +
    '<p>Hello ' + escapeHTML(team.teamName) + ' players,</p>' +
    '<p>We hope everyone is enjoying the start of the 2026 La Crosse Team Tennis Association (LTTA) summer season! To keep our league running smoothly, fair, and fun for everyone, we want to share some important reminders regarding weather rules, match scoring, and league fees.</p>' +
    scheduleNoticeHtml +

    '<h2 style="color: #1b5e20; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + sunIcon + ' Weather & Play Cancellation Rules</h2>' +
    '<p>Weather in Wisconsin can be unpredictable. Here is how cancellations and heat rules work:</p>' +
    '<ul style="padding-left: 20px;">' +
    '<li style="margin-bottom: 10px;"><strong>Cancellations:</strong> The LTTA Committee will make any cancellation decision (for rain, storms, or heat) by <strong>4:30 PM</strong> on match day. Captains will be notified directly.</li>' +
    '<li style="margin-bottom: 10px;"><strong>Heat Rule ("RealFeel"):</strong> We monitor the "RealFeel" temperature on <a href="https://www.accuweather.com" target="_blank" style="color: #2e7d32;">accuweather.com</a>:' +
    '<ul>' +
    '<li><strong>Above 95&deg;F:</strong> Matches may start at 2-2 in each set (optional, if both captains agree or coordinator directs).</li>' +
    '<li><strong>Over 104&deg;F:</strong> Play is automatically canceled.</li>' +
    '</ul>' +
    '</li>' +
    '<li style="margin-bottom: 10px;"><strong style="color: #d32f2f;">' + warningIcon + ' Weather Cancellations / Rainouts:</strong> If play is officially canceled by the league due to weather, <strong>no match results are recorded</strong> (meaning this missed day will not count against your team in the standings). While players are welcome to use the courts for practice hits at their own discretion, any sets played will be completely unofficial and will not count toward league standings.</li>' +
    '</ul>' +

    '<h2 style="color: #1b5e20; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + trophyIcon + ' How Scoring Works</h2>' +
    '<p>A quick refresher on how league standings points are calculated for each line:</p>' +
    '<ul style="padding-left: 20px;">' +
    '<li style="margin-bottom: 10px;"><strong>Set Points:</strong> You earn <strong>1 point for each set won</strong> (including third-set tiebreakers).</li>' +
    '<li style="margin-bottom: 10px;"><strong>Participation Point:</strong> You earn <strong>1 point for participation</strong> (showing up on time, lost only in the case of a forfeit/default).</li>' +
    '<li style="margin-bottom: 10px;"><strong>Match Format:</strong> We play best-of-three sets using <strong>No-Ad scoring</strong> (at deuce, the receiving team chooses the side, and the next point wins the game).</li>' +
    '<li style="margin-bottom: 10px;"><strong>Example Totals:</strong>' +
    '<ul>' +
    '<li>A 2-0 set victory gives the winner <strong>3 points</strong> (2 sets + 1 participation) and the loser <strong>1 point</strong> (0 sets + 1 participation).</li>' +
    '<li>A 2-1 set victory gives the winner <strong>3 points</strong> (2 sets + 1 participation) and the loser <strong>2 points</strong> (1 set + 1 participation).</li>' +
    '<li>In the event of a <strong>forfeit/default</strong>, the winning team gets <strong>3 points</strong> and the defaulting team gets <strong>0 points</strong>.</li>' +
    '</ul>' +
    '</li>' +
    '</ul>' +

    '<div style="background-color: #fff3e0; border-left: 5px solid #ef6c00; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">' +
    '<h3 style="margin-top: 0; color: #ef6c00;">' + warningIcon + ' Players: Record Your Line\'s Scores & Points!</h3>' +
    '<p>When completing the paper scoresheet at the end of your match, <strong>the players on each individual line are responsible for writing down both their set scores AND the calculated league points.</strong></p>' +
    '<p>For example, instead of just writing the set scores (e.g. <code>6-3, 6-4</code> or <code>6-4, 3-6, 10-7</code>), you must also write the final points (e.g., <code>Home: 3 pts, Away: 1 pt</code> or <code>Home: 3 pts, Away: 2 pts</code>) for your line, along with the total team points at the bottom.</p>' +
    '<p>Without the points explicitly written down, it is not clear which team won the match/tiebreaker or if participation points are correctly applied, making it difficult for the League Coordinator to input accurate standings. Please double-check this before signing off on the sheet!</p>' +
    '</div>' +

    '<h2 style="color: #1b5e20; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + moneyIcon + ' League Fees ($25) Overdue</h2>' +
    '<p>If you have not already paid, please get your <strong>$25 league fee</strong> to your team captain as soon as possible. Dues are now <strong>overdue</strong> (deadline was the second week of play).</p>' +
    '<p>These dues are vital as they cover the cost of league tennis balls and court reservations. Captains, please collect these fees from your players and turn them in to the LTTA Committee at the courts.</p>' +

    '<p style="margin-top: 30px;">If you have any questions about these rules or scoring, please read the full rules on our website at <a href="https://couleeregiontennis.org/pages/ltta-rules.html" target="_blank" style="color: #2e7d32;">couleeregiontennis.org/pages/ltta-rules.html</a> or reach out to your Night Coordinator.</p>' +
    '<p>Thank you for your cooperation, and good luck with your matches!</p>' +

    '<p style="margin-top: 30px;">Best regards,<br><strong>The LTTA League Committee</strong></p>' +
    '</div>' +
    '<div style="background-color: #f9f9f9; text-align: center; padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee;">' +
    'La Crosse Team Tennis Association (LTTA)<br>Coulee Region Tennis Association (CRTA)' +
    '</div>' +
    '</div>';
}

function main() {
  const mockTeam = {
    night: 'Tuesday',
    teamNumber: '2',
    teamName: 'Subs',
    emails: ['test@example.com'],
    captain: 'Al Graewin',
    coCaptain: 'Jane Doe'
  };

  const html = generateEmailHtml(mockTeam);
  const outputPath = path.join(__dirname, 'preview_rules_email.html');
  
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Generated preview HTML at: ${outputPath}`);

  // Open the file in the browser
  exec(`open "${outputPath}"`, (err) => {
    if (err) {
      console.error(`Failed to open preview: ${err.message}`);
    } else {
      console.log('Opened preview in browser.');
    }
  });
}

main();
