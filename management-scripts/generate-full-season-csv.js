const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const tuesdaySchedulePath = path.join(rootDir, 'teams', 'tuesday', 'schedules', 'master_schedule.json');
const wednesdaySchedulePath = path.join(rootDir, 'teams', 'wednesday', 'schedules', 'master_schedule.json');

const tuesdaySchedule = JSON.parse(fs.readFileSync(tuesdaySchedulePath, 'utf8'));
const wednesdaySchedule = JSON.parse(fs.readFileSync(wednesdaySchedulePath, 'utf8'));

function getTeams(night) {
  const rosterDir = path.join(rootDir, 'teams', night, 'rosters');
  const files = fs.readdirSync(rosterDir).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(rosterDir, f), 'utf8'));
    return data.teamName;
  });
}

const tuesdayTeams = getTeams('tuesday');
const wednesdayTeams = getTeams('wednesday');

// Generate Scoresheet Direct Entry CSV (1 Row per Physical Paper Scoresheet)
function generateScoresheetEntryCSV(scheduleData, nightName) {
  const rows = [];
  
  // Header row matching paper scoresheet exactly
  rows.push([
    'Night',
    'Week',
    'Date',
    'Time',
    'Courts',
    'Home Team',
    'Away Team',

    // Line 1 (#1/#2)
    'L1 Played (Y/N)',
    'L1 Set 1 H', 'L1 Set 1 A',
    'L1 Set 2 H', 'L1 Set 2 A',
    'L1 TB H',    'L1 TB A',
    'L1 Home Pts', 'L1 Away Pts', 'L1 Pts Avail',

    // Line 2 (#3 Pair A)
    'L2 Played (Y/N)',
    'L2 Set 1 H', 'L2 Set 1 A',
    'L2 Set 2 H', 'L2 Set 2 A',
    'L2 TB H',    'L2 TB A',
    'L2 Home Pts', 'L2 Away Pts', 'L2 Pts Avail',

    // Line 3 (#3 Pair B)
    'L3 Played (Y/N)',
    'L3 Set 1 H', 'L3 Set 1 A',
    'L3 Set 2 H', 'L3 Set 2 A',
    'L3 TB H',    'L3 TB A',
    'L3 Home Pts', 'L3 Away Pts', 'L3 Pts Avail',

    // Line 4 (#4/#5)
    'L4 Played (Y/N)',
    'L4 Set 1 H', 'L4 Set 1 A',
    'L4 Set 2 H', 'L4 Set 2 A',
    'L4 TB H',    'L4 TB A',
    'L4 Home Pts', 'L4 Away Pts', 'L4 Pts Avail',

    // Match Totals
    'MATCH HOME TOTAL PTS',
    'MATCH AWAY TOTAL PTS',
    'MATCH POINTS AVAILABLE'
  ].join(','));

  let currentRowIndex = 2; // Header is row 1

  scheduleData.forEach(match => {
    const r = currentRowIndex;
    const night = nightName;
    const week = match.week;
    const date = match.date;
    const time = match.time;
    const courts = `"${match.courts}"`;
    const homeTeam = `"${match.teamA.name}"`;
    const awayTeam = `"${match.teamB.name}"`;

    // Line 1 columns: H=I, I=J, J=K, K=L, L=M, M=N, N=O, O=P, P=Q
    // Line 2 columns: Q=R, R=S, S=T, T=U, U=V, V=W, W=X, X=Y, Y=Z
    // Line 3 columns: Z=AA, AA=AB, AB=AC, AC=AD, AD=AE, AE=AF, AF=AG, AG=AH, AH=AI
    // Line 4 columns: AI=AJ, AJ=AK, AK=AL, AL=AM, AM=AN, AN=AO, AO=AP, AP=AQ, AQ=AR

    // Helper formulas for line
    function makeLineFormulas(playedCol, s1H, s1A, s2H, s2A, tbH, tbA) {
      const setsH = `(IF(${s1H}${r}="""",0,IF(${s1H}${r}>${s1A}${r},1,0))+IF(${s2H}${r}="""",0,IF(${s2H}${r}>${s2A}${r},1,0))+IF(${tbH}${r}="""",0,IF(${tbH}${r}>${tbA}${r},1,0)))`;
      const setsA = `(IF(${s1A}${r}="""",0,IF(${s1A}${r}>${s1H}${r},1,0))+IF(${s2A}${r}="""",0,IF(${s2A}${r}>${s2H}${r},1,0))+IF(${tbA}${r}="""",0,IF(${tbA}${r}>${tbH}${r},1,0)))`;
      const gamesH = `SUM(${s1H}${r},${s2H}${r},${tbH}${r})`;
      const gamesA = `SUM(${s1A}${r},${s2A}${r},${tbA}${r})`;

      const ptsH = `"=IF(${playedCol}${r}=""Y"", 1, 0) + IF(AND(${setsH}=1, ${setsA}=1, ISBLANK(${tbH}${r}), ISBLANK(${tbA}${r}), ${gamesH}=${gamesA}), 1, IF(AND(${setsH}=1, ${setsA}=1, ISBLANK(${tbH}${r}), ISBLANK(${tbA}${r}), ${gamesH}>${gamesA}), 2, ${setsH}))"`;
      const ptsA = `"=IF(${playedCol}${r}=""Y"", 1, 0) + IF(AND(${setsH}=1, ${setsA}=1, ISBLANK(${tbH}${r}), ISBLANK(${tbA}${r}), ${gamesH}=${gamesA}), 1, IF(AND(${setsH}=1, ${setsA}=1, ISBLANK(${tbH}${r}), ISBLANK(${tbA}${r}), ${gamesA}>${gamesH}), 2, ${setsA}))"`;
      const ptsAvail = `"=IF(${playedCol}${r}<>""Y"", 0, IF(AND(${setsH}=1, ${setsA}=1, ISBLANK(${tbH}${r}), ISBLANK(${tbA}${r}), ${gamesH}=${gamesA}), 2, 3))"`;

      return { ptsH, ptsA, ptsAvail };
    }

    const l1 = makeLineFormulas('H', 'I', 'J', 'K', 'L', 'M', 'N');
    const l2 = makeLineFormulas('Q', 'R', 'S', 'T', 'U', 'V', 'W');
    const l3 = makeLineFormulas('Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF');
    const l4 = makeLineFormulas('AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO');

    // Total formulas for row
    const totalHomePts = `"=SUM(O${r},X${r},AG${r},AP${r})"`;
    const totalAwayPts = `"=SUM(P${r},Y${r},AH${r},AQ${r})"`;
    const totalPtsAvail = `"=SUM(Q${r},Z${r},AI${r},AR${r})"`;

    rows.push([
      night,
      week,
      date,
      time,
      courts,
      homeTeam,
      awayTeam,

      // Line 1
      'Y', '', '', '', '', '', '', l1.ptsH, l1.ptsA, l1.ptsAvail,

      // Line 2
      'Y', '', '', '', '', '', '', l2.ptsH, l2.ptsA, l2.ptsAvail,

      // Line 3
      'Y', '', '', '', '', '', '', l3.ptsH, l3.ptsA, l3.ptsAvail,

      // Line 4
      'Y', '', '', '', '', '', '', l4.ptsH, l4.ptsA, l4.ptsAvail,

      // Totals
      totalHomePts,
      totalAwayPts,
      totalPtsAvail
    ].join(','));

    currentRowIndex++;
  });

  return rows.join('\n');
}

const tuesdayEntryCSV = generateScoresheetEntryCSV(tuesdaySchedule, 'Tuesday');
const wednesdayEntryCSV = generateScoresheetEntryCSV(wednesdaySchedule, 'Wednesday');
const fullMasterEntryCSV = tuesdayEntryCSV + '\n' + wednesdayEntryCSV.split('\n').slice(1).join('\n');

const resourcesDir = path.join(rootDir, 'resources');
if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });

fs.writeFileSync(path.join(resourcesDir, 'ltta_2026_scoresheet_entry_format.csv'), fullMasterEntryCSV);

console.log('Successfully generated ltta_2026_scoresheet_entry_format.csv!');
