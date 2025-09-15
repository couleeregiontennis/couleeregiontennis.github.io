import React, { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/AddScore.css';

export function AddScore() {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If line number changes, load existing score for that line or auto-select
    if (name === 'lineNumber') {
      setTimeout(() => {
        const existingScore = existingScores.find(s => s.line_number === parseInt(value));
        if (existingScore) {
          populateFormWithExistingScore(existingScore);
        } else {
          // Clear form and auto-select for new line
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
          autoSelectPlayers(homeTeamRoster, awayTeamRoster, value, formData.matchType);
        }
      }, 0);
    }
    
    // If match type changes, re-run auto-selection (unless there's existing data)
    if (name === 'matchType') {
      setTimeout(() => {
        const existingScore = existingScores.find(s => s.line_number === parseInt(formData.lineNumber));
        if (!existingScore) {
          autoSelectPlayers(homeTeamRoster, awayTeamRoster, formData.lineNumber, value);
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
    setFormData(prev => ({
      ...prev,
      [`${team}Set${set}`]: value
    }));
  };

  const generateScoreOptions = () => {
    const options = [];
    for (let i = 0; i <= 6; i++) {
      options.push(
        <option key={i} value={i}>{i}</option>
      );
    }
    return options;
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
    
    // Validate that we have complete scores for the selected line
    const hasCompleteScores = formData.homeSet1 && formData.awaySet1 && 
                             formData.homeSet2 && formData.awaySet2;
    
    if (!hasCompleteScores) {
      setError('Please enter complete scores for both sets');
      return false;
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
      const homeWon = (parseInt(formData.homeSet1) > parseInt(formData.awaySet1) ? 1 : 0) +
        (parseInt(formData.homeSet2) > parseInt(formData.awaySet2) ? 1 : 0) +
        (formData.homeSet3 && formData.awaySet3 ?
          (parseInt(formData.homeSet3) > parseInt(formData.awaySet3) ? 1 : 0) : 0);
      // Get player IDs from name
      const home_player_1_id = playerIdMap[formData.homePlayers[0]] || null;
      const home_player_2_id = formData.matchType === 'doubles' ? playerIdMap[formData.homePlayers[1]] || null : null;
      const away_player_1_id = playerIdMap[formData.awayPlayers[0]] || null;
      const away_player_2_id = formData.matchType === 'doubles' ? playerIdMap[formData.awayPlayers[1]] || null : null;
      // Check if score already exists for this line
      const existingScore = existingScores.find(s => s.line_number === Number(formData.lineNumber));
      
      if (existingScore) {
        // Update existing score
        const { error: lineError } = await supabase
          .from('line_results')
          .update({
            match_type: formData.matchType,
            home_player_1_id,
            home_player_2_id,
            away_player_1_id,
            away_player_2_id,
            home_set_1: parseInt(formData.homeSet1),
            away_set_1: parseInt(formData.awaySet1),
            home_set_2: parseInt(formData.homeSet2),
            away_set_2: parseInt(formData.awaySet2),
            home_set_3: formData.homeSet3 ? parseInt(formData.homeSet3) : null,
            away_set_3: formData.awaySet3 ? parseInt(formData.awaySet3) : null,
            home_won: homeWon >= 2,
            submitted_by: user.id,
            notes: formData.notes,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingScore.id);
        
        if (lineError) throw lineError;
      } else {
        // Create new line result
        const { error: lineError } = await supabase
          .from('line_results')
          .insert([{
            match_id: selectedMatch.id,
            line_number: Number(formData.lineNumber),
            match_type: formData.matchType,
            home_player_1_id,
            home_player_2_id,
            away_player_1_id,
            away_player_2_id,
            home_set_1: parseInt(formData.homeSet1),
            away_set_1: parseInt(formData.awaySet1),
            home_set_2: parseInt(formData.homeSet2),
            away_set_2: parseInt(formData.awaySet2),
            home_set_3: formData.homeSet3 ? parseInt(formData.homeSet3) : null,
            away_set_3: formData.awaySet3 ? parseInt(formData.awaySet3) : null,
            home_won: homeWon >= 2,
            submitted_by: user.id,
            notes: formData.notes
          }]);
        
        if (lineError) throw lineError;
      }
      
      setSuccess(existingScore ? 'Scores updated successfully!' : 'Scores submitted successfully!');
      
      // Reload existing scores to reflect changes
      await loadExistingScores(selectedMatch.id);
      // Reset form
      setFormData(prev => ({
        ...prev,
        matchId: '',
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

  if (!user) {
    return <div>Please log in to submit scores.</div>;
  }

  return (
    <div className="add-score-page">
      <h1>Submit Match Scores</h1>
      {userTeam && (
        <div className="user-info">
          <p>Submitting scores for: <strong>{userTeam.name}</strong></p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="score-form">
        <div className="form-section">
          <h2>Select Match</h2>
          <div className="form-group">
            <label>Available Matches</label>
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
          
          {existingScores.length > 0 && (
            <div className="existing-scores-summary">
              <h4>Existing Scores for this Match:</h4>
              <div className="scores-grid">
                {existingScores.map(score => (
                  <div key={score.id} className="score-summary">
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
            <div className="match-details">
              <h3>Match Details</h3>
              <div className="match-info">
                <p><strong>Date:</strong> {selectedMatch.date}</p>
                <p><strong>Time:</strong> {selectedMatch.time}</p>
                <p><strong>Courts:</strong> {selectedMatch.courts}</p>
                <p><strong>Teams:</strong> {selectedMatch.home_team_name} vs {selectedMatch.away_team_name}</p>
              </div>
            </div>
          )}
        </div>
        <div className="form-section">
          <h2>Line Information</h2>
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
        <div className="form-section">
          <h2>Match Scores</h2>
          <div className="score-row">
            <div className="score-group">
              <label>Set 1</label>
              <div className="score-inputs">
                <select 
                  value={formData.homeSet1} 
                  onChange={(e) => handleScoreChange('home', 1, e.target.value)}
                  required
                >
                  <option value="">Home</option>
                  {generateScoreOptions()}
                </select>
                <span>-</span>
                <select 
                  value={formData.awaySet1} 
                  onChange={(e) => handleScoreChange('away', 1, e.target.value)}
                  required
                >
                  <option value="">Away</option>
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
                  <option value="">Home</option>
                  {generateScoreOptions()}
                </select>
                <span>-</span>
                <select 
                  value={formData.awaySet2} 
                  onChange={(e) => handleScoreChange('away', 2, e.target.value)}
                  required
                >
                  <option value="">Away</option>
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
                  <option value="">Home</option>
                  {generateScoreOptions()}
                </select>
                <span>-</span>
                <select 
                  value={formData.awaySet3} 
                  onChange={(e) => handleScoreChange('away', 3, e.target.value)}
                >
                  <option value="">Away</option>
                  {generateScoreOptions()}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="form-section">
          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange}
              placeholder="Any additional notes about the match..."
              rows="3"
            />
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Submitting...' : 'Submit Scores'}
        </button>
      </form>
    </div>
  );
}
