import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../scripts/supabaseClient';

/**
 * Custom hook for fetching and managing team statistics data
 * Handles authentication, data fetching, and processing for team stats
 */
export const useTeamStatsData = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState('');

  const [teamRecord, setTeamRecord] = useState({ wins: 0, losses: 0 });
  const [teamLineStats, setTeamLineStats] = useState({ linesWon: 0, linesLost: 0, gamesWon: 0, gamesLost: 0 });
  const [recentMatches, setRecentMatches] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);

  /**
   * Loads the team roster for a given team ID
   * @param {string} teamId - Team ID from database
   * @returns {Promise<Array>} - Array of player objects
   */
  const loadTeamRoster = useCallback(async (teamId) => {
    try {
      const { data: teamPlayers, error: rosterError } = await supabase
        .from('player_to_team')
        .select(`
          player:player(
            id,
            first_name,
            last_name,
            email,
            ranking,
            is_captain
          )
        `)
        .eq('team', teamId);

      if (rosterError) {
        console.error('Supabase roster error:', rosterError);
        throw new Error(`Failed to load team roster: ${rosterError.message}`);
      }

      const rosterData = (Array.isArray(teamPlayers) ? teamPlayers : []).map((tp) => tp.player);
      setRoster(rosterData);
      return rosterData;
    } catch (err) {
      console.error('Error loading roster:', err);
      setError(prev => prev ? `${prev}\nRoster error: ${err.message}` : `Roster error: ${err.message}`);
      return [];
    }
  }, []);

  /**
   * Fetches all matches for a team number
   * @param {number} teamNumber - Team number
   * @returns {Promise<Array>} - Array of match objects
   */
  const fetchTeamMatches = useCallback(async (teamNumber) => {
    if (!teamNumber) {
      console.warn('No team number provided for match fetching');
      return [];
    }

    try {
      const { data, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`home_team_number.eq.${teamNumber},away_team_number.eq.${teamNumber}`)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (matchesError) {
        console.error('Supabase matches error:', matchesError);
        throw new Error(`Failed to fetch matches: ${matchesError.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching team matches:', err);
      setError(prev => prev ? `${prev}\nMatches error: ${err.message}` : `Matches error: ${err.message}`);
      return [];
    }
  }, []);

  /**
   * Fetches match scores for given match IDs
   * @param {Array} matchIds - Array of match IDs
   * @returns {Promise<Array>} - Array of score objects
   */
  const fetchMatchScores = useCallback(async (matchIds) => {
    if (!matchIds || matchIds.length === 0) {
      return [];
    }

    try {
      const { data, error: scoresError } = await supabase
        .from('match_scores')
        .select('match_id, home_lines_won, away_lines_won, home_total_games, away_total_games, home_won')
        .in('match_id', matchIds);

      if (scoresError) {
        console.error('Supabase scores error:', scoresError);
        throw new Error(`Failed to fetch match scores: ${scoresError.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching match scores:', err);
      setError(prev => prev ? `${prev}\nScores error: ${err.message}` : `Scores error: ${err.message}`);
      return [];
    }
  }, []);

  /**
   * Fetches line results for given match IDs
   * @param {Array} matchIds - Array of match IDs
   * @returns {Promise<Array>} - Array of line result objects
   */
  const fetchLineResults = useCallback(async (matchIds) => {
    if (!matchIds || matchIds.length === 0) {
      return [];
    }

    try {
      const { data, error: linesError } = await supabase
        .from('line_results')
        .select('match_id, match_type, home_player_1_id, home_player_2_id, away_player_1_id, away_player_2_id, home_set_1, away_set_1, home_set_2, away_set_2, home_set_3, away_set_3, home_won')
        .in('match_id', matchIds);

      if (linesError) {
        console.error('Supabase line results error:', linesError);
        throw new Error(`Failed to fetch line results: ${linesError.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching line results:', err);
      setError(prev => prev ? `${prev}\nLine results error: ${err.message}` : `Line results error: ${err.message}`);
      return [];
    }
  }, []);

  /**
   * Calculates team record from match scores
   * @param {Array} matches - Array of match objects
   * @param {Array} matchScores - Array of score objects
   * @param {number} teamNumber - Current team number
   */
  const loadTeamRecordFromScores = useCallback((matches, matchScores, teamNumber) => {
    if (!matches || !matchScores || !teamNumber) {
      console.warn('Invalid parameters for team record calculation');
      return;
    }

    const scoreMap = new Map(matchScores.map((score) => [score.match_id, score]));

    let wins = 0;
    let losses = 0;

    matches.forEach((match) => {
      const score = scoreMap.get(match.id);
      if (!score) {
        console.warn(`No score found for match ${match.id}`);
        return;
      }

      const isHome = match.home_team_number === teamNumber;

      let teamWon;
      if (typeof score.home_won === 'boolean') {
        teamWon = isHome ? score.home_won : !score.home_won;
      } else {
        const teamLines = isHome ? (score.home_lines_won ?? 0) : (score.away_lines_won ?? 0);
        const oppLines = isHome ? (score.away_lines_won ?? 0) : (score.home_lines_won ?? 0);
        if (teamLines === oppLines) {
          console.warn(`Tie game detected for match ${match.id}, not counting in record`);
          return;
        }
        teamWon = teamLines > oppLines;
      }

      if (teamWon) wins += 1;
      else losses += 1;
    });

    setTeamRecord({ wins, losses });
  }, []);

  /**
   * Calculates team line statistics from match scores
   * @param {Array} matchScores - Array of score objects
   * @param {Array} matches - Array of match objects
   * @param {number} teamNumber - Current team number
   */
  const loadTeamLineStatsFromScores = useCallback((matchScores, matches, teamNumber) => {
    if (!matchScores || !matches || !teamNumber) {
      console.warn('Invalid parameters for team line stats calculation');
      return;
    }

    const matchMap = new Map(matches.map((match) => [match.id, match]));

    let linesWon = 0;
    let linesLost = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    matchScores.forEach((score) => {
      const match = matchMap.get(score.match_id);
      if (!match) {
        console.warn(`No match found for score ${score.match_id}`);
        return;
      }

      const isHome = match.home_team_number === teamNumber;

      if (isHome) {
        linesWon += score.home_lines_won || 0;
        linesLost += score.away_lines_won || 0;
        gamesWon += score.home_total_games || 0;
        gamesLost += score.away_total_games || 0;
      } else {
        linesWon += score.away_lines_won || 0;
        linesLost += score.home_lines_won || 0;
        gamesWon += score.away_total_games || 0;
        gamesLost += score.home_total_games || 0;
      }
    });

    setTeamLineStats({ linesWon, linesLost, gamesWon, gamesLost });
  }, []);

  /**
   * Processes recent matches with score data
   * @param {Array} matches - Array of match objects
   * @param {Array} matchScores - Array of score objects
   * @param {number} teamNumber - Current team number
   */
  const loadRecentMatchesFromList = useCallback((matches, matchScores, teamNumber) => {
    if (!matches || !matchScores || !teamNumber) {
      console.warn('Invalid parameters for recent matches processing');
      return;
    }

    const scoreMap = new Map(matchScores.map((score) => [score.match_id, score]));
    const recent = matches.slice(0, 10).map((match) => {
      const score = scoreMap.get(match.id);

      let teamLines = null;
      let opponentLines = null;
      let teamGames = null;
      let opponentGames = null;
      let teamWon = null;

      if (score) {
        const isHome = match.home_team_number === teamNumber;
        teamLines = isHome ? score.home_lines_won ?? null : score.away_lines_won ?? null;
        opponentLines = isHome ? score.away_lines_won ?? null : score.home_lines_won ?? null;
        teamGames = isHome ? score.home_total_games ?? null : score.away_total_games ?? null;
        opponentGames = isHome ? score.away_total_games ?? null : score.home_total_games ?? null;

        if (typeof score.home_won === 'boolean') {
          teamWon = isHome ? score.home_won : !score.home_won;
        } else if (teamLines !== null && opponentLines !== null && teamLines !== opponentLines) {
          teamWon = teamLines > opponentLines;
        } else if (teamGames !== null && opponentGames !== null && teamGames !== opponentGames) {
          teamWon = teamGames > opponentGames;
        }
      }

      return {
        ...match,
        teamLines,
        opponentLines,
        teamGames,
        opponentGames,
        teamWon
      };
    });

    setRecentMatches(recent);
  }, []);

  /**
   * Calculates player statistics from line results
   * @param {Array} rosterData - Team roster
   * @param {Array} matches - Array of match objects
   * @param {Array} lineResults - Array of line result objects
   * @param {number} teamNumber - Current team number
   */
  const loadPlayerStatsFromLines = useCallback((rosterData, matches, lineResults, teamNumber) => {
    if (!rosterData || !matches || !lineResults || !teamNumber) {
      console.warn('Invalid parameters for player stats calculation');
      return;
    }

    const matchMap = new Map(matches.map((match) => [match.id, match]));
    const playerStatsMap = new Map();

    // Initialize player stats
    rosterData.forEach((player) => {
      playerStatsMap.set(player.id, {
        ...player,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        singlesRecord: { wins: 0, losses: 0 },
        doublesRecord: { wins: 0, losses: 0 }
      });
    });

    // Process line results
    lineResults.forEach((line) => {
      const match = matchMap.get(line.match_id);
      if (!match) {
        console.warn(`No match found for line result ${line.match_id}`);
        return;
      }

      const isHomeTeam = match.home_team_number === teamNumber;
      const playerIds = [];

      // Get player IDs based on team side
      if (isHomeTeam) {
        if (line.home_player_1_id) playerIds.push(line.home_player_1_id);
        if (line.home_player_2_id) playerIds.push(line.home_player_2_id);
      } else {
        if (line.away_player_1_id) playerIds.push(line.away_player_1_id);
        if (line.away_player_2_id) playerIds.push(line.away_player_2_id);
      }

      // Process set results
      const sets = [
        { home: line.home_set_1, away: line.away_set_1 },
        { home: line.home_set_2, away: line.away_set_2 },
        { home: line.home_set_3, away: line.away_set_3 }
      ].filter((set) => 
        set.home !== null && set.home !== undefined && 
        set.away !== null && set.away !== undefined
      );

      let setsWon = 0;
      let setsLost = 0;
      let gamesWon = 0;
      let gamesLost = 0;

      sets.forEach((set) => {
        if (isHomeTeam) {
          gamesWon += set.home || 0;
          gamesLost += set.away || 0;
          if ((set.home || 0) > (set.away || 0)) setsWon++;
          else setsLost++;
        } else {
          gamesWon += set.away || 0;
          gamesLost += set.home || 0;
          if ((set.away || 0) > (set.home || 0)) setsWon++;
          else setsLost++;
        }
      });

      // Determine winner
      let teamWon;
      if (typeof line.home_won === 'boolean') {
        teamWon = isHomeTeam ? line.home_won : !line.home_won;
      } else if (gamesWon !== gamesLost) {
        teamWon = gamesWon > gamesLost;
      } else {
        teamWon = setsWon > setsLost;
      }

      // Update player stats
      playerIds.forEach((playerId) => {
        const stats = playerStatsMap.get(playerId);
        if (!stats) {
          console.warn(`Player ${playerId} not found in roster for stats update`);
          return;
        }

        stats.matchesPlayed += 1;
        stats.setsWon += setsWon;
        stats.setsLost += setsLost;
        stats.gamesWon += gamesWon;
        stats.gamesLost += gamesLost;

        if (teamWon) stats.wins += 1;
        else stats.losses += 1;

        if (line.match_type === 'singles') {
          if (teamWon) stats.singlesRecord.wins += 1;
          else stats.singlesRecord.losses += 1;
        } else {
          if (teamWon) stats.doublesRecord.wins += 1;
          else stats.doublesRecord.losses += 1;
        }
      });
    });

    setPlayerStats(Array.from(playerStatsMap.values()));
  }, []);

  /**
   * Main data loading function that orchestrates all data fetching
   */
  const loadTeamStatsData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Get authenticated user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('Not authenticated. Please log in to view team statistics.');
      }

      setUser(currentUser);

      // Verify user is a captain
      const { data: playerData, error: playerError } = await supabase
        .from('player')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (playerError) {
        console.error('Supabase player error:', playerError);
        throw new Error(`Failed to load player data: ${playerError.message}`);
      }

      if (!playerData) {
        throw new Error('Player profile not found for this user.');
      }

      if (!playerData.is_captain) {
        throw new Error('Access denied: Captain privileges required to view team statistics.');
      }

      // Get team link
      const { data: teamLink, error: teamLinkError } = await supabase
        .from('player_to_team')
        .select('team')
        .eq('player', currentUser.id)
        .single();

      if (teamLinkError) {
        console.error('Supabase team link error:', teamLinkError);
        throw new Error(`Failed to load team assignment: ${teamLinkError.message}`);
      }

      // Get team details
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('*')
        .eq('id', teamLink.team)
        .single();

      if (teamError) {
        console.error('Supabase team error:', teamError);
        throw new Error(`Failed to load team data: ${teamError.message}`);
      }

      setTeam(teamData);

      // Load all data in parallel where possible
      const [rosterData, matches] = await Promise.all([
        loadTeamRoster(teamData.id),
        fetchTeamMatches(teamData.number)
      ]);

      const matchIds = matches.map((match) => match.id);

      // Fetch scores and line results in parallel
      const [matchScores, lineResults] = await Promise.all([
        fetchMatchScores(matchIds),
        fetchLineResults(matchIds)
      ]);

      // Process all stats
      loadTeamRecordFromScores(matches, matchScores, teamData.number);
      loadTeamLineStatsFromScores(matchScores, matches, teamData.number);
      loadRecentMatchesFromList(matches, matchScores, teamData.number);
      loadPlayerStatsFromLines(rosterData, matches, lineResults, teamData.number);

    } catch (err) {
      console.error('Error loading team stats data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    loadTeamRoster,
    fetchTeamMatches,
    fetchMatchScores,
    fetchLineResults,
    loadTeamRecordFromScores,
    loadTeamLineStatsFromScores,
    loadRecentMatchesFromList,
    loadPlayerStatsFromLines
  ]);

  // Auto-refresh data on mount
  useEffect(() => {
    loadTeamStatsData();
  }, [loadTeamStatsData]);

  // Calculate win percentages
  const winPercentage = useMemo(() => {
    const total = teamRecord.wins + teamRecord.losses;
    if (total === 0) return '0.0';
    return ((teamRecord.wins / total) * 100).toFixed(1);
  }, [teamRecord.wins, teamRecord.losses]);

  const lineWinPercentage = useMemo(() => {
    const total = teamLineStats.linesWon + teamLineStats.linesLost;
    if (total === 0) return '0.0';
    return ((teamLineStats.linesWon / total) * 100).toFixed(1);
  }, [teamLineStats.linesWon, teamLineStats.linesLost]);

  const gamesWinPercentage = useMemo(() => {
    const total = teamLineStats.gamesWon + teamLineStats.gamesLost;
    if (total === 0) return '0.0';
    return ((teamLineStats.gamesWon / total) * 100).toFixed(1);
  }, [teamLineStats.gamesWon, teamLineStats.gamesLost]);

  return {
    loading,
    error,
    user,
    team,
    roster,
    teamRecord,
    teamLineStats,
    recentMatches,
    playerStats,
    winPercentage,
    lineWinPercentage,
    gamesWinPercentage,
    refresh: loadTeamStatsData
  };
};
