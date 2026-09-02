const fs = require('fs');
const path = require('path');

function generatePicnicHtml() {
  var trophyIcon = '&#127942;';
  var picnicIcon = '&#129369;';
  var tennisIcon = '&#127934;';

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Picnic Email Preview</title></head><body style="background:#f4f4f4; padding: 20px;">' +
      '<div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6; max-width: 650px; margin: 0 auto; border: 1px solid #eeeeee; border-radius: 8px; overflow: hidden; background-color: #ffffff;">' +
      '<div style="background-color: #2e7d32; color: #ffffff; padding: 20px; text-align: center;">' +
        '<h1 style="margin: 0; font-size: 24px;">End-of-Season Picnic & Playoff Night! ' + picnicIcon + '</h1>' +
      '</div>' +
      '<div style="padding: 20px 30px;">' +
        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 10px;">' + trophyIcon + ' Current Standings & Top Teams</h2>' +
        '<p>Check the website (<a href="https://couleeregiontennis.org" style="color: #2e7d32; font-weight: bold;">couleeregiontennis.org</a>) for full updated standings!</p>' +
        '<ul style="padding-left: 20px;">' +
          '<li style="margin-bottom: 5px;"><strong>Tuesday Night Top Teams:</strong> #1 Spin Doctors, #2 Bounce It / Jetsetters</li>' +
          '<li style="margin-bottom: 5px;"><strong>Wednesday Night Top Teams:</strong> #1 Backhand Bandits, #2 Not My Fault</li>' +
        '</ul>' +

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + tennisIcon + ' New 2-Match Playoff Format</h2>' +
        '<p>This season, the playoff night has expanded into an exciting <strong>2-Match Crossover Tournament</strong> featuring the top 2 teams from Tuesday and Wednesday night!</p>' +

        '<div style="background-color: #f4fbf7; border: 2px dashed #2e7d32; border-radius: 8px; padding: 18px; margin: 20px 0;">' +
          '<h3 style="margin-top: 0; text-align: center; color: #1b5e20; font-size: 16px;">' + trophyIcon + ' Picnic Night Playoff Bracket</h3>' +
          '<table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-top: 10px; text-align: center; font-size: 13px;">' +
            '<tr>' +
              '<td style="background: #ffffff; border: 1px solid #a5d6a7; border-radius: 6px; padding: 10px; width: 48%; vertical-align: top;">' +
                '<div style="font-weight: bold; color: #2e7d32; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 6px;">ROUND 1: SEMI-FINALS</div>' +
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

        '<h2 style="color: #2e7d32; border-bottom: 1px solid #eeeeee; padding-bottom: 5px; margin-top: 30px;">' + picnicIcon + ' Picnic & Event Details</h2>' +
        '<p style="margin-bottom: 5px;"><strong>Date:</strong> Wednesday, August 12th at 5:30 PM</p>' +
        '<p style="margin-top: 0;"><strong>Location:</strong> Green Island Park</p>' +

        '<p>As usual, food and drinks are organized by last year\'s top playoff teams:</p>' +
        '<ul style="padding-left: 20px;">' +
          '<li style="margin-bottom: 5px;"><strong>Spin Doctors</strong> will handle food arrangements</li>' +
          '<li style="margin-bottom: 5px;"><strong>Not My Fault</strong> will provide drinks</li>' +
        '</ul>' +

        '<div style="background-color: #e8f5e9; border-left: 5px solid #2e7d32; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;">' +
          '<h3 style="margin-top: 0; color: #2e7d32;">Important Reminders</h3>' +
          '<ol style="padding-left: 20px; margin-bottom: 0;">' +
            '<li style="margin-bottom: 8px;"><strong>Friends & Family:</strong> Friends and family are welcome to join! If you plan on bringing a large group, please let us know in advance.</li>' +
            '<li style="margin-bottom: 8px;"><strong>Lawn Chairs:</strong> Everyone - please bring your own lawn chairs!</li>' +
            '<li style="margin-bottom: 8px;"><strong>Feedback:</strong> Players - start thinking of feedback and ideas for next season to share with your captains.</li>' +
            '<li style="margin-bottom: 0;"><strong>Donations:</strong> Welcome but not required.</li>' +
          '</ol>' +
        '</div>' +

        '<p>Winningest lines will also be featured and invited to participate in crossover exhibition play alongside the championship matches!</p>' +

        '<p style="margin-top: 30px;">Let us know if you have any questions.<br>Thanks!<br><strong>The LTTA League Committee</strong></p>' +
      '</div>' +
      '<div style="background-color: #f9f9f9; text-align: center; padding: 15px; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee;">' +
        'La Crosse Team Tennis Association (LTTA)' +
      '</div>' +
    '</div></body></html>';
}

const outPath = path.join(__dirname, '../pages/picnic-email-preview.html');
fs.writeFileSync(outPath, generatePicnicHtml());
console.log('Saved preview to', outPath);
