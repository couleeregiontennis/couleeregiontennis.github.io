import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';

// OPTIMIZATION: Uses teamId (UUID) for server-side filtering when available to avoid fetching all matches
export const MatchResults = ({ teamNumber, teamNight, teamId }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMatchResults = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('team_match')
          .select(`
            *,
            home_team:home_team_id (number, name, play_night),
            away_team:away_team_id (number, name, play_night),
            line_results (
              line_number,
              match_type,
              home_set_1,
              away_set_1,
              home_set_2,
              away_set_2,
              home_set_3,
              away_set_3,
              home_won
            )
          `)
          .eq('status', 'completed')
          .order('date', { ascending: false });

        // OPTIMIZATION: Filter server-side if teamId is available
        if (teamId) {
          query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
        }

        const { data: matchData, error: matchError } = await query;

        if (matchError) throw matchError;

        let filteredMatches = matchData || [];

        // Fallback: Client-side filter if teamId wasn't provided (for backward compatibility)
        if (!teamId && teamNumber) {
          filteredMatches = filteredMatches.filter(match =>
            match.home_team?.number === parseInt(teamNumber) ||
            match.away_team?.number === parseInt(teamNumber)
          );
        }

        setMatches(filteredMatches);
      } catch (err) {
        setError('Error loading match results: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (teamNumber && teamNight) {
      loadMatchResults();
    }
  }, [teamNumber, teamNight, teamId]);

  if (loading) {
    return <div className="match-results-loading">Loading match results...</div>;
  }

  if (error) {
    return <div className="match-results-error">{error}</div>;
  }

  if (matches.length === 0) {
    return <div className="match-results-empty">No match results available yet.</div>;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };


  return (
    <div className="match-results">
      <h3>Match Results</h3>
      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>Lines Won</th>
              <th>Games</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const isHomeTeam = match.home_team?.number === parseInt(teamNumber);
              const opponent = isHomeTeam ? match.away_team?.name : match.home_team?.name;
              const teamWon = isHomeTeam ? match.home_points > match.away_points : match.away_points > match.home_points;
              const linesWon = match.line_results?.filter(line => {
                const lineWonByHome = line.home_won;
                return isHomeTeam ? lineWonByHome : !lineWonByHome;
              }).length || 0;
              const totalLines = match.line_results?.length || 0;
              const games = isHomeTeam ? match.home_points : match.away_points;
              const opponentGames = isHomeTeam ? match.away_points : match.home_points;

              return (
                <tr key={match.id} className={teamWon ? 'win' : 'loss'}>
                  <td>{formatDate(match.date)}</td>
                  <td>{opponent}</td>
                  <td>
                    <span className={`result ${teamWon ? 'win' : 'loss'}`}>
                      {teamWon ? 'W' : 'L'}
                    </span>
                  </td>
                  <td>{linesWon || 0}/{totalLines}</td>
                  <td>{games || 0}-{opponentGames || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
