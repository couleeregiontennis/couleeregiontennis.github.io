import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../scripts/supabaseClient';
import { useAuth } from '../../context/AuthProvider';
import '../../styles/PlayerManagement.css';

const getDefaultAvailability = () => ({
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false
});

export const PlayerManagement = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (user && userRole.isAdmin) {
      setIsAdmin(true);
      fetchPlayers();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [authLoading, user, userRole]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('player')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (player) => {
    // Deep copy to avoid mutating state directly
    const availability = typeof player.availability === 'object' && player.availability
      ? { ...getDefaultAvailability(), ...player.availability }
      : getDefaultAvailability();

    const playerToEdit = {
      ...player,
      day_availability: player.day_availability || getDefaultAvailability()
    };

    setSelectedPlayer(playerToEdit);
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('day_availability.')) {
      const day = field.split('.')[1];
      setSelectedPlayer(prev => ({
        ...prev,
        day_availability: {
          ...prev.day_availability,
          [day]: value
        }
      }));
    } else {
      setSelectedPlayer(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { id, ...updates } = selectedPlayer;

      // Ensure specific fields are correct types
      const dataToUpdate = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        email: updates.email,
        phone: updates.phone,
        emergency_contact: updates.emergency_contact,
        emergency_phone: updates.emergency_phone,
        ranking: Number(updates.ranking),
        is_captain: Boolean(updates.is_captain),
        is_active: Boolean(updates.is_active),
        day_availability: updates.day_availability,
        notes: updates.notes
      };

      const { data, error } = await supabase
        .from('player')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local list
      setPlayers(prev => prev.map(p => p.id === id ? data : p));

      setSuccess('Player updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditing(false);
      setSelectedPlayer(null);

    } catch (err) {
      console.error('Error updating player:', err);
      setError('Failed to update player: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredPlayers = players.filter(player => {
    const search = searchTerm.toLowerCase();
    const fullName = `${player.first_name || ''} ${player.last_name || ''}`.toLowerCase();
    const email = (player.email || '').toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  if (loading || authLoading) {
    return <div className="player-management loading">Loading player management...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="player-management no-access">
        <h2>Access Denied</h2>
        <p>You do not have permission to access player management.</p>
        <Link to="/">← Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="player-management">
      <div className="header">
        <h1>Player Management</h1>
        <p className="description">Manage player profiles, permissions, and availability.</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="controls">
        <label htmlFor="search-players" className="sr-only">Search players</label>
        <input
          id="search-players"
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input form-control"
          style={{ marginBottom: '1rem', maxWidth: '300px' }}
        />
      </div>

      <div className="player-table-container">
        <table className="player-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Ranking</th>
              <th>Captain</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => (
              <tr key={player.id}>
                <td>{player.last_name}, {player.first_name}</td>
                <td>{player.email}</td>
                <td>{player.ranking}</td>
                <td>{player.is_captain ? '✅' : '❌'}</td>
                <td>{player.is_active ? '✅' : '❌'}</td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => handleEditClick(player)}
                    title="Edit Player"
                    aria-label={`Edit ${player.first_name} ${player.last_name}`}
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
            {filteredPlayers.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No players found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isEditing && selectedPlayer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Player: {selectedPlayer.first_name} {selectedPlayer.last_name}</h2>
              <button className="close-btn" onClick={() => setIsEditing(false)} aria-label="Close modal">×</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="edit-first-name">First Name</label>
                <input
                  id="edit-first-name"
                  type="text"
                  value={selectedPlayer.first_name || ''}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-last-name">Last Name</label>
                <input
                  id="edit-last-name"
                  type="text"
                  value={selectedPlayer.last_name || ''}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={selectedPlayer.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-phone">Phone</label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={selectedPlayer.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-ranking">Ranking</label>
                <select
                  id="edit-ranking"
                  value={selectedPlayer.ranking}
                  onChange={(e) => handleInputChange('ranking', e.target.value)}
                >
                  <option value={1}>1 - Beginner</option>
                  <option value={2}>2 - Novice</option>
                  <option value={3}>3 - Intermediate</option>
                  <option value={4}>4 - Advanced</option>
                  <option value={5}>5 - Expert</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-emergency-contact">Emergency Contact</label>
                <input
                  id="edit-emergency-contact"
                  type="text"
                  value={selectedPlayer.emergency_contact || ''}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-emergency-phone">Emergency Phone</label>
                <input
                  id="edit-emergency-phone"
                  type="tel"
                  value={selectedPlayer.emergency_phone || ''}
                  onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label" htmlFor="edit-is-captain">
                  <input
                    id="edit-is-captain"
                    type="checkbox"
                    checked={selectedPlayer.is_captain || false}
                    onChange={(e) => handleInputChange('is_captain', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Is Captain
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label" htmlFor="edit-is-active">
                  <input
                    id="edit-is-active"
                    type="checkbox"
                    checked={selectedPlayer.is_active || false}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Is Active
                </label>
              </div>
            </div>

            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Availability</h3>
            <div className="availability-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div key={day} className="day-item">
                  <label className="checkbox-label" htmlFor={`edit-day-${day}`}>
                    <input
                      id={`edit-day-${day}`}
                      type="checkbox"
                      checked={selectedPlayer.day_availability?.[day] || false}
                      onChange={(e) => handleInputChange(`day_availability.${day}`, e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </label>
                </div>
              ))}
            </div>

            <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="edit-notes">Notes</label>
              <textarea
                id="edit-notes"
                value={selectedPlayer.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
