import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../scripts/supabaseClient';
import '../../styles/AuditLogViewer.css';

export const AuditLogViewer = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [players, setPlayers] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    tableName: '',
    operation: '',
    changedBy: ''
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [filters, isAdmin]);

  const checkAdminAndLoadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Check admin status
      const { data: playerData, error: playerError } = await supabase
        .from('player')
        .select('id, is_captain, first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (playerError) throw playerError;

      if (!playerData.is_captain) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Load all players for mapping IDs to names
      const { data: allPlayers, error: allPlayersError } = await supabase
        .from('player')
        .select('id, first_name, last_name, email');

      if (allPlayersError) throw allPlayersError;

      const playerMap = {};
      allPlayers.forEach(p => {
        playerMap[p.id] = p;
      });
      setPlayers(playerMap);

    } catch (err) {
      console.error('Error checking admin status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName);
      }
      if (filters.operation) {
        query = query.eq('operation', filters.operation);
      }
      if (filters.changedBy) {
        query = query.eq('changed_by', filters.changedBy);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);

    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getUserLabel = (uid) => {
    const player = players[uid];
    if (player) {
      return `${player.first_name} ${player.last_name} (${player.email})`;
    }
    return uid || 'System';
  };

  if (loading) return <div className="audit-log-viewer loading-state">Loading audit logs...</div>;

  if (!isAdmin) {
    return (
      <div className="audit-log-viewer access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view audit logs.</p>
        <Link to="/" className="btn-secondary">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="audit-log-viewer">
      <div className="viewer-header">
        <h1>Audit Log Viewer</h1>
        <p>Monitor database changes and user activity.</p>
      </div>

      <div className="viewer-controls">
        <div className="control-group">
          <label htmlFor="filter-table">Table</label>
          <select
            id="filter-table"
            className="control-input"
            value={filters.tableName}
            onChange={(e) => handleFilterChange('tableName', e.target.value)}
          >
            <option value="">All Tables</option>
            <option value="team">Teams</option>
            <option value="player">Players</option>
            <option value="matches">Matches</option>
            <option value="match_scores">Match Scores</option>
            <option value="line_results">Line Results</option>
            <option value="player_to_team">Team Roster</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="filter-operation">Operation</label>
          <select
            id="filter-operation"
            className="control-input"
            value={filters.operation}
            onChange={(e) => handleFilterChange('operation', e.target.value)}
          >
            <option value="">All Operations</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="filter-changed-by">Changed By</label>
          <select
            id="filter-changed-by"
            className="control-input"
            value={filters.changedBy}
            onChange={(e) => handleFilterChange('changedBy', e.target.value)}
          >
            <option value="">All Users</option>
            {Object.values(players)
              .sort((a, b) => a.last_name.localeCompare(b.last_name))
              .map(p => (
                <option key={p.id} value={p.id}>
                  {p.last_name}, {p.first_name}
                </option>
              ))
            }
          </select>
        </div>

        <button className="btn-refresh" onClick={loadLogs}>Refresh</button>
      </div>

      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Operation</th>
              <th>Table</th>
              <th>Record ID</th>
              <th>Changed By</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--card-muted)' }}>
                  No logs found matching criteria
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.changed_at).toLocaleString()}</td>
                  <td>
                    <span className={`operation-badge op-${log.operation}`}>
                      {log.operation}
                    </span>
                  </td>
                  <td>{log.table_name}</td>
                  <td>{log.record_id}</td>
                  <td title={log.changed_by}>{getUserLabel(log.changed_by)}</td>
                  <td>
                    <button
                      className="btn-details"
                      onClick={() => setSelectedLog(log)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className="details-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Details</h2>
              <button className="btn-close" onClick={() => setSelectedLog(null)}>×</button>
            </div>

            <div className="modal-info" style={{ marginBottom: '20px' }}>
              <p><strong>Table:</strong> {selectedLog.table_name}</p>
              <p><strong>Record ID:</strong> {selectedLog.record_id}</p>
              <p><strong>Operation:</strong> {selectedLog.operation}</p>
              <p><strong>Time:</strong> {new Date(selectedLog.changed_at).toLocaleString()}</p>
              <p><strong>Changed By:</strong> {getUserLabel(selectedLog.changed_by)}</p>
            </div>

            <div className="data-comparison">
              <div className="data-block">
                <h3>Old Data</h3>
                <div className="json-view">
                  {selectedLog.old_data
                    ? JSON.stringify(selectedLog.old_data, null, 2)
                    : 'null'}
                </div>
              </div>
              <div className="data-block">
                <h3>New Data</h3>
                <div className="json-view">
                  {selectedLog.new_data
                    ? JSON.stringify(selectedLog.new_data, null, 2)
                    : 'null'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
