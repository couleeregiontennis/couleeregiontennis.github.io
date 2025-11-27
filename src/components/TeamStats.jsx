import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTeamStatsData } from '../hooks/useTeamStatsData';
import '../styles/TeamStats.css';

export const TeamStats = () => {
  const {
    loading,
    error,
    team,
    roster,
    teamRecord,
    teamLineStats,
    recentMatches,
    playerStats,
    winPercentage,
    lineWinPercentage,
    gamesWinPercentage,
    refresh
  } = useTeamStatsData();

  const matchesPlayed = teamRecord.wins + teamRecord.losses;
  const teamNumber = team?.number ?? null;

  const sortedPlayerStats = useMemo(() => {
    return [...playerStats].sort((a, b) => {
      const aTotal = a.wins + a.losses;
      const bTotal = b.wins + b.losses;
      const aPct = aTotal ? a.wins / aTotal : 0;
      const bPct = bTotal ? b.wins / bTotal : 0;

      if (bPct !== aPct) return bPct - aPct;
      return (b.matchesPlayed || 0) - (a.matchesPlayed || 0);
    });
  }, [playerStats]);

  if (loading) {
    return <div className="team-stats loading">Loading team performance…</div>;
  }

  if (error) {
    return <div className="team-stats error">{error}</div>;
  }

  return (
    <div className="team-stats team-performance-page">
      <div className="team-stats-toolbar section-actions">
        <Link to="/captain-dashboard" className="section-action">← Back to Dashboard</Link>
        <button type="button" className="section-action" onClick={refresh}>
          Refresh Data
        </button>
      </div>

      <div className="team-stats-header">
        <h1>Team Performance</h1>
        <p>Comprehensive performance analytics for your team and players.</p>
      </div>

      {team && (
        <div className="team-banner card card--interactive card--overlay">
          <div className="team-emblem">📊</div>
          <div className="team-meta-block">
            <span className="team-meta-label">Statistics for</span>
            <span className="team-meta-name">Team {team.number} · {team.name}</span>
            <span className="team-meta-info">{team.play_night} Night League • {roster.length} Players</span>
          </div>
        </div>
      )}

      <div className="stats-overview">
        <div className="stat-card card card--interactive card--overlay">
          <div className="stat-label">Match Record</div>
          <div className="stat-value">{teamRecord.wins} - {teamRecord.losses}</div>
          <div className="stat-subtitle">{winPercentage}% Win Rate</div>
        </div>
        <div className="stat-card card card--interactive card--overlay">
          <div className="stat-label">Line Record</div>
          <div className="stat-value">{teamLineStats.linesWon} - {teamLineStats.linesLost}</div>
          <div className="stat-subtitle">{lineWinPercentage}% Line Win Rate</div>
        </div>
        <div className="stat-card card card--interactive card--overlay">
          <div className="stat-label">Games Record</div>
          <div className="stat-value">{teamLineStats.gamesWon} - {teamLineStats.gamesLost}</div>
          <div className="stat-subtitle">{gamesWinPercentage}% Games Won</div>
        </div>
        <div className="stat-card card card--interactive card--overlay">
          <div className="stat-label">Matches Played</div>
          <div className="stat-value">{matchesPlayed}</div>
          <div className="stat-subtitle">This Season</div>
        </div>
      </div>

      <div className="stats-sections">
        <section className="stats-section card card--interactive">
          <div className="section-header">
            <div>
              <h2>Player Performance</h2>
              <p>Individual statistics for each team member.</p>
            </div>
          </div>
          <div className="player-stats-table">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Rank</th>
                  <th>Matches</th>
                  <th>Record</th>
                  <th>Win %</th>
                  <th>Singles</th>
                  <th>Doubles</th>
                  <th>Games</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayerStats.map((player) => {
                  const total = player.wins + player.losses;
                  const winPct = total > 0 ? ((player.wins / total) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={player.id}>
                      <td data-label="Player">
                        <div className="player-name">
                          {player.first_name} {player.last_name}
                          {player.is_captain && <span className="captain-badge">👑</span>}
                        </div>
                      </td>
                      <td data-label="Rank">#{player.ranking}</td>
                      <td data-label="Matches">{player.matchesPlayed}</td>
                      <td data-label="Record">{player.wins} - {player.losses}</td>
                      <td data-label="Win %">{winPct}%</td>
                      <td data-label="Singles">{player.singlesRecord.wins} - {player.singlesRecord.losses}</td>
                      <td data-label="Doubles">{player.doublesRecord.wins} - {player.doublesRecord.losses}</td>
                      <td data-label="Games">{player.gamesWon} - {player.gamesLost}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stats-section card card--interactive">
          <div className="section-header">
            <div>
              <h2>Recent Match History</h2>
              <p>Last 10 matches played by the team.</p>
            </div>
          </div>
          <div className="recent-matches">
            {recentMatches.length === 0 ? (
              <div className="empty-state">
                <p>No match history available.</p>
              </div>
            ) : (
              recentMatches.map((matchEntry) => {
                const matchDate = matchEntry.date
                  ? new Date(matchEntry.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'Date TBA';

                const isHomeTeam = teamNumber !== null && matchEntry.home_team_number === teamNumber;
                const resultClass = matchEntry.teamWon === null
                  ? 'result-pending'
                  : matchEntry.teamWon
                    ? 'result-win'
                    : 'result-loss';

                let scoreDisplay = 'Pending';
                if (matchEntry.teamLines !== null && matchEntry.opponentLines !== null) {
                  scoreDisplay = `${matchEntry.teamLines} - ${matchEntry.opponentLines} Lines`;
                } else if (matchEntry.teamGames !== null && matchEntry.opponentGames !== null) {
                  scoreDisplay = `${matchEntry.teamGames} - ${matchEntry.opponentGames} Games`;
                }

                return (
                  <div key={matchEntry.id} className="match-history-card card card--subtle">
                    <div className="match-date">{matchDate}</div>
                    <div className="match-teams">
                      <span className={isHomeTeam ? 'team-us' : 'team-opponent'}>
                        {matchEntry.home_team_name}
                      </span>
                      <span className="vs-label">vs</span>
                      <span className={!isHomeTeam ? 'team-us' : 'team-opponent'}>
                        {matchEntry.away_team_name}
                      </span>
                    </div>
                    <div className="match-result">
                      <span className={resultClass}>{scoreDisplay}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
