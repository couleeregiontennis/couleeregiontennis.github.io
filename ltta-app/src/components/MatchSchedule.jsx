import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/MatchSchedule.css';

export const MatchSchedule = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'list'
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (err) {
      console.error('Error checking user:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch matches with team information
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('date', { ascending: true });

      if (matchesError) throw matchesError;

      // Fetch teams for filter dropdown
      const { data: teamsData, error: teamsError } = await supabase
        .from('team')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;

      setMatches(matchesData || []);
      setTeams(teamsData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMatches = () => {
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
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    // The time field is already a string in the matches table
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

  if (loading) {
    return (
      <div className="match-schedule">
        <div className="loading">Loading match schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-schedule">
        <div className="error">{error}</div>
        <button onClick={fetchData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();
  const groupedMatches = groupMatchesByDate(filteredMatches);

  return (
    <div className="match-schedule">
      <div className="schedule-header">
        <h1>Match Schedule</h1>
        <p>View and manage tennis league matches</p>
      </div>

      {/* Controls */}
      <div className="schedule-controls">
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>

        <div className="date-navigation">
          <button onClick={() => navigateDate(-1)} className="nav-btn">
            ← Previous
          </button>
          <span className="date-range">{getDateRangeText()}</span>
          <button onClick={() => navigateDate(1)} className="nav-btn">
            Next →
          </button>
        </div>

        <div className="filter-controls">
          <select 
            value={selectedTeam} 
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="team-filter"
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Match Display */}
      <div className="schedule-content">
        {Object.keys(groupedMatches).length > 0 ? (
          <div className={`matches-container ${viewMode}`}>
            {Object.entries(groupedMatches)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([dateKey, dayMatches]) => (
                <div key={dateKey} className="day-section">
                  <h3 className="day-header">
                    {new Date(dateKey).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                  
                  <div className="day-matches">
                    {dayMatches.map(match => {
                      const status = getMatchStatus(match);
                      const statusBadge = getStatusBadge(status);
                      
                      return (
                        <div key={match.id} className={`match-card ${status}`}>
                          <div className="match-time">
                            {formatTime(match.time)}
                          </div>
                          
                          <div className="match-teams">
                            <div className="team home-team">
                              <span className="team-name">{match.home_team_name}</span>
                            </div>
                            
                            <div className="vs">vs</div>
                            
                            <div className="team away-team">
                              <span className="team-name">{match.away_team_name}</span>
                            </div>
                          </div>
                          
                          <div className="match-info">
                            <span className={`status-badge ${statusBadge.class}`}>
                              {statusBadge.text}
                            </span>
                            <span className="location">📍 {match.courts}</span>
                          </div>
                          
                          {status === 'completed' && (
                            <div className="match-result">
                              Match completed - {match.status}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="no-matches">
            <p>No matches found for the selected period and filters.</p>
            <button onClick={() => {
              setSelectedTeam('all');
              setCurrentDate(new Date());
            }} className="reset-filters-btn">
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="schedule-summary">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-number">{filteredMatches.length}</span>
            <span className="stat-label">Total Matches</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {filteredMatches.filter(m => getMatchStatus(m) === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {filteredMatches.filter(m => getMatchStatus(m) === 'upcoming').length}
            </span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {filteredMatches.filter(m => getMatchStatus(m) === 'pending-result').length}
            </span>
            <span className="stat-label">Pending Results</span>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="schedule-actions">
        <button onClick={fetchData} className="refresh-btn">
          🔄 Refresh Schedule
        </button>
      </div>
    </div>
  );
};
