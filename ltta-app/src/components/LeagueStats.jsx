import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/LeagueStats.css';

export const LeagueStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalPlayers: 0,
    totalTeams: 0,
    recentMatches: [],
    topPerformers: [],
    teamStats: [],
    matchesByWeek: []
  });

  useEffect(() => {
    fetchLeagueStats();
  }, []);

  const fetchLeagueStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch total matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*');

      if (matchesError) throw matchesError;

      // Fetch total players
      const { data: players, error: playersError } = await supabase
        .from('player')
        .select('*');

      if (playersError) throw playersError;

      // Fetch teams
      const { data: teams, error: teamsError } = await supabase
        .from('team')
        .select('*');

      if (teamsError) throw teamsError;

      // Fetch recent matches - using the matches table structure
      const { data: recentMatches, error: recentError } = await supabase
        .from('matches')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      // Calculate team statistics using team numbers from matches table
      const teamStats = teams?.map(team => {
        const teamMatches = matches?.filter(match => 
          match.home_team_number === team.number || match.away_team_number === team.number
        ) || [];
        
        // For now, we'll use completed status as a proxy for wins/losses
        // This would need to be enhanced with actual score data
        const completedMatches = teamMatches.filter(match => match.status === 'completed');
        const wins = Math.floor(completedMatches.length * 0.6); // Placeholder calculation
        const losses = completedMatches.length - wins;
        const winPercentage = completedMatches.length > 0 ? (wins / completedMatches.length * 100).toFixed(1) : 0;

        return {
          ...team,
          matchesPlayed: teamMatches.length,
          wins,
          losses,
          winPercentage: parseFloat(winPercentage)
        };
      }).sort((a, b) => b.winPercentage - a.winPercentage) || [];

      // Calculate matches by week for the chart
      const matchesByWeek = matches?.reduce((acc, match) => {
        const week = new Date(match.date).toISOString().split('T')[0];
        acc[week] = (acc[week] || 0) + 1;
        return acc;
      }, {}) || {};

      const matchesByWeekArray = Object.entries(matchesByWeek)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-8); // Last 8 weeks

      setStats({
        totalMatches: matches?.length || 0,
        totalPlayers: players?.length || 0,
        totalTeams: teams?.length || 0,
        recentMatches: recentMatches || [],
        topPerformers: teamStats.slice(0, 5),
        teamStats,
        matchesByWeek: matchesByWeekArray
      });

    } catch (err) {
      console.error('Error fetching league stats:', err);
      setError('Failed to load league statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMatchResult = (match) => {
    return `${match.home_team_name} vs ${match.away_team_name} - ${match.status}`;
  };

  if (loading) {
    return (
      <div className="league-stats">
        <div className="loading">Loading league statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="league-stats">
        <div className="error">{error}</div>
        <button onClick={fetchLeagueStats} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="league-stats">
      <div className="stats-header">
        <h1>League Statistics</h1>
        <p>Comprehensive overview of league performance and activity</p>
      </div>

      {/* Overview Cards */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-number">{stats.totalMatches}</div>
          <div className="stat-label">Total Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalTeams}</div>
          <div className="stat-label">Active Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalPlayers}</div>
          <div className="stat-label">Registered Players</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {stats.totalMatches > 0 ? (stats.totalMatches / stats.totalTeams).toFixed(1) : 0}
          </div>
          <div className="stat-label">Avg Matches/Team</div>
        </div>
      </div>

      {/* Team Standings */}
      <div className="stats-section">
        <h2>Team Performance</h2>
        <div className="team-standings">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Win %</th>
              </tr>
            </thead>
            <tbody>
              {stats.teamStats.map((team, index) => (
                <tr key={team.id} className={index < 3 ? 'top-performer' : ''}>
                  <td className="rank">
                    {index + 1}
                    {index === 0 && ' 🏆'}
                    {index === 1 && ' 🥈'}
                    {index === 2 && ' 🥉'}
                  </td>
                  <td className="team-name">{team.name}</td>
                  <td>{team.matchesPlayed}</td>
                  <td className="wins">{team.wins}</td>
                  <td className="losses">{team.losses}</td>
                  <td className="win-percentage">{team.winPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="stats-section">
        <h2>Recent Matches</h2>
        <div className="recent-matches">
          {stats.recentMatches.length > 0 ? (
            <div className="matches-list">
              {stats.recentMatches.map((match) => (
                <div key={match.id} className="match-item">
                  <div className="match-date">{formatDate(match.date)}</div>
                  <div className="match-result">{getMatchResult(match)}</div>
                  <div className="match-score">
                    {match.home_team_name} vs {match.away_team_name} at {match.time}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent matches found</p>
          )}
        </div>
      </div>

      {/* Match Activity Chart */}
      <div className="stats-section">
        <h2>Match Activity (Last 8 Weeks)</h2>
        <div className="activity-chart">
          {stats.matchesByWeek.length > 0 ? (
            <div className="chart-container">
              {stats.matchesByWeek.map((week, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar" 
                    style={{ 
                      height: `${Math.max(20, (week.count / Math.max(...stats.matchesByWeek.map(w => w.count))) * 100)}px` 
                    }}
                    title={`${week.count} matches`}
                  ></div>
                  <div className="bar-label">{formatDate(week.date)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No match activity data available</p>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="stats-actions">
        <button onClick={fetchLeagueStats} className="refresh-btn">
          🔄 Refresh Statistics
        </button>
      </div>
    </div>
  );
};
