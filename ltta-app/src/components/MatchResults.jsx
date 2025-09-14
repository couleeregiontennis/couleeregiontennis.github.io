import React, { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';

export function MatchResults({ teamNumber, teamNight }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMatchResults = async () => {
      try {
        setLoading(true);
        
        // Load matches where this team is either home or away
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select(`
            *,
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
            ),
            match_scores (
              home_lines_won,
              away_lines_won,
              home_total_games,
              away_total_games,
              home_won
            )
          `)
          .or(`home_team_number.eq.${teamNumber},away_team_number.eq.${teamNumber}`)
          .eq('status', 'completed')
          .order('date', { ascending: false });

        if (matchError) throw matchError;
        
        setMatches(matchData || []);
      } catch (err) {
        setError('Error loading match results: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (teamNumber && teamNight) {
      loadMatchResults();
    }
  }, [teamNumber, teamNight]);

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
              const isHomeTeam = match.home_team_number === parseInt(teamNumber);
              const opponent = isHomeTeam ? match.away_team_name : match.home_team_name;
              const teamWon = isHomeTeam ? match.match_scores?.[0]?.home_won : !match.match_scores?.[0]?.home_won;
              const linesWon = isHomeTeam ? 
                match.match_scores?.[0]?.home_lines_won : 
                match.match_scores?.[0]?.away_lines_won;
              const totalLines = match.line_results?.length || 0;
              const games = isHomeTeam ? 
                match.match_scores?.[0]?.home_total_games : 
                match.match_scores?.[0]?.away_total_games;
              const opponentGames = isHomeTeam ? 
                match.match_scores?.[0]?.away_total_games : 
                match.match_scores?.[0]?.home_total_games;

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
}
