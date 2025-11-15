import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../scripts/supabaseClient';
import '../styles/Team.css';

const formatDateUS = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
};

const normalizeDay = (day) => (day || '').toLowerCase();

const getDayLabel = (day) => {
  switch (normalizeDay(day)) {
    case 'tuesday':
      return 'Tuesday';
    case 'wednesday':
      return 'Wednesday';
    default:
      return null;
  }
};

export const AllMatches = () => {
  const { day } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');

  const dayLabel = getDayLabel(day);
  const normalizedDay = normalizeDay(day);

  const loadData = useCallback(async () => {
    if (!dayLabel) {
      setError('Unknown league night requested.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: teamsData, error: teamsError } = await supabase
        .from('team')
        .select('id, number, name, play_night')
        .eq('play_night', normalizedDay)
        .order('number');

      if (teamsError) throw teamsError;

      setTeams(teamsData || []);

      if (!teamsData || teamsData.length === 0) {
        setMatches([]);
        return;
      }

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (matchesError) throw matchesError;

      const teamNumbers = new Set(teamsData.map((team) => Number(team.number)));

      const relevantMatches = (matchesData || []).filter((match) => {
        const homeNumber = Number(match.home_team_number);
        const awayNumber = Number(match.away_team_number);
        return teamNumbers.has(homeNumber) || teamNumbers.has(awayNumber);
      });

      setMatches(relevantMatches);
    } catch (err) {
      console.error('Error loading all matches view:', err);
      setError('Unable to load match data right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [dayLabel, normalizedDay]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMatches = useMemo(() => {
    if (selectedTeam === 'all') {
      return matches;
    }

    const teamNumber = Number(selectedTeam);
    return matches.filter((match) => {
      return (
        Number(match.home_team_number) === teamNumber ||
        Number(match.away_team_number) === teamNumber
      );
    });
  }, [matches, selectedTeam]);

  const groupedByDate = useMemo(() => {
    return filteredMatches.reduce((groups, match) => {
      const key = match.date || 'Unknown Date';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(match);
      return groups;
    }, {});
  }, [filteredMatches]);

  if (!dayLabel) {
    return (
      <div className="team-page">
        <h1 className="team-name">All Matches</h1>
        <div className="loading">We couldn't determine which league night you requested.</div>
      </div>
    );
  }

  return (
    <div className="team-page">
      <h1 className="team-name">All {dayLabel} Matches</h1>
      <section className="schedule-section">
        <div className="schedule-controls" style={{ gap: '1rem' }}>
          <div className="team-meta">
            <div className="team-meta-block">
              <span className="team-meta-label">League Night</span>
              <span className="team-meta-name">{dayLabel} Night League</span>
              <span className="team-meta-info">
                Browse every scheduled matchup and jump into a specific team view.
              </span>
            </div>
          </div>

          <div className="filter-controls" style={{ marginTop: '1rem' }}>
            <label htmlFor="team-select" className="filter-label">
              Filter by team
            </label>
            <select
              id="team-select"
              className="team-filter"
              value={selectedTeam}
              onChange={(event) => setSelectedTeam(event.target.value)}
            >
              <option value="all">All teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.number}>
                  Team {team.number} · {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading matches...</div>
        ) : error ? (
          <div className="error-state card card--interactive">
            <p>{error}</p>
            <button
              type="button"
              className="refresh-btn"
              onClick={() => {
                setSelectedTeam('all');
                loadData();
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="loading">No matches have been scheduled for this filter yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Matchup</th>
                  <th>Courts</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByDate)
                  .sort((a, b) => new Date(a) - new Date(b))
                  .flatMap((dateKey) => {
                    const dayMatches = groupedByDate[dateKey];
                    return dayMatches
                      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                      .map((match) => {
                        const homeNumber = Number(match.home_team_number);
                        const awayNumber = Number(match.away_team_number);
                        const homeTeam = teams.find((team) => Number(team.number) === homeNumber);
                        const awayTeam = teams.find((team) => Number(team.number) === awayNumber);

                        return (
                          <tr key={`${match.id}-${match.week || match.date}`}
                            className={match.status === 'completed' ? 'completed' : ''}
                          >
                            <td data-label="Date">{formatDateUS(match.date)}</td>
                            <td data-label="Time">{match.time || 'TBD'}</td>
                            <td data-label="Matchup">
                              <div className="date-time">
                                <Link to={`/team/${normalizedDay}/${homeNumber}`} className="team-link">
                                  {homeTeam ? homeTeam.name : match.home_team_name}
                                </Link>
                                <span style={{ margin: '0 0.5rem' }}>vs</span>
                                <Link to={`/team/${normalizedDay}/${awayNumber}`} className="team-link">
                                  {awayTeam ? awayTeam.name : match.away_team_name}
                                </Link>
                              </div>
                            </td>
                            <td data-label="Courts">{match.courts || 'TBD'}</td>
                            <td data-label="Details">
                              Week {match.week ?? '—'} · Match #{match.id}
                            </td>
                          </tr>
                        );
                      });
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
