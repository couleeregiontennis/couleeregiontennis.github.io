import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../scripts/supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { LoadingSpinner } from './LoadingSpinner';
import '../styles/MatchSchedule.css';

// OPTIMIZATION: Move static helpers outside component to avoid recreation
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (timeString) => {
  return timeString || 'TBD';
};

const getMatchStatus = (match) => {
  const matchDate = new Date(match.date);
  const now = new Date();

  if (match.status === 'completed') {
    return 'completed';
  } else if (matchDate < now && match.status === 'scheduled') {
    return 'pending-result';
  } else {
    return 'upcoming';
  }
};

const getStatusBadge = (status) => {
  const badges = {
    'upcoming': { text: 'Upcoming', class: 'status-upcoming' },
    'completed': { text: 'Completed', class: 'status-completed' },
    'pending-result': { text: 'Pending Result', class: 'status-pending' }
  };
  return badges[status] || badges['upcoming'];
};

const groupMatchesByDate = (matches) => {
  const grouped = {};
  matches.forEach(match => {
    const dateKey = new Date(match.date).toDateString();
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(match);
  });
  return grouped;
};

export const MatchSchedule = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedTeam, setSelectedTeam] = useState('all');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [matchesResponse, teamsResponse] = await Promise.all([
        supabase.from('matches')
          .select('id, date, time, status, courts, home_team_name, away_team_name, home_team_number, away_team_number')
          .order('date', { ascending: true }),
        supabase.from('team')
          .select('id, name, number')
          .order('name')
      ]);

      // Process Matches
      if (matchesResponse.error) throw matchesResponse.error;
      setMatches(matchesResponse.data || []);

      // Process Teams
      if (teamsResponse.error) throw teamsResponse.error;
      const teamsData = teamsResponse.data;
      setTeams(Array.isArray(teamsData) ? teamsData : []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // OPTIMIZATION: Memoize filtered matches to avoid recalculation on every render
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Filter by selected team
    if (selectedTeam !== 'all') {
      const selectedTeamData = teams.find(t => t.id === selectedTeam);
      if (selectedTeamData) {
        filtered = filtered.filter(match => 
          match.home_team_number === selectedTeamData.number || 
          match.away_team_number === selectedTeamData.number
        );
      }
    }

    // Filter by current view period
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    if (viewMode === 'month') {
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate >= startOfMonth && matchDate <= endOfMonth;
      });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate >= startOfWeek && matchDate <= endOfWeek;
      });
    }

    return filtered;
  }, [matches, teams, selectedTeam, viewMode, currentDate]);

  // OPTIMIZATION: Memoize grouped matches
  const groupedMatches = useMemo(() => groupMatchesByDate(filteredMatches), [filteredMatches]);

  // OPTIMIZATION: Memoize counts
  const counts = useMemo(() => {
    return {
      completed: filteredMatches.filter(m => getMatchStatus(m) === 'completed').length,
      upcoming: filteredMatches.filter(m => getMatchStatus(m) === 'upcoming').length,
      pending: filteredMatches.filter(m => getMatchStatus(m) === 'pending-result').length
    };
  }, [filteredMatches]);

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    }
    
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'All Matches';
  };

  if (loading) {
    return (
      <div className="match-schedule">
        <div className="schedule-shell">
          <div className="loading">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-schedule">
        <div className="schedule-shell">
          <div className="error">{error}</div>
          <button onClick={fetchAllData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="match-schedule">
      <div className="schedule-header">
        <h1>Match Schedule</h1>
        <p>Plan lineups, track results, and stay informed on weekly match activity.</p>
      </div>

      <div className="schedule-overview">
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Total Matches</div>
          <div className="card-value">{filteredMatches.length}</div>
          <div className="card-subtitle">Within selected filters</div>
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Upcoming</div>
          <div className="card-value">{counts.upcoming}</div>
          <div className="card-subtitle">Scheduled next</div>
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Pending Results</div>
          <div className="card-value">{counts.pending}</div>
          <div className="card-subtitle">Awaiting score entry</div>
        </div>
        <div className="overview-card card card--interactive card--overlay">
          <div className="card-label">Completed</div>
          <div className="card-value">{counts.completed}</div>
          <div className="card-subtitle">With final scores</div>
        </div>
      </div>

      <div className="schedule-controls card card--interactive card--overlay">
        <div className="control-row">
          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
              aria-pressed={viewMode === 'month'}
            >
              Month
            </button>
            <button
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
              aria-pressed={viewMode === 'week'}
            >
              Week
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >
              List
            </button>
          </div>

          <div className="date-navigation">
            <button onClick={() => navigateDate(-1)} className="nav-btn" aria-label="Previous period">
              ←
            </button>
            <span className="date-range">{getDateRangeText()}</span>
            <button onClick={() => navigateDate(1)} className="nav-btn" aria-label="Next period">
              →
            </button>
          </div>

          <div className="filter-controls">
            <label htmlFor="team-filter" className="filter-label">Team</label>
            <select
              id="team-filter"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="team-filter"
            >
              <option value="all">All Teams</option>
              {Array.isArray(teams) && teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="schedule-content">
        {Object.keys(groupedMatches).length > 0 ? (
          <div className={`matches-container ${viewMode}`}>
            {Object.entries(groupedMatches)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([dateKey, dayMatches]) => (
                <section key={dateKey} className="day-section">
                  <header className="day-header">
                    <div className="day-title">
                      {new Date(dateKey).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="day-count">{dayMatches.length} match{dayMatches.length === 1 ? '' : 'es'}</div>
                  </header>

                  <div className="day-matches">
                    {dayMatches.map(match => {
                      const status = getMatchStatus(match);
                      const statusBadge = getStatusBadge(status);

                      return (
                        <article
                          key={match.id}
                          className={`match-card card card--interactive card--overlay ${status}`}
                        >
                          <div className="match-meta">
                            <span className="match-time">{formatTime(match.time)}</span>
                            <span className={`status-badge ${statusBadge.class}`}>{statusBadge.text}</span>
                          </div>

                          <div className="match-teams">
                            <div className="team home-team">
                              <span className="team-name">{match.home_team_name}</span>
                            </div>
                            <span className="vs">vs</span>
                            <div className="team away-team">
                              <span className="team-name">{match.away_team_name}</span>
                            </div>
                          </div>

                          <div className="match-details">
                            <span className="location">📍 {match.courts || 'TBD'}</span>
                            <span className="match-id">Match #{match.id}</span>
                          </div>

                          {status === 'completed' && (
                            <div className="match-result">
                              Final score submitted
                              {userRole?.isAdmin && (
                                <button
                                  className="edit-result-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/add-score?matchId=${match.id}&edit=true`);
                                  }}
                                  aria-label="Edit Result"
                                >
                                  Edit Result
                                </button>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
          </div>
        ) : (
          <div className="no-matches card card--interactive card--overlay">
            <p>No matches found for the selected period and filters.</p>
            <button
              onClick={() => {
                setSelectedTeam('all');
                setCurrentDate(new Date());
              }}
              className="reset-filters-btn"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <div className="schedule-actions">
        <button onClick={fetchAllData} className="refresh-btn">
          🔄 Refresh Schedule
        </button>
      </div>
    </div>
  );
};
