import { useState, useEffect, useMemo, useCallback } from 'react';
import '../styles/Style.css';
import '../styles/Scores.css';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRXXJgqymosDbuyhAHCpHHUqQsNxRk0B-3kBGWr7CuPymhKUpT83JKyN7DxkCiaPdKsZEeBaA3GDjH/pub?gid=1910758219&single=true&output=csv';

// Simple CSV parser for this specific format (no quoted fields, no embedded commas)
const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header] = (values[i] || '').trim();
      return obj;
    }, {});
  });

  return { headers, rows };
};

// Extract week column numbers from headers
const getWeekColumns = (headers) => {
  return headers.filter((h) => /^Week\s+\d+$/i.test(h));
};

// Format a cell value for display
const formatCellValue = (value) => {
  if (value === '' || value === undefined || value === null)
    return { text: '\u2014', className: 'cell-empty' };
  if (value.toUpperCase() === 'WEATHER')
    return { text: 'WEATHER', className: 'cell-weather', title: 'Match postponed due to weather' };
  if (value === '?')
    return { text: '?', className: 'cell-unknown', title: 'Score not yet reported' };
  const num = Number(value);
  if (!isNaN(num)) return { text: value, className: 'cell-score' };
  return { text: value, className: 'cell-text' };
};

const Scores = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allRows, setAllRows] = useState([]);
  const [weekColumns, setWeekColumns] = useState([]);
  const [activeNight, setActiveNight] = useState('All');
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(CSV_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch scores (HTTP ${response.status})`);
      }

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Received empty response from scores data source.');
      }

      // Basic validation - check it looks like CSV
      const firstLine = text.trim().split('\n')[0];
      if (firstLine.startsWith('<') || firstLine.toLowerCase().startsWith('<!doctype')) {
        throw new Error('Received HTML instead of CSV. The data source may be unavailable.');
      }

      const { headers, rows } = parseCSV(text);

      if (rows.length === 0) {
        setAllRows([]);
        setWeekColumns([]);
        setLastUpdated(new Date().toISOString());
        setLoading(false);
        return;
      }

      const weeks = getWeekColumns(headers);
      setWeekColumns(weeks);
      setAllRows(rows);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError(err.message || 'Unable to load scores at this time.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Group rows by night
  const nightGroups = useMemo(() => {
    const grouped = {};
    allRows.forEach((row) => {
      const night = (row.Night || '').trim();
      if (!night) return;
      const key = night.toLowerCase();
      if (!grouped[key]) {
        grouped[key] = { night, teams: [] };
      }
      grouped[key].teams.push(row);
    });

    // Sort teams within each night by total points (descending)
    Object.values(grouped).forEach((group) => {
      group.teams.sort((a, b) => {
        const aPts = parseInt(a['Total Points'], 10) || 0;
        const bPts = parseInt(b['Total Points'], 10) || 0;
        if (bPts !== aPts) return bPts - aPts;
        return (a['Team Name'] || '').localeCompare(b['Team Name'] || '');
      });
    });

    return grouped;
  }, [allRows]);

  const nightKeys = useMemo(() => {
    const order = ['tuesday', 'wednesday'];
    return order.filter((key) => nightGroups[key]);
  }, [nightGroups]);

  const filteredNightKeys = useMemo(() => {
    if (activeNight === 'All') return nightKeys;
    return nightKeys.filter((key) => key === activeNight.toLowerCase());
  }, [nightKeys, activeNight]);

  const formattedUpdatedAt = lastUpdated
    ? new Date(lastUpdated).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <main className="scores-page">
      <div className="scores-header">
        <h1>Team Scores</h1>
        <p>Weekly points earned by each team, sourced from the league spreadsheet.</p>
      </div>

      {loading ? (
        <div className="loading-state card card--interactive">
          <p>Loading scores...</p>
        </div>
      ) : error ? (
        <div className="error-state card card--interactive">
          <p>{error}</p>
          <button type="button" className="refresh-btn" onClick={fetchScores}>
            Try Again
          </button>
        </div>
      ) : allRows.length === 0 ? (
        <div className="empty-state card card--interactive">
          <p>No score data available yet.</p>
          <button type="button" className="refresh-btn" onClick={fetchScores}>
            Refresh
          </button>
        </div>
      ) : (
        <>
          {/* Night filter controls */}
          <div className="scores-controls card card--interactive">
            <div className="scores-controls-header">
              <div className="controls-copy">
                <span className="controls-title">Filter by league night</span>
                <span className="controls-subtitle">
                  {activeNight === 'All'
                    ? 'Showing all leagues'
                    : `Showing ${activeNight} league`}
                </span>
              </div>
              <button
                type="button"
                className="refresh-btn"
                onClick={fetchScores}
                aria-label="Refresh scores"
              >
                Refresh Scores
              </button>
            </div>
            <div className="night-filter-group">
              <button
                type="button"
                className={`night-filter ${activeNight === 'All' ? 'active' : ''}`}
                onClick={() => setActiveNight('All')}
              >
                All
              </button>
              {nightKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`night-filter ${activeNight === nightGroups[key].night ? 'active' : ''}`}
                  onClick={() => setActiveNight(nightGroups[key].night)}
                >
                  {nightGroups[key].night}
                </button>
              ))}
            </div>
            {formattedUpdatedAt && (
              <div className="updated-at">Last updated {formattedUpdatedAt}</div>
            )}
          </div>

          {/* Legend */}
          <div className="scores-legend card card--interactive">
            <span className="legend-item">
              <span className="legend-indicator cell-weather">WEATHER</span> Postponed
            </span>
            <span className="legend-item">
              <span className="legend-indicator cell-unknown">?</span> Not yet reported
            </span>
            <span className="legend-item">
              <span className="legend-indicator cell-empty">{'\u2014'}</span> No data
            </span>
          </div>

          {/* Score tables per night */}
          {filteredNightKeys.map((key) => {
            const group = nightGroups[key];
            return (
              <div key={key} className="scores-section">
                <h2 className="scores-night-heading">{group.night} League</h2>
                <div className="scores-table-card card card--interactive">
                  <div className="table-responsive">
                    <table className="scores-table">
                      <thead>
                        <tr>
                          <th className="col-rank">#</th>
                          <th className="col-team">Team</th>
                          {weekColumns.map((week) => (
                            <th key={week} className="col-week">
                              {week}
                            </th>
                          ))}
                          <th className="col-total">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.teams.length === 0 ? (
                          <tr className="empty-row">
                            <td colSpan={weekColumns.length + 3}>
                              No teams found for this night.
                            </td>
                          </tr>
                        ) : (
                          group.teams.map((team, index) => (
                            <tr
                              key={team['Team Name']}
                              className={
                                index === 0
                                  ? 'leader'
                                  : index < 3
                                  ? 'top-three'
                                  : ''
                              }
                            >
                              <td data-label="#">{index + 1}</td>
                              <td data-label="Team">{team['Team Name']}</td>
                              {weekColumns.map((week) => {
                                const cell = formatCellValue(team[week]);
                                return (
                                  <td
                                    key={week}
                                    data-label={week}
                                    className={cell.className}
                                    title={cell.title || undefined}
                                  >
                                    {cell.text}
                                  </td>
                                );
                              })}
                              <td data-label="Total" className="cell-total">
                                {team['Total Points'] || '\u2014'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredNightKeys.length === 0 && (
            <div className="empty-state card card--interactive">
              <p>No leagues match the selected filter.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export { Scores };

