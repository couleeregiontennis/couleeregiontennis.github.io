import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../scripts/supabaseClient';
import { useAuth } from '../../context/AuthProvider';
import '../../styles/ScheduleGenerator.css';

export const ScheduleGenerator = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teams, setTeams] = useState([]);
  const [existingSchedules, setExistingSchedules] = useState({});
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmReplace, setConfirmReplace] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    night: '',
    startDate: '',
    selectedTeams: [],
    seed: '',
    replaceIfExists: false
  });

  useEffect(() => {
    if (authLoading) return;

    if (user && userRole.isAdmin) {
      setIsAdmin(true);
      loadInitialData();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [authLoading, user, userRole]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load available teams
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('id, number, name, play_night')
        .order('number');

      if (teamError) throw teamError;
      setTeams(teamData || []);

      // Check existing schedules
      await checkExistingSchedules();

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSchedules = async () => {
    try {
      // Check what schedules already exist for the current year
      const year = new Date().getFullYear();

      // Get schedules that exist in matches table
      const { data, error } = await supabase
        .from('team_match')
        .select('play_night, date')
        .gte('date', `${year}-01-01`)
        .lt('date', `${year + 1}-01-01`);

      if (error) throw error;

      const existing = {};
      data?.forEach(match => {
        if (match.play_night) {
          existing[match.play_night.toLowerCase()] = true;
        }
      });

      setExistingSchedules(existing);
    } catch (err) {
      console.error('Error checking existing schedules:', err);
    }
  };

  const handleYearChange = (year) => {
    setFormData(prev => ({ ...prev, year }));
    checkExistingSchedules(year);
  };

  const handleNightChange = (night) => {
    setFormData(prev => ({ ...prev, night }));

    // Auto-select teams that play on this night
    const nightTeams = teams.filter(team =>
      team.play_night?.toLowerCase() === night.toLowerCase()
    );
    setFormData(prev => ({
      ...prev,
      night,
      selectedTeams: nightTeams.map(team => team.id)
    }));
  };

  const handleTeamSelection = (teamId, checked) => {
    setFormData(prev => ({
      ...prev,
      selectedTeams: checked
        ? [...prev.selectedTeams, teamId]
        : prev.selectedTeams.filter(id => id !== teamId)
    }));
  };

  const checkScheduleExists = () => {
    return existingSchedules[formData.night.toLowerCase()];
  };

  const generatePreview = async () => {
    try {
      setGenerating(true);
      setError('');
      setPreview(null);

      // Validate form
      if (!formData.year || !formData.night || !formData.startDate || formData.selectedTeams.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.selectedTeams.length < 2) {
        throw new Error('At least 2 teams are required to generate a schedule');
      }

      // Call the schedule generation API
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          year: formData.year,
          night: formData.night,
          startDate: formData.startDate,
          teamIds: formData.selectedTeams,
          seed: formData.seed || undefined,
          preview: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate schedule');
      }

      const result = await response.json();
      setPreview(result);

    } catch (err) {
      console.error('Error generating schedule:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveSchedule = async () => {
    try {
      setSaving(true);
      setError('');

      if (!preview || !confirmReplace) {
        throw new Error('Please confirm you want to replace the existing schedule');
      }

      // Save the schedule
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          year: formData.year,
          night: formData.night,
          startDate: formData.startDate,
          teamIds: formData.selectedTeams,
          seed: formData.seed || undefined,
          preview: false,
          replaceIfExists: formData.replaceIfExists
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }

      setSuccess('Schedule generated successfully!');
      setPreview(null);
      setFormData(prev => ({ ...prev, replaceIfExists: false }));
      await checkExistingSchedules();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return <div className="schedule-generator loading">Loading schedule generator...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="schedule-generator no-access">
        <h2>Access Denied</h2>
        <p>You do not have permission to access the schedule generator.</p>
        <Link to="/">← Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="schedule-generator">
      <div className="generator-header">
        <h1>Schedule Generator</h1>
        <p>Create and manage round-robin schedules for the league.</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Existing Schedule Warning */}
      {formData.night && checkScheduleExists() && !formData.replaceIfExists && (
        <div className="warning-banner card card--warning">
          <div className="warning-content">
            <h3>⚠️ Schedule Already Exists</h3>
            <p>
              A schedule already exists for {formData.year} {formData.night} night.
              Generating a new schedule will replace the existing one.
            </p>
            <div className="warning-actions">
              <button
                className="btn-warning"
                onClick={() => setFormData(prev => ({ ...prev, replaceIfExists: true }))}
              >
                I understand, generate new schedule
              </button>
              <Link to="/schedule" className="btn-secondary">
                View Current Schedule
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      {!preview && (
        <div className="generator-form card">
          <div className="form-header">
            <h2>Schedule Configuration</h2>
          </div>

          <div className="form-group">
            <label htmlFor="year">Year *</label>
            <input
              type="number"
              id="year"
              value={formData.year}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="night">Night *</label>
            <select
              id="night"
              value={formData.night}
              onChange={(e) => handleNightChange(e.target.value)}
              className="form-control"
              required
            >
              <option value="">Select Night</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label>Teams *</label>
            <div className="teams-selector">
              {teams
                .filter(team => !formData.night || team.play_night?.toLowerCase() === formData.night.toLowerCase())
                .map(team => (
                  <div key={team.id} className="team-checkbox">
                    <input
                      type="checkbox"
                      id={`team-${team.id}`}
                      checked={formData.selectedTeams.includes(team.id)}
                      onChange={(e) => handleTeamSelection(team.id, e.target.checked)}
                      disabled={!formData.night}
                    />
                    <label htmlFor={`team-${team.id}`}>
                      Team {team.number} - {team.name}
                    </label>
                  </div>
                ))
              }
            </div>
            {formData.selectedTeams.length < 2 && (
              <div className="form-text">Select at least 2 teams</div>
            )}
            <div className="form-text">Selected: {formData.selectedTeams.length} teams</div>
          </div>

          <div className="form-group">
            <label htmlFor="seed">Seed (optional)</label>
            <input
              type="number"
              id="seed"
              value={formData.seed}
              onChange={(e) => setFormData(prev => ({ ...prev, seed: e.target.value }))}
              className="form-control"
              placeholder="Leave empty for random"
            />
            <div className="form-text">Optional seed for reproducible schedule generation</div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={generatePreview}
              disabled={generating ||
                !formData.year ||
                !formData.night ||
                !formData.startDate ||
                formData.selectedTeams.length < 2 ||
                (checkScheduleExists() && !formData.replaceIfExists)
              }
            >
              {generating ? 'Generating...' : 'Generate Preview'}
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="generator-preview card">
          <div className="preview-header">
            <h2>Schedule Preview</h2>
            <div className="preview-stats">
              <span>{preview.matches?.length || 0} total matches</span>
              <span>{preview.teams?.length || 0} teams</span>
              <span>{preview.weeks || 0} weeks</span>
            </div>
          </div>

          <div className="preview-summary">
            <h3>Schedule Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Teams</span>
                <span className="summary-value">{preview.teams?.length || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Matches</span>
                <span className="summary-value">{preview.matches?.length || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Weeks</span>
                <span className="summary-value">{preview.weeks || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Start Date</span>
                <span className="summary-value">{new Date(formData.startDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="preview-matches">
            <h3>Sample Matches (First 5)</h3>
            <div className="matches-table">
              <table>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Home</th>
                    <th>Away</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Court</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.matches?.slice(0, 5).map((match, index) => (
                    <tr key={index}>
                      <td>Week {match.week}</td>
                      <td>Team {match.home_team_name}</td>
                      <td>Team {match.away_team_name}</td>
                      <td>{new Date(match.date).toLocaleDateString()}</td>
                      <td>{match.time}</td>
                      <td>{match.court}</td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
            </div>
            {preview.matches?.length > 5 && (
              <div className="preview-note">
                Showing 5 of {preview.matches.length} matches. Complete schedule will be generated.
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPreview(null)}
            >
              Back to Configuration
            </button>
            {checkScheduleExists() && (
              <label className="replace-checkbox">
                <input
                  type="checkbox"
                  checked={formData.replaceIfExists}
                  onChange={(e) => setFormData(prev => ({ ...prev, replaceIfExists: e.target.checked }))}
                />
                I understand this will replace the existing schedule
              </label>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={saveSchedule}
              disabled={saving || (checkScheduleExists() && !formData.replaceIfExists)}
            >
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmReplace && (
        <div className="confirm-overlay" role="dialog">
          <div className="confirm-dialog card">
            <h3>Confirm Schedule Replacement</h3>
            <p>Are you sure you want to replace the existing schedule for {formData.year} {formData.night} night? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmReplace(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveSchedule}>
                Yes, Replace Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
