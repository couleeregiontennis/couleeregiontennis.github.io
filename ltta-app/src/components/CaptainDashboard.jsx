import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/CaptainDashboard.css';

export const CaptainDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCaptainData();
  }, []);

  const loadCaptainData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');
      
      setUser(currentUser);

      // Get player data to check if they're a captain
      const { data: playerData, error: playerError } = await supabase
        .from('player')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (playerError || !playerData?.is_captain) {
        throw new Error('Access denied: Captain privileges required');
      }

      // Get team data
      const { data: teamLink, error: teamLinkError } = await supabase
        .from('player_to_team')
        .select('team')
        .eq('player', currentUser.id)
        .single();

      if (teamLinkError) throw teamLinkError;

      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('*')
        .eq('id', teamLink.team)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Load team roster
      await loadTeamRoster(teamData.id);
      
      // Load upcoming matches
      await loadUpcomingMatches(teamData.number, teamData.play_night);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamRoster = async (teamId) => {
    try {
      const { data: teamPlayers, error } = await supabase
        .from('player_to_team')
        .select(`
          player:player(
            id,
            first_name,
            last_name,
            email,
            phone,
            ranking,
            is_captain
          )
        `)
        .eq('team', teamId);

      if (error) throw error;

      const rosterData = teamPlayers.map((tp, index) => ({
        ...tp.player,
        position: index + 1
      }));

      setRoster(rosterData);
    } catch (err) {
      console.error('Error loading roster:', err);
    }
  };

  const loadUpcomingMatches = async (teamNumber, playNight) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .or(`home_team_number.eq.${teamNumber},away_team_number.eq.${teamNumber}`)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingMatches(matches || []);
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  };

  const handleRosterUpdate = async (playerId, field, value) => {
    try {
      const { error } = await supabase
        .from('player')
        .update({ [field]: value })
        .eq('id', playerId);

      if (error) throw error;
      
      setSuccess('Player updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reload roster
      await loadTeamRoster(team.id);
    } catch (err) {
      setError('Error updating player: ' + err.message);
    }
  };

  if (loading) {
    return <div className="captain-dashboard loading">Loading captain dashboard...</div>;
  }

  if (error) {
    return <div className="captain-dashboard error">{error}</div>;
  }

  return (
    <div className="captain-dashboard">
      <h1>Captain Dashboard</h1>
      
      {team && (
        <div className="team-info">
          <h2>Team {team.number} - {team.name}</h2>
          <p><strong>League:</strong> {team.play_night} Night</p>
        </div>
      )}

      <div className="dashboard-sections">
        <section className="roster-section">
          <h3>Team Roster Management</h3>
          <div className="roster-table">
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Ranking</th>
                  <th>Captain</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((player) => (
                  <tr key={player.id}>
                    <td>{player.position}</td>
                    <td>{player.first_name} {player.last_name}</td>
                    <td>{player.email}</td>
                    <td>{player.phone || 'Not provided'}</td>
                    <td>
                      <select
                        value={player.ranking}
                        onChange={(e) => handleRosterUpdate(player.id, 'ranking', parseInt(e.target.value))}
                      >
                        {[1,2,3,4,5].map(rank => (
                          <option key={rank} value={rank}>{rank}</option>
                        ))}
                      </select>
                    </td>
                    <td>{player.is_captain ? '👑' : ''}</td>
                    <td>
                      <button className="btn-small">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="matches-section">
          <h3>Upcoming Matches</h3>
          <div className="matches-list">
            {upcomingMatches.length === 0 ? (
              <p>No upcoming matches scheduled.</p>
            ) : (
              upcomingMatches.map((match) => (
                <div key={match.id} className="match-card">
                  <div className="match-date">{new Date(match.date).toLocaleDateString()}</div>
                  <div className="match-teams">
                    {match.home_team_name} vs {match.away_team_name}
                  </div>
                  <div className="match-time">{match.time} at {match.courts}</div>
                  <div className="match-actions">
                    <button className="btn-small">Send Reminder</button>
                    <button className="btn-small">View Details</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="tools-section">
          <h3>Captain Tools</h3>
          <div className="tools-grid">
            <button className="tool-button">
              <h4>Send Team Email</h4>
              <p>Send announcements to all team members</p>
            </button>
            <button className="tool-button">
              <h4>Request Substitutes</h4>
              <p>Find subs for upcoming matches</p>
            </button>
            <button className="tool-button">
              <h4>Update Lineup</h4>
              <p>Set player positions for matches</p>
            </button>
            <button className="tool-button">
              <h4>View Team Stats</h4>
              <p>See team performance and statistics</p>
            </button>
          </div>
        </section>
      </div>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
