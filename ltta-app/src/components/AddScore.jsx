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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      // Create line result
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
      setSuccess('Scores submitted successfully!');
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
                {getEligiblePlayers(homeTeamRoster, formData.lineNumber).map((player, index) => (
                  <option key={index} value={player.name}>
                    {player.position}. {player.name} {player.captain ? '(C)' : ''}
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
                  {getEligiblePlayers(homeTeamRoster, formData.lineNumber).map((player, index) => (
                    <option key={index} value={player.name}>
                      {player.position}. {player.name} {player.captain ? '(C)' : ''}
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
                {getEligiblePlayers(awayTeamRoster, formData.lineNumber).map((player, index) => (
                  <option key={index} value={player.name}>
                    {player.position}. {player.name} {player.captain ? '(C)' : ''}
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
                  {getEligiblePlayers(awayTeamRoster, formData.lineNumber).map((player, index) => (
                    <option key={index} value={player.name}>
                      {player.position}. {player.name} {player.captain ? '(C)' : ''}
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
