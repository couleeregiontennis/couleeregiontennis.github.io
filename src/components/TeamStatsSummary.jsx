import { Link } from 'react-router-dom';
import { useTeamStatsData } from '../hooks/useTeamStatsData';
import '../styles/TeamStats.css';

export const TeamStatsSummary = () => {
  const {
    loading,
    error,
    team,
    teamRecord,
    teamLineStats,
    winPercentage,
    lineWinPercentage,
    gamesWinPercentage
  } = useTeamStatsData();

  const matchesPlayed = teamRecord.wins + teamRecord.losses;

  return (
    <section className="captain-section card card--interactive team-stats-summary">
      <div className="section-header">
        <div>
          <h2>Team Performance Snapshot</h2>
          <p>Quick look at how your team is performing this season.</p>
        </div>
        <Link className="section-action" to="/team-performance">
          Open Full View
        </Link>
      </div>

      {loading && (
        <div className="summary-placeholder">
          <p>Loading current team performance…</p>
        </div>
      )}

      {error && !loading && (
        <div className="summary-placeholder summary-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="summary-grid">
            <div className="overview-card card card--interactive card--overlay">
              <div className="card-label">Match Record</div>
              <div className="card-value">{teamRecord.wins} - {teamRecord.losses}</div>
              <div className="card-subtitle">{winPercentage}% win rate</div>
            </div>
            <div className="overview-card card card--interactive card--overlay">
              <div className="card-label">Line Record</div>
              <div className="card-value">{teamLineStats.linesWon} - {teamLineStats.linesLost}</div>
              <div className="card-subtitle">{lineWinPercentage}% lines won</div>
            </div>
            <div className="overview-card card card--interactive card--overlay">
              <div className="card-label">Games Won</div>
              <div className="card-value">{teamLineStats.gamesWon}</div>
              <div className="card-subtitle">{gamesWinPercentage}% of games</div>
            </div>
            <div className="overview-card card card--interactive card--overlay">
              <div className="card-label">Matches Played</div>
              <div className="card-value">{matchesPlayed}</div>
              <div className="card-subtitle">Season total</div>
            </div>
          </div>

          {team && (
            <div className="summary-footnote">
              Team {team.number} · {team.name} • {team.play_night} Night League
            </div>
          )}
        </>
      )}
    </section>
  );
};
