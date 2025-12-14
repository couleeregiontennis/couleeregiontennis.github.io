require('dotenv').config();
const seedrandom = require('seedrandom');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// Args Parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getLocationId = () => {
    const arg = args.find(a => !a.startsWith('--'));
    return arg || null;
};
const getArgValue = (key) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : null;
};

const YEAR = parseInt(getArgValue('year') || '2025', 10);
const SEED = getArgValue('seed') || YEAR;
const LOCATION_ID = getLocationId();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const TIMES = ['5:30pm', '7:00pm'];

const getFirstDayOfJune = (year, dayIndex) => {
  const date = new Date(year, 5, 1); // June 1st
  while (date.getDay() !== dayIndex) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
};

const START_DATE_BY_NIGHT = {
  tuesday: getFirstDayOfJune(YEAR, 2),   // 2 is Tuesday
  wednesday: getFirstDayOfJune(YEAR, 3)  // 3 is Wednesday
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const shuffle = (items, seed) => {
  const rng = seedrandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------
const generateRoundRobin = (teams, seed = SEED) => {
  if (teams.length < 2) return [];

  const rotated = shuffle(teams, seed);
  if (rotated.length % 2 === 1) rotated.push(null);

  const rounds = rotated.length - 1;
  const half = rotated.length / 2;
  const schedule = [];

  for (let round = 0; round < rounds; round++) {
    const matches = [];
    for (let i = 0; i < half; i++) {
      const home = rotated[i];
      const away = rotated[rotated.length - 1 - i];
      if (home && away) {
        matches.push({ home, away });
      }
    }
    schedule.push(matches);

    const fixed = rotated[0];
    const rest = rotated.slice(1);
    rest.unshift(rest.pop());
    rotated.splice(0, rotated.length, fixed, ...rest);
  }

  return schedule;
};

const assignSlots = (matchesByWeek, courtGroups) => {
  const slots = courtGroups.flatMap((court) =>
    TIMES.map((time) => ({ court, time }))
  );

  // Track team court and time usage for better distribution
  const teamCourtUsage = {};
  const teamTimeUsage = {};

  return matchesByWeek.map((matches, weekIdx) => {
    if (matches.length > slots.length) {
      throw new Error(
        `Week ${weekIdx + 1} requires ${matches.length} slots but only ${slots.length} are configured`
      );
    }

    // For small number of teams, use different court assignment strategy
    const isSmallLeague = matchesByWeek.length <= 2;

    return matches.map((match, matchIdx) => {
      // Find the best slot based on team usage history
      let bestSlot = null;
      let bestScore = Infinity;

      // Try each slot and calculate a "balance score"
      slots.forEach((slot, slotIdx) => {
        const courtUsage = [match.home.id, match.away.id].reduce((total, teamId) => {
          const usage = teamCourtUsage[teamId]?.[slot.court] || 0;
          return total + usage;
        }, 0);

        const timeUsage = [match.home.id, match.away.id].reduce((total, teamId) => {
          const usage = teamTimeUsage[teamId]?.[slot.time] || 0;
          return total + usage;
        }, 0);

        // For small leagues, prefer slots that haven't been used as much
        // For larger leagues, use alternating pattern with balancing
        const score = isSmallLeague ? courtUsage + timeUsage : courtUsage + timeUsage * 2;

        if (score < bestScore) {
          bestScore = score;
          bestSlot = slot;
        }
      });

      // Use the best slot found, or fall back to rotation pattern
      if (!bestSlot) {
        bestSlot = slots[(matchIdx + weekIdx) % slots.length];
      }

      // Update usage tracking
      [match.home.id, match.away.id].forEach(teamId => {
        if (!teamCourtUsage[teamId]) teamCourtUsage[teamId] = {};
        if (!teamTimeUsage[teamId]) teamTimeUsage[teamId] = {};

        teamCourtUsage[teamId][bestSlot.court] = (teamCourtUsage[teamId][bestSlot.court] || 0) + 1;
        teamTimeUsage[teamId][bestSlot.time] = (teamTimeUsage[teamId][bestSlot.time] || 0) + 1;
      });

      return {
        ...match,
        court: bestSlot.court,
        time: bestSlot.time
      };
    });
  });
};

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------
const fetchTeamsGroupedByNight = async () => {
  const { data, error } = await supabase
    .from('team')
    .select('id, number, name, play_night')
    .order('number');

  if (error) {
    throw new Error(`Failed to load teams: ${error.message}`);
  }

  return (data || []).reduce((acc, team) => {
    if (!team.play_night) return acc;
    const night = team.play_night.toLowerCase();
    acc[night] = acc[night] || [];
    acc[night].push(team);
    return acc;
  }, {});
};

const fetchCourtGroupsForLocation = async (locationId) => {
  // If no locationId provided, fetch from database or use defaults
  if (!locationId) {
    // Try to fetch Green Island as default
    const { data: locationData, error: locationError } = await supabase
      .from('location')
      .select('id')
      .eq('name', 'Green Island Tennis Club')
      .single();

    if (!locationError && locationData) {
      locationId = locationData.id;
    } else {
      // Fallback to default court groups
      return ['Courts 1–5', 'Courts 6–9', 'Courts 10–13'];
    }
  }

  const { data, error } = await supabase
    .from('court_group')
    .select('group_name')
    .eq('location_id', locationId)
    .order('group_name');

  if (error || !data || data.length === 0) {
    throw new Error(`Failed to fetch court groups: ${error ? error.message : 'No court groups found'}`);
  }

  return data.map(g => g.group_name);
};

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------
const buildSchedules = (teamsByNight, locationId) => {
  return Object.entries(teamsByNight).map(([night, teams]) => {
    if (teams.length < 2) {
      return {
        night,
        message: 'Not enough teams to build a schedule',
        matches: []
      };
    }

    const baseDate = START_DATE_BY_NIGHT[night];
    if (!baseDate) {
      throw new Error(`Missing start date configuration for night '${night}'`);
    }

    const roundRobin = generateRoundRobin(teams);
    const scheduledRounds = assignSlots(roundRobin, locationId);

    const matches = [];
    scheduledRounds.forEach((round, roundIdx) => {
      const date = addDays(baseDate, roundIdx * 7);
      round.forEach(({ home, away, court, time }) => {
        matches.push({
          play_night: night,
          week: roundIdx + 1,
          date,
          time,
          court,
          home_team_id: home.id,
          home_team_number: home.number,
          home_team_name: home.name,
          away_team_id: away.id,
          away_team_number: away.number,
          away_team_name: away.name
        });
      });
    });

    return {
      night,
      start_date: baseDate,
      team_count: teams.length,
      matches
    };
  });
};

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
async function main() {
  console.error(`Generating schedule for Year ${YEAR}${LOCATION_ID ? ', Location ' + LOCATION_ID : ''}...`);

  const teamsByNight = await fetchTeamsGroupedByNight();

  // Fetch court groups if location is provided
  let finalCourtGroups = ['Courts 1–5', 'Courts 6–9', 'Courts 10–13'];
  if (LOCATION_ID) {
    try {
      finalCourtGroups = await fetchCourtGroupsForLocation(LOCATION_ID);
      console.error(`Using court groups: ${finalCourtGroups.join(', ')}`);
    } catch (error) {
      console.error(`Warning: ${error.message}. Using default court groups.`);
    }
  }

  const schedules = buildSchedules(teamsByNight, finalCourtGroups);

  console.log(
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        year: YEAR,
        location_id: LOCATION_ID || null,
        court_groups: finalCourtGroups,
        nights: schedules
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
