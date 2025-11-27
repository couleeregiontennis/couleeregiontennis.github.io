import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';

export const MySchedule = () => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMySchedule = async () => {
      try {
        setLoading(true);

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setError('You must be logged in to view your schedule.');
          setLoading(false);
          return;
        }

        // Get the player associated with this user
        const { data: playerData, error: playerError } = await supabase
          .from('player')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (playerError) throw playerError;

        // Get the player's teams
        const { data: teamData, error: teamError } = await supabase
          .from('player_to_team')
          .select(`
            team (id, name, number, play_night)
          `)
          .eq('player', playerData.id);

        if (teamError) throw teamError;

        const teams = teamData.map(t => t.team);
        setTeamInfo(teams);

        if (teams.length === 0) {
          setError('You are not currently assigned to any teams.');
          setLoading(false);
          return;
        }

        // Get upcoming matches for all user's teams
        const teamIds = teams.map(t => t.id);
        const { data: matchData, error: matchError } = await supabase
          .from('team_match')
          .select(`
            *,
            home_team:home_team_id (name, number, play_night),
            away_team:away_team_id (name, number, play_night),
            line_results (
              line_number,
              match_type,
              home_player_1_id,
              home_player_2_id,
              away_player_1_id,
              away_player_2_id
            )
          `)
          .in('home_team_id', teamIds)
          .in('away_team_id', teamIds)
          .gte('date', new Date().toISOString().split('T')[0])
          .eq('status', 'scheduled')
          .order('date', { ascending: true });

        if (matchError) throw matchError;

        setUpcomingMatches(matchData || []);
      } catch (err) {
        setError('Error loading schedule: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMySchedule();
  }, []);

  if (loading) return <div className="my-schedule-loading">Loading your schedule...</div>;
  if (error) return <div className="my-schedule-error">{error}</div>;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    return timeStr;
  };

  const isPlayerInLine = (line, playerId, isHomeTeam) => {
    if (isHomeTeam) {
      return line.home_player_1_id === playerId || line.home_player_2_id === playerId;
    } else {
      return line.away_player_1_id === playerId || line.away_player_2_id === playerId;
    }
  };

  const playerId = upcomingMatches.length > 0 ? 'current_player_id' : null;

  return (
    <div className="my-schedule">
      <h1>My Schedule</h1>

      {teamInfo && (
        <div className="my-teams-info">
          <h2>My Teams</h2>
          <ul>
            {teamInfo.map(team => (
              <li key={team.id}>
                Team {team.number} - {team.name} ({team.play_night})
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcomingMatches.length > 0 ? (
        <div className="schedule-table-container">
          <h2>Upcoming Matches</h2>
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Opponent</th>
                <th>My Team</th>
                <th>Courts</th>
                <th>I'm Playing</th>
              </tr>
            </thead>
            <tbody>
              {upcomingMatches.map(match => {
                const isHomeTeam = teamInfo?.some(t => t.id === match.home_team.id);
                const opponent = isHomeTeam ? match.away_team : match.home_team;
                const myTeam = isHomeTeam ? match.home_team : match.away_team;

                const isPlaying = match.line_results?.some(line =>
                  isPlayerInLine(line, playerId, isHomeTeam)
                );

                return (
                  <tr key={match.id} className={isPlaying ? 'highlight' : ''}>
                    <td>{formatDate(match.date)}</td>
                    <td>{formatTime(match.time)}</td>
                    <td>Team {opponent.number} - {opponent.name}</td>
                    <td>Team {myTeam.number} - {myTeam.name}</td>
                    <td>{match.courts || 'TBD'}</td>
                    <td>
                      {isPlaying ? (
                        <span className="playing-badge">Yes</span>
                      ) : (
                        <span className="not-playing-badge">Not yet assigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-matches">
          <p>You have no upcoming matches scheduled.</p>
        </div>
      )}
    </div>
  );
};
