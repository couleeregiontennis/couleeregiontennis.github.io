import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Configuration
const COURT_GROUPS = ['Courts 1–5', 'Courts 6–9', 'Courts 10–13'];
const TIMES = ['5:30pm', '7:00pm'];

// Enable CORS
Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Check user permissions - must be a captain or admin
    const { data: playerData, error: playerError } = await supabaseClient
      .from('player')
      .select('is_captain')
      .eq('id', user.id)
      .single();

    if (playerError || !playerData?.is_captain) {
      throw new Error('Insufficient permissions. Must be a captain or admin.');
    }

    // Parse request body
    const { year, night, startDate, teamIds, seed, preview = false, replaceIfExists = false } = await req.json();

    // Validate input
    if (!year || !night || !startDate || !teamIds || !Array.isArray(teamIds) || teamIds.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Fetch team details
    const { data: teamsData, error: teamsError } = await supabaseClient
      .from('team')
      .select('id, number, name, play_night')
      .in('id', teamIds);

    if (teamsError || !teamsData) {
      throw new Error('Failed to fetch team data');
    }

    if (teamsData.length < 2) {
      throw new Error('At least 2 valid teams are required');
    }

    // Check if schedule already exists for the specified year and night
    const { data: existingMatches, error: existingError } = await supabaseClient
      .from('team_match')
      .select('id')
      .eq('play_night', night.toLowerCase())
      .gte('date', `${year}-01-01`)
      .lt('date', `${year + 1}-01-01`);

    if (existingError) {
      throw new Error('Failed to check existing schedules');
    }

    if (existingMatches.length > 0 && !replaceIfExists && !preview) {
      return new Response(
        JSON.stringify({
          error: 'Schedule already exists for this year and night. Set replaceIfExists to true to replace it.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        }
      );
    }

    // Generate the schedule using the round-robin algorithm
    const schedule = generateRoundRobinSchedule(teamsData, startDate, seed);

    // In preview mode, just return the generated schedule
    if (preview) {
      return new Response(
        JSON.stringify({
          year,
          night: night.toLowerCase(),
          matches: schedule.matches,
          teams: teamsData,
          weeks: schedule.weeks,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Save to database (with transaction-like behavior)
    if (!preview) {
      // If replaceIfExists is set, delete existing matches for this year/night
      if (replaceIfExists && existingMatches.length > 0) {
        const { error: deleteError } = await supabaseClient
          .from('team_match')
          .delete()
          .eq('play_night', night.toLowerCase())
          .gte('date', `${year}-01-01`)
          .lt('date', `${year + 1}-01-01`);

        if (deleteError) {
          throw new Error('Failed to delete existing schedule');
        }
      }

      // Insert the new schedule
      const matchesToInsert = schedule.matches.map(match => ({
        play_night: night.toLowerCase(),
        week: match.week,
        date: match.date,
        time: match.time,
        court: match.court,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        home_team_number: match.home_team_number,
        home_team_name: match.home_team_name,
        away_team_number: match.away_team_number,
        away_team_name: match.away_team_name,
      }));

      const { error: insertError } = await supabaseClient
        .from('team_match')
        .insert(matchesToInsert);

      if (insertError) {
        throw new Error('Failed to insert schedule: ' + insertError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schedule generated successfully',
        year,
        night: night.toLowerCase(),
        matchesCreated: schedule.matches.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-schedule:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Round-robin scheduling algorithm
function generateRoundRobinSchedule(teams: any[], startDate: string, seed?: string) {
  const shuffledTeams = seedrandomShuffle(teams, seed || '2025');

  // Add null for odd number of teams (bye matches)
  if (shuffledTeams.length % 2 === 1) {
    shuffledTeams.push(null);
  }

  const rounds = shuffledTeams.length - 1;
  const half = shuffledTeams.length / 2;
  const roundsData = [];

  // Track court and time usage for balancing
  const teamCourtUsage: Record<string, any> = {};
  const teamTimeUsage: Record<string, any> = {};

  for (let round = 0; round < rounds; round++) {
    const matches = [];

    for (let i = 0; i < half; i++) {
      const home = shuffledTeams[i];
      const away = shuffledTeams[shuffledTeams.length - 1 - i];

      if (home && away) {
        matches.push({ home, away });
      }
    }

    roundsData.push({
      week: round + 1,
      matches,
      date: addDays(startDate, round * 7)
    });

    // Rotate teams (keep first team fixed)
    const fixed = shuffledTeams[0];
    const rest = shuffledTeams.slice(1);
    rest.unshift(rest.pop()!);
    shuffledTeams.splice(0, shuffledTeams.length, fixed, ...rest);
  }

  // Assign courts and time slots with balancing
  return assignSlots(roundsData, teamCourtUsage, teamTimeUsage);
}

function assignSlots(rounds: any[], teamCourtUsage: Record<string, any>, teamTimeUsage: Record<string, any>) {
  const slots = COURT_GROUPS.flatMap(court =>
    TIMES.map(time => ({ court, time }))
  );

  const allMatches = [];

  rounds.forEach((round, weekIdx) => {
    if (round.matches.length > slots.length) {
      throw new Error(`Week ${weekIdx + 1} requires ${round.matches.length} slots but only ${slots.length} are configured`);
    }

    // For small leagues, use different court assignment strategy
    const isSmallLeague = rounds.length <= 2;

    round.matches.forEach((match, matchIdx) => {
      // Find the best slot based on team usage history
      let bestSlot = null;
      let bestScore = Infinity;

      // Try each slot and calculate a "balance score"
      slots.forEach((slot) => {
        const courtUsage = [match.home.id, match.away.id].reduce((total, teamId) => {
          const usage = teamCourtUsage[teamId]?.[slot.court] || 0;
          return total + usage;
        }, 0);

        const timeUsage = [match.home.id, match.away.id].reduce((total, teamId) => {
          const usage = teamTimeUsage[teamId]?.[slot.time] || 0;
          return total + usage;
        }, 0);

        // For small leagues, prefer slots that haven't been used as much
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

      allMatches.push({
        week: round.week,
        date: round.date,
        time: bestSlot.time,
        court: bestSlot.court,
        home_team_id: match.home.id,
        home_team_number: match.home.number,
        home_team_name: match.home.name,
        away_team_id: match.away.id,
        away_team_number: match.away.number,
        away_team_name: match.away.name,
      });
    });
  });

  return {
    matches: allMatches,
    weeks: rounds.length,
  };
}

function seedrandomShuffle(items: any[], seed: string) {
  // Simple deterministic shuffle without external dependencies
  let seedValue = 0;
  for (let i = 0; i < seed.length; i++) {
    seedValue += seed.charCodeAt(i);
  }

  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    // Pseudo-random based on seed
    seedValue = (seedValue * 9301 + 49297) % 233280;
    const j = Math.floor((seedValue / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}