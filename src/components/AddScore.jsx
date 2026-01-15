import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import { useVoiceScoreInput } from '../hooks/useVoiceScoreInput';
import { LoadingSpinner } from './LoadingSpinner';
import '../styles/AddScore.css';

const STANDARD_SET_MIN_WIN = 6;
// League uses a match tiebreak to 7 (win by 2)
const MATCH_TIEBREAK_TARGET = 7;
const MAX_NOTES_LENGTH = 500;

const parseInteger = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isEmptyValue = (value) => value === null || value === undefined || value === '';

const isStandardSetValid = (home, away) => {
  if (!Number.isInteger(home) || !Number.isInteger(away)) return false;
  if (home < 0 || away < 0) return false;
  if (home === away) return false;

  const winner = Math.max(home, away);
  const loser = Math.min(home, away);

  if (winner < STANDARD_SET_MIN_WIN) return false;
  if (winner === STANDARD_SET_MIN_WIN) {
    return loser <= STANDARD_SET_MIN_WIN - 2;
  }

  if (winner === STANDARD_SET_MIN_WIN + 1) {
    return loser === STANDARD_SET_MIN_WIN - 1 || loser === STANDARD_SET_MIN_WIN;
  }

  return false;
};

/**
 * Validates the score for a match tiebreak.
 *
 * Why: Tiebreaks have specific ending conditions. The first to reach the target (10 points)
 * wins, but they must win by a margin of 2 points. If the score reaches 6-6, play
 * continues until one side leads by 2.
 *
 * How:
 * 1. Checks basic numeric validity (integers, non-negative, no draws).
 * 2. Ensures the winner has reached at least the target score.
 * 3. If the winner matches the target exactly, ensures the margin is >= 2 (e.g., 10-8).
 * 4. If the winner exceeds the target, ensures the margin is exactly 2 (e.g., 12-10).
 *    Scores like 13-10 are invalid because the match would have ended at 12-10.
 */
const isMatchTiebreakValid = (home, away) => {
  if (home === 0 && away === 0) {
    return true; // Not played
  }

  if (!Number.isInteger(home) || !Number.isInteger(away)) return false;
  if (home < 0 || away < 0) return false;
  if (home === away) return false;

  const winner = Math.max(home, away);
  const loser = Math.min(home, away);

  if (winner < MATCH_TIEBREAK_TARGET) return false;

  if (winner === MATCH_TIEBREAK_TARGET) {
    return winner - loser >= 2;
  }

  // If winner > MATCH_TIEBREAK_TARGET, the game must have ended exactly when the margin reached 2.
  return winner - loser === 2;
};

const collectScoreSnapshot = (row) => {
  if (!row) return null;
  return {
    match_id: row.match_id,
    line_number: row.line_number,
    match_type: row.match_type,
    home_player_1_id: row.home_player_1_id ?? null,
    home_player_2_id: row.home_player_2_id ?? null,
    away_player_1_id: row.away_player_1_id ?? null,
    away_player_2_id: row.away_player_2_id ?? null,
    home_set_1: row.home_set_1 ?? null,
    away_set_1: row.away_set_1 ?? null,
    home_set_2: row.home_set_2 ?? null,
    away_set_2: row.away_set_2 ?? null,
    home_set_3: row.home_set_3 ?? null,
    away_set_3: row.away_set_3 ?? null,
    home_won: row.home_won ?? null,
    notes: row.notes ?? ''
  };
};

const arePlayersUnique = (players) => {
  const filtered = players.filter(Boolean);
  const uniqueSet = new Set(filtered.map((name) => name.toLowerCase()));
  return uniqueSet.size === filtered.length;
};

const normalizePlayerSelections = (matchType, players) => {
  if (matchType === 'singles') {
    return [players[0] ?? '', ''];
  }
  return players.map((player) => player ?? '');
};

const buildScorePayload = ({
  matchId,
  lineNumber,
  matchType,
  homeSet1,
  homeSet2,
  homeSet3,
  awaySet1,
  awaySet2,
  awaySet3,
  homePlayers,
  awayPlayers,
  notes
}, playerIdMap, userId, winner) => {
  const home_player_1_id = playerIdMap[homePlayers[0]] || null;
  const home_player_2_id = matchType === 'doubles' ? playerIdMap[homePlayers[1]] || null : null;
  const away_player_1_id = playerIdMap[awayPlayers[0]] || null;
  const away_player_2_id = matchType === 'doubles' ? playerIdMap[awayPlayers[1]] || null : null;

  return {
    match_id: matchId,
    line_number: Number(lineNumber),
    match_type: matchType,
    home_player_1_id,
    home_player_2_id,
    away_player_1_id,
    away_player_2_id,
    home_set_1: parseInteger(homeSet1),
    away_set_1: parseInteger(awaySet1),
    home_set_2: parseInteger(homeSet2),
    away_set_2: parseInteger(awaySet2),
    home_set_3: isEmptyValue(homeSet3) ? null : parseInteger(homeSet3),
    away_set_3: isEmptyValue(awaySet3) ? null : parseInteger(awaySet3),
    home_won: winner === 'home',
    submitted_by: userId,
    notes: notes?.trim() || '',
    submitted_at: new Date().toISOString()
  };
};

const isPayloadUnchanged = (existing, payload) => {
  if (!existing) return false;
  return (
    existing.match_type === payload.match_type &&
    (existing.home_player_1_id ?? null) === payload.home_player_1_id &&
    (existing.home_player_2_id ?? null) === payload.home_player_2_id &&
    (existing.away_player_1_id ?? null) === payload.away_player_1_id &&
    (existing.away_player_2_id ?? null) === payload.away_player_2_id &&
    (existing.home_set_1 ?? null) === payload.home_set_1 &&
    (existing.home_set_2 ?? null) === payload.home_set_2 &&
    (existing.home_set_3 ?? null) === payload.home_set_3 &&
    (existing.away_set_1 ?? null) === payload.away_set_1 &&
    (existing.away_set_2 ?? null) === payload.away_set_2 &&
    (existing.away_set_3 ?? null) === payload.away_set_3 &&
    Boolean(existing.home_won) === Boolean(payload.home_won) &&
    (existing.notes ?? '').trim() === (payload.notes ?? '').trim()
  );
};

export const AddScore = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [homeTeamRoster, setHomeTeamRoster] = useState([]);
  const [awayTeamRoster, setAwayTeamRoster] = useState([]);
  const [playerIdMap, setPlayerIdMap] = useState({});
  const [existingScores, setExistingScores] = useState([]);
  const [formData, setFormData] = useState({
    matchId: '',
    lineNumber: 1,
    matchType: 'doubles',
    homePlayers: ['', ''],
    awayPlayers: ['', ''],
    homeSet1: '',
    awaySet1: '',
    homeSet2: '',
    awaySet2: '',
    homeSet3: '',
    awaySet3: '',
    notes: ''
  });
  const {
    isListening,
    transcript,
    recognitionError,
    aiProcessing,
    aiSuccess,
    aiError,
    startListening,
    stopListening,
    isSpeechRecognitionSupported
  } = useVoiceScoreInput((parsedData) => {
    const sanitizedLineNumber = parseInteger(parsedData?.lineNumber) || formData.lineNumber;
    const sanitizedMatchType = parsedData?.matchType === 'singles' || parsedData?.matchType === 'doubles'
      ? parsedData.matchType
      : formData.matchType;

    const nextForm = {
      ...formData,
      lineNumber: sanitizedLineNumber,
      matchType: sanitizedMatchType,
      homeSet1: parsedData?.homeSet1 != null ? parseInteger(parsedData.homeSet1) : null,
      awaySet1: parsedData?.awaySet1 != null ? parseInteger(parsedData.awaySet1) : null,
      homeSet2: parsedData?.homeSet2 != null ? parseInteger(parsedData.homeSet2) : null,
      awaySet2: parsedData?.awaySet2 != null ? parseInteger(parsedData.awaySet2) : null,
      homeSet3: parsedData?.homeSet3 != null ? parseInteger(parsedData.homeSet3) : null,
      awaySet3: parsedData?.awaySet3 != null ? parseInteger(parsedData.awaySet3) : null,
      notes: parsedData?.notes?.trim?.() || formData.notes
    };

    const set1Home = parseInteger(nextForm.homeSet1);
    const set1Away = parseInteger(nextForm.awaySet1);
    const set2Home = parseInteger(nextForm.homeSet2);
    const set2Away = parseInteger(nextForm.awaySet2);
    const set3Home = parseInteger(nextForm.homeSet3);
    const set3Away = parseInteger(nextForm.awaySet3);

    const hasThirdSet = !isEmptyValue(nextForm.homeSet3) || !isEmptyValue(nextForm.awaySet3);
    const invalid =
      !isStandardSetValid(set1Home, set1Away) ||
      !isStandardSetValid(set2Home, set2Away) ||
      (hasThirdSet && !isMatchTiebreakValid(set3Home, set3Away));

    if (invalid) {
      setError('AI parsed an invalid score. Please correct the values and try again.');
      return;
    }

    const matchOrLineChanged = sanitizedMatchType !== formData.matchType || sanitizedLineNumber !== formData.lineNumber;
    setFormData((prev) => ({
      ...prev,
      lineNumber: sanitizedLineNumber,
      matchType: sanitizedMatchType,
      homePlayers: matchOrLineChanged ? ['', ''] : prev.homePlayers,
      awayPlayers: matchOrLineChanged ? ['', ''] : prev.awayPlayers,
      homeSet1: nextForm.homeSet1?.toString() || '',
      awaySet1: nextForm.awaySet1?.toString() || '',
      homeSet2: nextForm.homeSet2?.toString() || '',
      awaySet2: nextForm.awaySet2?.toString() || '',
      homeSet3: nextForm.homeSet3?.toString() || '',
      awaySet3: nextForm.awaySet3?.toString() || '',
      notes: nextForm.notes
    }));
    setError('');
    setSuccess('Transcript parsed successfully by AI!');
  });

  // Load user, player, and team data
  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // 2. Get Player Profile
      const { data: playerData, error: playerError } = await supabase
        .from('player')
        .select('*')
        .eq('id', user.id)
        .single();

      if (playerError || !playerData) {
        console.error('Error fetching player data:', playerError);
        return;
      }
      setPlayer(playerData);

      // 3. Get Player's Team
      const { data: teamLink, error: teamLinkError } = await supabase
        .from('player_to_team')
        .select('team')
        .eq('player', playerData.id)
        .single();

      if (teamLinkError || !teamLink) {
        console.error('Error fetching player team link:', teamLinkError);
        return;
      }

      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('*')
        .eq('id', teamLink.team)
        .single();

      if (teamError || !teamData) {
        console.error('Error fetching team data:', teamError);
        return;
      }
      setUserTeam(teamData);
    };

    loadInitialData();
  }, []);

  // Load available matches once the user's team is known
  useEffect(() => {
    if (!userTeam) return;

    const loadMatches = async () => {
      try {
        const { data: matches, error } = await supabase
          .from('matches')
          .select('*')
          .or(`home_team_number.eq.${userTeam.number},away_team_number.eq.${userTeam.number}`)
          .order('date', { ascending: true });

        if (error) throw error;
        setAvailableMatches(matches || []);
      } catch (err) {
        console.error('Error loading matches:', err);
      }
    };

    loadMatches();
  }, [userTeam]);

  const getEligiblePlayers = (roster, lineNumber) => {
    if (!roster || roster.length === 0) return [];
    const line = parseInt(lineNumber);
    if (line === 1) {
      return roster.filter(p => p.position >= 1 && p.position <= 2);
    }
    if (line === 2) {
      return roster.filter(p => p.position >= 3 && p.position <= 3);
    }
    if (line === 3) {
      return roster.filter(p => p.position >= 5 && p.position <= 5);
    }
    return roster; // Default to all if line not specified
  };

  const loadExistingScores = async (matchId) => {
    try {
      const { data: scores, error } = await supabase
        .from('line_results')
        .select(`
          *,
          home_player_1:player!home_player_1_id(first_name, last_name),
          home_player_2:player!home_player_2_id(first_name, last_name),
          away_player_1:player!away_player_1_id(first_name, last_name),
          away_player_2:player!away_player_2_id(first_name, last_name)
        `)
        .eq('match_id', matchId)
        .order('line_number');

      if (error) throw error;

      setExistingScores(scores || []);

      // If there's a score for the current line, populate the form
      const currentLineScore = scores?.find(s => s.line_number === formData.lineNumber);
      if (currentLineScore) {
        populateFormWithExistingScore(currentLineScore);
      }
    } catch (err) {
      console.error('Error loading existing scores:', err);
    }
  };

  const populateFormWithExistingScore = (score) => {
    const homePlayers = [
      score.home_player_1 ? `${score.home_player_1.first_name} ${score.home_player_1.last_name}` : '',
      score.home_player_2 ? `${score.home_player_2.first_name} ${score.home_player_2.last_name}` : ''
    ];

    const awayPlayers = [
      score.away_player_1 ? `${score.away_player_1.first_name} ${score.away_player_1.last_name}` : '',
      score.away_player_2 ? `${score.away_player_2.first_name} ${score.away_player_2.last_name}` : ''
    ];

    setFormData(prev => ({
      ...prev,
      matchType: score.match_type,
      homePlayers,
      awayPlayers,
      homeSet1: score.home_set_1?.toString() || '',
      awaySet1: score.away_set_1?.toString() || '',
      homeSet2: score.home_set_2?.toString() || '',
      awaySet2: score.away_set_2?.toString() || '',
      homeSet3: score.home_set_3?.toString() || '',
      awaySet3: score.away_set_3?.toString() || '',
      notes: score.notes || ''
    }));
  };

  const getPlayersWhoActuallyPlayed = (homeRoster, awayRoster) => {
    // Get all unique players who actually played in this match
    const playersWhoPlayed = new Set();

    existingScores.forEach(score => {
      if (score.home_player_1) {
        playersWhoPlayed.add(`${score.home_player_1.first_name} ${score.home_player_1.last_name}`);
      }
      if (score.home_player_2) {
        playersWhoPlayed.add(`${score.home_player_2.first_name} ${score.home_player_2.last_name}`);
      }
      if (score.away_player_1) {
        playersWhoPlayed.add(`${score.away_player_1.first_name} ${score.away_player_1.last_name}`);
      }
      if (score.away_player_2) {
        playersWhoPlayed.add(`${score.away_player_2.first_name} ${score.away_player_2.last_name}`);
      }
    });

    // Filter rosters to prioritize players who actually played
    const homePlayersWhoPlayed = homeRoster.filter(p => playersWhoPlayed.has(p.name));
    const awayPlayersWhoPlayed = awayRoster.filter(p => playersWhoPlayed.has(p.name));

    return { homePlayersWhoPlayed, awayPlayersWhoPlayed, playersWhoPlayed };
  };

  const getDisplayPlayers = (roster, lineNumber) => {
    const eligiblePlayers = getEligiblePlayers(roster, lineNumber);
    const { playersWhoPlayed } = getPlayersWhoActuallyPlayed(homeTeamRoster, awayTeamRoster);

    // Mark players who actually played and sort them to the top
    const playersWithStatus = eligiblePlayers.map(player => ({
      ...player,
      actuallyPlayed: playersWhoPlayed.has(player.name)
    }));

    // Sort: players who actually played first, then by position
    return playersWithStatus.sort((a, b) => {
      if (a.actuallyPlayed && !b.actuallyPlayed) return -1;
      if (!a.actuallyPlayed && b.actuallyPlayed) return 1;
      return a.position - b.position;
    });
  };

  const autoSelectPlayers = (homeRoster, awayRoster, lineNumber, matchType) => {
    // Don't auto-select if there's already existing score data for this line
    const existingScore = existingScores.find(s => s.line_number === parseInt(lineNumber));
    if (existingScore) return;

    let homeEligible, awayEligible;

    // If match has existing scores, prioritize players who actually played
    if (existingScores.length > 0) {
      const { homePlayersWhoPlayed, awayPlayersWhoPlayed } = getPlayersWhoActuallyPlayed(homeRoster, awayRoster);

      // Use players who actually played, filtered by line eligibility
      homeEligible = getEligiblePlayers(homePlayersWhoPlayed, lineNumber);
      awayEligible = getEligiblePlayers(awayPlayersWhoPlayed, lineNumber);

      // If no eligible players from those who played, fall back to all eligible players
      if (homeEligible.length === 0) {
        homeEligible = getEligiblePlayers(homeRoster, lineNumber);
      }
      if (awayEligible.length === 0) {
        awayEligible = getEligiblePlayers(awayRoster, lineNumber);
      }
    } else {
      // No existing scores, use normal eligibility rules
      homeEligible = getEligiblePlayers(homeRoster, lineNumber);
      awayEligible = getEligiblePlayers(awayRoster, lineNumber);
    }

    const newHomePlayers = ['', ''];
    const newAwayPlayers = ['', ''];

    // Auto-select home players
    if (homeEligible.length >= 1) {
      newHomePlayers[0] = homeEligible[0].name;
    }
    if (matchType === 'doubles' && homeEligible.length >= 2) {
      newHomePlayers[1] = homeEligible[1].name;
    }

    // Auto-select away players
    if (awayEligible.length >= 1) {
      newAwayPlayers[0] = awayEligible[0].name;
    }
    if (matchType === 'doubles' && awayEligible.length >= 2) {
      newAwayPlayers[1] = awayEligible[1].name;
    }

    // Update form data if any players were auto-selected
    if (newHomePlayers[0] || newAwayPlayers[0]) {
      setFormData(prev => ({
        ...prev,
        homePlayers: newHomePlayers,
        awayPlayers: newAwayPlayers
      }));
    }
  };

  const setLineFocus = (lineValue, matchTypeOverride) => {
    const numericLine = typeof lineValue === 'number' ? lineValue : parseInt(lineValue, 10);
    if (!Number.isFinite(numericLine)) {
      return;
    }

    const effectiveMatchType = matchTypeOverride ?? formData.matchType;

    setFormData(prev => ({
      ...prev,
      lineNumber: numericLine
    }));

    setTimeout(() => {
      const existingScore = existingScores.find((score) => score.line_number === numericLine);
      if (existingScore) {
        populateFormWithExistingScore(existingScore);
        return;
      }

      setFormData(prev => ({
        ...prev,
        homePlayers: ['', ''],
        awayPlayers: ['', ''],
        homeSet1: '',
        awaySet1: '',
        homeSet2: '',
        awaySet2: '',
        homeSet3: '',
        awaySet3: '',
        notes: ''
      }));
      autoSelectPlayers(homeTeamRoster, awayTeamRoster, numericLine, effectiveMatchType);
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'lineNumber') {
      setLineFocus(value);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If line number changes, load existing score for that line or auto-select
    // If match type changes, re-run auto-selection (unless there's existing data)
    if (name === 'matchType') {
      setTimeout(() => {
        const existingScore = existingScores.find(s => s.line_number === parseInt(formData.lineNumber));
        if (!existingScore) {
          const currentLine = typeof formData.lineNumber === 'string'
            ? parseInt(formData.lineNumber, 10)
            : formData.lineNumber;
          autoSelectPlayers(homeTeamRoster, awayTeamRoster, currentLine, value);
        }
      }, 0);
    }
  };

  const handlePlayerChange = (team, position, value) => {
    setFormData(prev => ({
      ...prev,
      [`${team}Players`]: prev[`${team}Players`].map((p, i) =>
        i === position ? value : p
      )
    }));
  };

  const handleScoreChange = (team, set, value) => {
    const scoreValue = value === '' ? '' : value.replace(/[^0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      [`${team}Set${set}`]: scoreValue
    }));
  };

  const generateScoreOptions = () => {
    const options = [];
    for (let i = 0; i <= 7; i++) {
      options.push(<option key={i} value={i}>{i}</option>);
    }
    return options;
  };

  const generateTiebreakOptions = () => {
    const options = [];
    for (let i = 0; i <= 30; i++) {
      options.push(<option key={i} value={i}>{i}</option>);
    }
    return options;
  };

  // Calculate match winner based on current scores
  const calculateMatchWinner = () => {
    const homeSet1 = parseInt(formData.homeSet1) || 0;
    const awaySet1 = parseInt(formData.awaySet1) || 0;
    const homeSet2 = parseInt(formData.homeSet2) || 0;
    const awaySet2 = parseInt(formData.awaySet2) || 0;
    const homeSet3 = parseInt(formData.homeSet3) || 0;
    const awaySet3 = parseInt(formData.awaySet3) || 0;

    let homeSetsWon = 0;
    let awaySetsWon = 0;

    // Count sets won (need to win by 2 games or win 7-6)
    if (homeSet1 > awaySet1 && (homeSet1 >= 6 && (homeSet1 - awaySet1 >= 2 || homeSet1 === 7))) homeSetsWon++;
    else if (awaySet1 > homeSet1 && (awaySet1 >= 6 && (awaySet1 - homeSet1 >= 2 || awaySet1 === 7))) awaySetsWon++;

    if (homeSet2 > awaySet2 && (homeSet2 >= 6 && (homeSet2 - awaySet2 >= 2 || homeSet2 === 7))) homeSetsWon++;
    else if (awaySet2 > homeSet2 && (awaySet2 >= 6 && (awaySet2 - homeSet2 >= 2 || awaySet2 === 7))) awaySetsWon++;

    // Set 3 is a tiebreak (first to MATCH_TIEBREAK_TARGET, win by 2)
    if (homeSet3 && awaySet3) {
      if (homeSet3 >= MATCH_TIEBREAK_TARGET && homeSet3 - awaySet3 >= 2) homeSetsWon++;
      else if (awaySet3 >= MATCH_TIEBREAK_TARGET && awaySet3 - homeSet3 >= 2) awaySetsWon++;
    }

    if (homeSetsWon > awaySetsWon) return 'home';
    if (awaySetsWon > homeSetsWon) return 'away';
    return null;
  };

  // Get display names for players
  const getPlayerDisplayNames = () => {
    let homeNames, awayNames;

    if (formData.matchType === 'singles') {
      // For singles, only show the first player
      homeNames = formData.homePlayers[0] || '';
      awayNames = formData.awayPlayers[0] || '';
    } else {
      // For doubles, show both players joined with ' / '
      homeNames = formData.homePlayers.filter(p => p).join(' / ');
      awayNames = formData.awayPlayers.filter(p => p).join(' / ');
    }

    return { homeNames, awayNames };
  };

  // Load roster and fetch player IDs from Supabase
  const loadTeamRoster = async (teamNumber, night) => {
    try {
      const { data: team, error: teamError } = await supabase
        .from('team')
        .select('id')
        .eq('number', teamNumber)
        .single();

      if (teamError || !team) throw new Error(`Team ${teamNumber} on ${night} not found.`);

      // Get player IDs from junction table
      const { data: playerLinks, error: linksError } = await supabase
        .from('player_to_team')
        .select('player')
        .eq('team', team.id);

      if (linksError) throw linksError;
      const playerIds = playerLinks.map(link => link.player);

      // Get player details
      if (playerIds.length > 0) {
        const { data: players, error: playersError } = await supabase
          .from('player')
          .select('id, first_name, last_name, ranking')
          .in('id', playerIds);

        if (playersError) throw playersError;

        // Build name to ID map and roster list, assigning positions
        const idMap = {};
        const roster = players
          .sort((a, b) => a.ranking - b.ranking) // Sort by ranking
          .map((p) => {
            const fullName = `${p.first_name} ${p.last_name}`;
            idMap[fullName] = p.id;
            return { name: fullName, position: p.ranking };
          });

        setPlayerIdMap(prev => ({ ...prev, ...idMap }));
        return roster;
      }
      return [];
    } catch (err) {
      console.error(`Error loading roster for team ${teamNumber}:`, err);
      return [];
    }
  };

  const handleMatchSelect = async (matchId) => {
    const match = availableMatches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
      setFormData(prev => ({
        ...prev,
        matchId: matchId,
        homePlayers: ['', ''],
        awayPlayers: ['', '']
      }));

      // Load rosters for both teams
      const [homeRoster, awayRoster] = await Promise.all([
        loadTeamRoster(match.home_team_number, match.home_team_night),
        loadTeamRoster(match.away_team_number, match.away_team_night)
      ]);

      setHomeTeamRoster(homeRoster);
      setAwayTeamRoster(awayRoster);

      // Load existing scores for this match
      await loadExistingScores(matchId);

      // Auto-select players if there are few options
      autoSelectPlayers(homeRoster, awayRoster, formData.lineNumber, formData.matchType);
    }
  };

  const validateForm = () => {
    if (!formData.matchId) {
      setError('Please select a match');
      return false;
    }

    const normalizedHomePlayers = normalizePlayerSelections(formData.matchType, formData.homePlayers);
    const normalizedAwayPlayers = normalizePlayerSelections(formData.matchType, formData.awayPlayers);

    if (!normalizedHomePlayers[0] || !normalizedAwayPlayers[0]) {
      setError('Select at least one player for each team');
      return false;
    }

    if (!arePlayersUnique([...normalizedHomePlayers, ...normalizedAwayPlayers])) {
      setError('Players cannot appear on both sides of the net');
      return false;
    }

    const set1Home = parseInteger(formData.homeSet1);
    const set1Away = parseInteger(formData.awaySet1);
    const set2Home = parseInteger(formData.homeSet2);
    const set2Away = parseInteger(formData.awaySet2);
    const set3Home = parseInteger(formData.homeSet3);
    const set3Away = parseInteger(formData.awaySet3);

    if (!isStandardSetValid(set1Home, set1Away) || !isStandardSetValid(set2Home, set2Away)) {
      setError('Sets 1 and 2 must be valid tennis scores (win by 2, 6-4/7-5/7-6 etc.)');
      return false;
    }

    if (!isEmptyValue(formData.homeSet3) || !isEmptyValue(formData.awaySet3)) {
      if (!isMatchTiebreakValid(set3Home, set3Away)) {
        setError('Third set must be a valid tiebreak (first to 7, win by 2) or blank');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (!selectedMatch) {
        throw new Error('No match selected');
      }
      // Calculate winner
      const normalizedHomePlayers = normalizePlayerSelections(formData.matchType, formData.homePlayers);
      const normalizedAwayPlayers = normalizePlayerSelections(formData.matchType, formData.awayPlayers);

      setFormData((prev) => ({
        ...prev,
        homePlayers: normalizedHomePlayers,
        awayPlayers: normalizedAwayPlayers
      }));

      const winner = calculateMatchWinner();
      if (!winner) {
        setError('Unable to determine a winner from the provided scores. Check set results.');
        return;
      }

      // Get player IDs from name
      const payload = buildScorePayload({
        matchId: selectedMatch.id,
        lineNumber: formData.lineNumber,
        matchType: formData.matchType,
        homeSet1: formData.homeSet1,
        homeSet2: formData.homeSet2,
        homeSet3: formData.homeSet3,
        awaySet1: formData.awaySet1,
        awaySet2: formData.awaySet2,
        awaySet3: formData.awaySet3,
        homePlayers: normalizedHomePlayers,
        awayPlayers: normalizedAwayPlayers,
        notes: formData.notes
      }, playerIdMap, user.id, winner);

      // Check if score already exists for this line
      const existingScore = existingScores.find(s => s.line_number === Number(formData.lineNumber));

      if (existingScore && isPayloadUnchanged(existingScore, payload)) {
        setError('No changes detected for this line. Update scores or notes before resubmitting.');
        return;
      }

      if (existingScore) {
        const previousSnapshot = collectScoreSnapshot(existingScore);

        // Update existing score
        const { data: updatedRows, error: lineError } = await supabase
          .from('line_results')
          .update(payload)
          .eq('id', existingScore.id)
          .select();

        if (lineError) throw lineError;

        await supabase
          .from('line_result_audit')
          .insert([{ previous_state: previousSnapshot, new_state: collectScoreSnapshot(updatedRows?.[0]) }])
          .throwOnError();
      } else {
        // Create new line result
        const { data: insertedRows, error: lineError } = await supabase
          .from('line_results')
          .insert([payload])
          .select();

        if (lineError) throw lineError;

        await supabase
          .from('line_result_audit')
          .insert([{ previous_state: null, new_state: collectScoreSnapshot(insertedRows?.[0]) }])
          .throwOnError();
      }

      setSuccess(existingScore ? 'Scores updated successfully!' : 'Scores submitted successfully!');

      // Reload existing scores to reflect changes
      await loadExistingScores(selectedMatch.id);
      // Reset form
      setFormData(prev => ({
        ...prev,
        matchId: '',
        homePlayers: ['', ''],
        awayPlayers: ['', ''],
        homeSet1: '',
        awaySet1: '',
        homeSet2: '',
        awaySet2: '',
        homeSet3: '',
        awaySet3: '',
        notes: ''
      }));
      setSelectedMatch(null);
    } catch (err) {
      setError('Error submitting scores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const LINES_PER_MATCH = 3;
  const lineNumbers = Array.from({ length: LINES_PER_MATCH }, (_, index) => index + 1);
  const activeLineNumber = parseInt(formData.lineNumber, 10) || 1;
  const totalMatchesAvailable = availableMatches.length;
  const hasMatchSelected = Boolean(selectedMatch);
  const linesRecorded = hasMatchSelected ? existingScores.length : 0;
  const matchProgress = hasMatchSelected
    ? Math.min(100, Math.round((linesRecorded / LINES_PER_MATCH) * 100))
    : 0;
  const nextMatch = availableMatches[0] || null;
  const currentFocusLabel = hasMatchSelected ? `Line ${activeLineNumber}` : 'Awaiting selection';
  const currentFocusSubtitle = hasMatchSelected
    ? formData.matchType === 'doubles'
      ? 'Doubles match'
      : 'Singles match'
    : 'Choose a match and line to begin';

  const getMatchHeading = (match) => {
    if (!match) return 'No upcoming match';
    return `${match.home_team_name} vs ${match.away_team_name}`;
  };

  const getMatchSubheading = (match) => {
    if (!match) return 'Check back when new matches are scheduled';
    const segments = [];
    if (match.date) segments.push(match.date);
    if (match.time) segments.push(match.time);
    if (match.courts) segments.push(`Court ${match.courts}`);
    return segments.join(' • ') || 'Details forthcoming';
  };

  if (!user) {
    return <div>Please log in to submit scores.</div>;
  }

  return (
    <div className="add-score-page">
      <div className="add-score-header">
        <h1>Submit Match Scores</h1>
        <p>Record results, track progress, and keep your team's standings up to date.</p>
      </div>

      {userTeam && (
        <div className="team-banner card card--interactive card--overlay">
          <div className="team-icon">🛡️</div>
          <div className="team-banner-content">
            <span className="team-label">Submitting scores for</span>
            <span className="team-name">{userTeam.name}</span>
            {user?.email && (
              <span className="team-meta">Signed in as {user.email}</span>
            )}
          </div>
        </div>
      )}

      <div className="score-overview">
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Next Match</div>
          <div className="card-value">{getMatchHeading(nextMatch)}</div>
          <div className="card-subtitle">{getMatchSubheading(nextMatch)}</div>
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Matches Available</div>
          <div className="card-value">{totalMatchesAvailable}</div>
          <div className="card-subtitle">Matches scheduled for your team</div>
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Match Progress</div>
          <div className="card-value">
            {hasMatchSelected ? `${Math.round(matchProgress)}%` : 'Select a match'}
          </div>
          <div className="card-subtitle">
            {hasMatchSelected
              ? `${Math.max(LINES_PER_MATCH - linesRecorded, 0)} lines remaining for this match`
              : 'Select a match to track scoring progress'}
          </div>
          {hasMatchSelected && (
            <div
              className="card-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={matchProgress}
            >
              <div className="progress-bar" style={{ width: `${matchProgress}%` }} />
            </div>
          )}
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Current Focus</div>
          <div className="card-value">{currentFocusLabel}</div>
          <div className="card-subtitle">{currentFocusSubtitle}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="score-form">
        <div className="score-section card card--interactive">
          <h2>Select Match</h2>
          <div className="form-group">
            <label>Available Matches</label>
            <p className="helper-text">Use the dropdown or click a match card below to start scoring.</p>
            <select
              name="matchId"
              value={formData.matchId}
              onChange={(e) => handleMatchSelect(e.target.value)}
              required
            >
              <option value="">Select a match to submit scores for</option>
              {availableMatches.map(match => (
                <option key={match.id} value={match.id}>
                  {match.home_team_name} vs {match.away_team_name} - {match.date} at {match.time}
                </option>
              ))}
            </select>
          </div>

          {availableMatches.length > 0 && (
            <div className="match-selector">
              <div className="match-selector-header">
                <span className="selector-icon" aria-hidden="true">👉</span>
                <div>
                  <strong>Pick a match to score</strong>
                  <p>Tap or click a card to load rosters and existing results.</p>
                </div>
              </div>
              <div className="match-selector-grid">
                {availableMatches.map((match) => {
                  const isSelected = formData.matchId === match.id;
                  return (
                    <button
                      key={match.id}
                      type="button"
                      className={`match-card-button${isSelected ? ' is-selected' : ''}`}
                      onClick={() => handleMatchSelect(match.id)}
                      aria-pressed={isSelected}
                    >
                      <span className="match-card-heading">{match.home_team_name} vs {match.away_team_name}</span>
                      <span className="match-card-meta">{match.date} • {match.time} • Court {match.courts}</span>
                      {isSelected && <span className="match-card-pill">Selected</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {existingScores.length > 0 && (
            <div className="existing-scores-summary card card--interactive card--overlay">
              <h4>Existing Scores for this Match:</h4>
              <div className="scores-grid">
                {existingScores.map(score => (
                  <div key={score.id} className="score-summary card card--interactive card--overlay">
                    <strong>Line {score.line_number}</strong> ({score.match_type}):
                    {score.home_set_1}-{score.away_set_1}, {score.home_set_2}-{score.away_set_2}
                    {score.home_set_3 && `, ${score.home_set_3}-${score.away_set_3}`}
                    {score.home_won ? ' (Home Won)' : ' (Away Won)'}
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedMatch && (
            <div className="match-details card card--interactive">
              <h3>Match Details</h3>
              <div className="match-detail-grid">
                <p><strong>Date:</strong> {selectedMatch.date}</p>
                <p><strong>Time:</strong> {selectedMatch.time}</p>
                <p><strong>Courts:</strong> {selectedMatch.courts}</p>
                <p><strong>Teams:</strong> {selectedMatch.home_team_name} vs {selectedMatch.away_team_name}</p>
              </div>
            </div>
          )}
        </div>
        <div className="score-section card card--interactive">
          <h2>Line Information</h2>
          {hasMatchSelected && (
            <div className="line-switcher">
              <div className="line-switcher-header">
                <span className="line-switcher-title">Switch line focus</span>
                <span className="line-switcher-subtitle">Jump between lines to review or enter scores.</span>
              </div>
              <div className="line-switcher-buttons">
                {lineNumbers.map((line) => {
                  const isActiveLine = activeLineNumber === line;
                  const recordedScore = existingScores.find((score) => score.line_number === line);
                  const status = recordedScore ? 'completed' : isActiveLine ? 'active' : 'pending';
                  const statusLabel = recordedScore ? 'Completed' : isActiveLine ? 'In progress' : 'Not started';
                  return (
                    <button
                      key={line}
                      type="button"
                      className={`line-switcher-button${isActiveLine ? ' is-active' : ''}`}
                      onClick={() => setLineFocus(line, formData.matchType)}
                    >
                      <span className="line-label">Line {line}</span>
                      <span className={`line-status line-status--${status}`}>{statusLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Line Number</label>
              <select
                name="lineNumber"
                value={formData.lineNumber}
                onChange={handleInputChange}
                required
              >
                <option value={1}>Line 1 (Players #1 & #2)</option>
                <option value={2}>Line 2 (Players #3)</option>
                <option value={3}>Line 3 (Players #4-#5)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Match Type</label>
              <select
                name="matchType"
                value={formData.matchType}
                onChange={handleInputChange}
                required
              >
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Home Players</label>
              <select
                value={formData.homePlayers[0]}
                onChange={(e) => handlePlayerChange('home', 0, e.target.value)}
                required
              >
                <option value="">Select Player 1</option>
                {getDisplayPlayers(homeTeamRoster, formData.lineNumber).map((player, index) => (
                  <option key={index} value={player.name}>
                    {player.position}. {player.name} {player.captain ? '(C)' : ''} {player.actuallyPlayed ? '✓' : ''}
                  </option>
                ))}
              </select>
              {formData.matchType === 'doubles' && (
                <select
                  value={formData.homePlayers[1]}
                  onChange={(e) => handlePlayerChange('home', 1, e.target.value)}
                  required
                >
                  <option value="">Select Player 2</option>
                  {getDisplayPlayers(homeTeamRoster, formData.lineNumber).map((player, index) => (
                    <option key={index} value={player.name}>
                      {player.position}. {player.name} {player.captain ? '(C)' : ''} {player.actuallyPlayed ? '✓' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-group">
              <label>Away Players</label>
              <select
                value={formData.awayPlayers[0]}
                onChange={(e) => handlePlayerChange('away', 0, e.target.value)}
                required
              >
                <option value="">Select Player 1</option>
                {getDisplayPlayers(awayTeamRoster, formData.lineNumber).map((player, index) => (
                  <option key={index} value={player.name}>
                    {player.position}. {player.name} {player.captain ? '(C)' : ''} {player.actuallyPlayed ? '✓' : ''}
                  </option>
                ))}
              </select>
              {formData.matchType === 'doubles' && (
                <select
                  value={formData.awayPlayers[1]}
                  onChange={(e) => handlePlayerChange('away', 1, e.target.value)}
                  required
                >
                  <option value="">Select Player 2</option>
                  {getDisplayPlayers(awayTeamRoster, formData.lineNumber).map((player, index) => (
                    <option key={index} value={player.name}>
                      {player.position}. {player.name} {player.captain ? '(C)' : ''} {player.actuallyPlayed ? '✓' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        <div className="score-section card card--interactive">
          <h2>Match Scores</h2>
          {(() => {
            const { homeNames, awayNames } = getPlayerDisplayNames();
            const winner = calculateMatchWinner();

            return (
              <div className="score-summary-card card card--interactive card--overlay">
                {homeNames && awayNames && (
                  <div className="player-names">
                    <div className={`home-players ${winner === 'home' ? 'winner' : ''}`}>
                      {homeNames} {winner === 'home' ? '🏆' : ''}
                    </div>
                    <div className="vs">vs</div>
                    <div className={`away-players ${winner === 'away' ? 'winner' : ''}`}>
                      {awayNames} {winner === 'away' ? '🏆' : ''}
                    </div>
                  </div>
                )}
                {winner && (
                  <div className="match-winner">
                    Winner: {winner === 'home' ? homeNames || 'Home Team' : awayNames || 'Away Team'}
                  </div>
                )}
              </div>
            );
          })()}
          <div className="score-row">
            <div className="score-group">
              <label>Set 1</label>
              <div className="score-inputs">
                <select
                  value={formData.homeSet1}
                  onChange={(e) => handleScoreChange('home', 1, e.target.value)}
                  required
                >
                  <option value="">{getPlayerDisplayNames().homeNames || 'Home'}</option>
                  {generateScoreOptions()}
                </select>
                <span>-</span>
                <select
                  value={formData.awaySet1}
                  onChange={(e) => handleScoreChange('away', 1, e.target.value)}
                  required
                >
                  <option value="">{getPlayerDisplayNames().awayNames || 'Away'}</option>
                  {generateScoreOptions()}
                </select>
              </div>
            </div>
            <div className="score-group">
              <label>Set 2</label>
              <div className="score-inputs">
                <select
                  value={formData.homeSet2}
                  onChange={(e) => handleScoreChange('home', 2, e.target.value)}
                  required
                >
                  <option value="">{getPlayerDisplayNames().homeNames || 'Home'}</option>
                  {generateScoreOptions()}
                </select>
                <span>-</span>
                <select
                  value={formData.awaySet2}
                  onChange={(e) => handleScoreChange('away', 2, e.target.value)}
                  required
                >
                  <option value="">{getPlayerDisplayNames().awayNames || 'Away'}</option>
                  {generateScoreOptions()}
                </select>
              </div>
            </div>
            <div className="score-group">
              <label>Set 3 (Tiebreak)</label>
              <div className="score-inputs">
                <select
                  value={formData.homeSet3}
                  onChange={(e) => handleScoreChange('home', 3, e.target.value)}
                >
                  <option value="">{getPlayerDisplayNames().homeNames || 'Home'}</option>
                  {generateTiebreakOptions()}
                </select>
                <span>-</span>
                <select
                  value={formData.awaySet3}
                  onChange={(e) => handleScoreChange('away', 3, e.target.value)}
                >
                  <option value="">{getPlayerDisplayNames().awayNames || 'Away'}</option>
                  {generateTiebreakOptions()}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="score-section card card--interactive">
          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              maxLength={MAX_NOTES_LENGTH}
              placeholder="Any additional notes about the match..."
              rows="3"
              aria-describedby="notes-counter"
            />
            <div id="notes-counter" className="character-count">
              {(formData.notes || '').length} / {MAX_NOTES_LENGTH} characters
            </div>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? (
             <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LoadingSpinner size="sm" />
                Submitting...
             </span>
          ) : 'Submit Scores'}
        </button>
      </form>
    </div>
  );
};
