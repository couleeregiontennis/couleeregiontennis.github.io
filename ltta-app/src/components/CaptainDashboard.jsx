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
  const [rosterManagerOpen, setRosterManagerOpen] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [rosterManagerLoading, setRosterManagerLoading] = useState(false);

  const [seasonWins, setSeasonWins] = useState(0);
  const [seasonLosses, setSeasonLosses] = useState(0);
  const [playersAvailable, setPlayersAvailable] = useState(0);

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

      // Load season record
      await loadSeasonRecord(teamData.number);

      // Load upcoming matches
      await loadUpcomingMatches(teamData.number, teamData.play_night);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailTeam = () => {
    const emails = roster.map(player => player.email).filter(Boolean);

    if (emails.length === 0) {
      setError('No email addresses found for your roster.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    const subject = team
      ? `LTTA Team ${team.number}${team.name ? ` · ${team.name}` : ''}`
      : 'LTTA Team Update';

    const nextMatch = upcomingMatches[0];

    const lines = [];
    lines.push('Hello team,');
    lines.push('');

    if (nextMatch) {
      const matchDate = new Date(nextMatch.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      lines.push(`Our next match is on ${matchDate} at ${nextMatch.time}.`);
      lines.push(`Location: Court ${nextMatch.courts || 'TBA'}.`);
      lines.push(`Opponent: ${nextMatch.home_team_number === team.number ? nextMatch.away_team_name : nextMatch.home_team_name}.`);
      lines.push('');
    }

    lines.push('Please let me know your availability and if you have any questions.');
    lines.push('Thanks!');

    const body = encodeURIComponent(lines.join('\n'));

    const mailtoLink = `mailto:${emails.join(',')}` +
      `?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const loadAvailablePlayers = async () => {
    if (!team) return;

    setRosterManagerLoading(true);
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('player_to_team')
        .select('player');

      if (assignmentsError) throw assignmentsError;

      const assignedIds = new Set((assignments || []).map((entry) => entry.player));

      const { data: activePlayers, error: activeError } = await supabase
        .from('player')
        .select('id, first_name, last_name, email, ranking')
        .eq('is_active', true);

      if (activeError) throw activeError;

      const freePlayers = (activePlayers || []).filter((player) => !assignedIds.has(player.id));
      setAvailablePlayers(freePlayers);
    } catch (err) {
      console.error('Error loading available players:', err);
      setError('Unable to load available players. Please try again.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setRosterManagerLoading(false);
    }
  };

  const openRosterManager = async () => {
    setRosterManagerOpen(true);
    await loadAvailablePlayers();
  };

  const closeRosterManager = () => {
    setRosterManagerOpen(false);
  };

  const handleRemoveFromRoster = async (playerId) => {
    if (!team) return;

    try {
      const { error: removeError } = await supabase
        .from('player_to_team')
        .delete()
        .eq('player', playerId)
        .eq('team', team.id);

      if (removeError) throw removeError;

      await loadTeamRoster(team.id);
      await loadAvailablePlayers();
      setSuccess('Player removed from team.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error removing player:', err);
      setError('Failed to remove player from roster.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleAddToRoster = async (playerId) => {
    if (!team) return;

    try {
      const { error: addError } = await supabase
        .from('player_to_team')
        .insert({ team: team.id, player: playerId });

      if (addError) throw addError;

      await loadTeamRoster(team.id);
      await loadAvailablePlayers();
      setSuccess('Player added to team.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding player:', err);
      setError('Failed to add player to roster.');
      setTimeout(() => setError(''), 4000);
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
      const availableCount = rosterData.filter(player => !player.is_injured).length;
      setPlayersAvailable(availableCount);
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

  const loadSeasonRecord = async (teamNumber) => {
    try {
      const { data: results, error } = await supabase
        .from('matches')
        .select('id, home_team_number, away_team_number, home_score, away_score')
        .or(`home_team_number.eq.${teamNumber},away_team_number.eq.${teamNumber}`)
        .not('home_score', 'is', null)
        .not('away_score', 'is', null);

      if (error) throw error;

      let wins = 0;
      let losses = 0;

      (results || []).forEach(result => {
        const isHome = result.home_team_number === teamNumber;
        const teamScore = isHome ? result.home_score : result.away_score;
        const opponentScore = isHome ? result.away_score : result.home_score;

        if (teamScore > opponentScore) {
          wins += 1;
        } else {
          losses += 1;
        }
      });

      setSeasonWins(wins);
      setSeasonLosses(losses);
    } catch (err) {
      console.error('Error loading season record:', err);
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
      <div className="captain-header">
        <h1>Captain Dashboard</h1>
        <p>Manage your roster, monitor upcoming matches, and access captain tools at a glance.</p>
      </div>

      {team && (
        <div className="captain-team-banner card card--interactive card--overlay">
          <div className="team-emblem">🎾</div>
          <div className="team-meta-block">
            <span className="team-meta-label">Team Overview</span>
            <span className="team-meta-name">Team {team.number} · {team.name}</span>
            <span className="team-meta-info">{team.play_night} Night League • {roster.length} Active Players</span>
          </div>
        </div>
      )}

      <div className="captain-overview">
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Season Record</div>
          <div className="card-value">{seasonWins} - {seasonLosses}</div>
          <div className="card-subtitle">Wins · Losses</div>
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Upcoming Matches</div>
          <div className="card-value">{upcomingMatches.length}</div>
          <div className="card-subtitle">Next 30 days</div>
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Roster Availability</div>
          <div className="card-value">{playersAvailable}</div>
          <div className="card-subtitle">Players cleared for play</div>
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Recent Activity</div>
          <div className="card-value">{success ? 'Updated' : error ? 'Attention' : 'Stable'}</div>
          <div className="card-subtitle">Team updates this week</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <section className="captain-section card card--interactive">
          <div className="section-header">
            <div>
              <h2>Team Roster Management</h2>
              <p>Maintain player details, rankings, and contact information.</p>
            </div>
            <div className="section-actions">
              <button type="button" className="section-action" onClick={openRosterManager}>
                Manage Roster
              </button>
              <button type="button" className="section-action">Export Roster</button>
            </div>
          </div>
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
                        {[1, 2, 3, 4, 5].map(rank => (
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

        <section className="captain-section card card--interactive">
          <div className="section-header">
            <div>
              <h2>Upcoming Matches</h2>
              <p>Plan lineups, assign captains, and prepare for match night.</p>
            </div>
            <button className="section-action">Manage Lineups</button>
          </div>
          <div className="matches-timeline">
            {upcomingMatches.length === 0 ? (
              <div className="empty-state card card--flat">
                <h3>No upcoming matches scheduled</h3>
                <p>Once new matches are scheduled they will appear here.</p>
              </div>
            ) : (
              upcomingMatches.map((match) => (
                <div key={match.id} className="match-card card card--interactive card--overlay">
                  <div className="match-card-header">
                    <div className="match-date">
                      {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <span className="match-tag">{match.time} • Court {match.courts}</span>
                  </div>
                  <div className="match-teams">
                    <span className="team-home">{match.home_team_name}</span>
                    <span className="vs-label">vs</span>
                    <span className="team-away">{match.away_team_name}</span>
                  </div>
                  <div className="match-meta">
                    <span>Match ID: {match.id}</span>
                    <span>{match.home_team_number === team.number ? 'Home Match' : 'Away Match'}</span>
                  </div>
                  <div className="match-actions">
                    <button className="btn-small">Send Reminder</button>
                    <button className="btn-small">View Details</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="captain-section card card--interactive">
          <div className="section-header">
            <div>
              <h2>Captain Tools</h2>
              <p>Quick access to core actions that keep your team organized.</p>
            </div>
          </div>
          <div className="tools-grid">
            <button
              type="button"
              className="tool-card card card--interactive"
              onClick={handleEmailTeam}
              disabled={roster.every(player => !player.email)}
            >
              <div className="tool-icon">📧</div>
              <h3>Send Team Email</h3>
              <p>Send announcements to all team members.</p>
            </button>
            <button className="tool-card card card--interactive">
              <div className="tool-icon">🔄</div>
              <h3>Request Substitutes</h3>
              <p>Find subs for upcoming matches.</p>
            </button>
            <button className="tool-card card card--interactive">
              <div className="tool-icon">📊</div>
              <h3>View Team Stats</h3>
              <p>See team performance and statistics.</p>
            </button>
          </div>
        </section>
      </div>

      {rosterManagerOpen && (
        <div className="roster-manager-overlay" role="dialog" aria-modal="true">
          <div className="roster-manager-modal card card--interactive">
            <div className="roster-manager-header">
              <div>
                <h3>Manage Team Roster</h3>
                <p>Add active free agents or remove players from your lineup.</p>
              </div>
              <button type="button" className="btn-small" onClick={closeRosterManager}>
                Close
              </button>
            </div>

            <div className="roster-manager-columns">
              <div className="roster-column">
                <h4>Current Roster</h4>
                {roster.length === 0 ? (
                  <p>No players assigned to this team.</p>
                ) : (
                  <ul className="roster-manager-list">
                    {roster.map((player) => (
                      <li key={player.id}>
                        <div>
                          <strong>{player.first_name} {player.last_name}</strong>
                          <span>{player.email || 'No email'}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-small btn-danger"
                          onClick={() => handleRemoveFromRoster(player.id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="roster-column">
                <h4>Available Players</h4>
                {rosterManagerLoading ? (
                  <p>Loading available players…</p>
                ) : availablePlayers.length === 0 ? (
                  <p>No available active players found.</p>
                ) : (
                  <ul className="roster-manager-list">
                    {availablePlayers.map((player) => (
                      <li key={player.id}>
                        <div>
                          <strong>{player.first_name} {player.last_name}</strong>
                          <span>{player.email || 'No email'} · Rank {player.ranking}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-small"
                          onClick={() => handleAddToRoster(player.id)}
                        >
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
