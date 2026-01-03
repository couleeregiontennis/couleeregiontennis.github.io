import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/PlayerProfile.css';

const getDefaultAvailability = () => ({
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false
});

const createEmptyProfile = () => ({
  id: '',
  name: '',
  email: '',
  phone: '',
  emergency_contact: '',
  emergency_phone: '',
  ranking: 3,
  is_captain: false,
  is_active: true,
  day_availability: getDefaultAvailability(),
  notes: ''
});

const normalizeProfile = (data, user = null) => {
  if (!data) {
    return {
      ...createEmptyProfile(),
      id: user?.id || '',
      name: user?.user_metadata?.full_name || '',
      email: user?.email || ''
    };
  }

  const firstName = data.first_name || '';
  const lastName = data.last_name || '';

  return {
    id: data.id || user?.id || '',
    name: `${firstName} ${lastName}`.trim(),
    email: data.email || user?.email || '',
    phone: data.phone || '',
    emergency_contact: data.emergency_contact || '',
    emergency_phone: data.emergency_phone || '',
    ranking: data.ranking ?? 3,
    is_captain: data.is_captain ?? false,
    is_active: data.is_active ?? true,
    day_availability: {
      ...getDefaultAvailability(),
      ...(typeof data.availability === 'object' && data.day_availability ? data.availability : {})
    },
    notes: data.notes || ''
  };
};

export const PlayerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(createEmptyProfile());
  const [matchHistory, setMatchHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Parallel fetch
        await Promise.all([
            fetchPlayerProfile(user.id, user),
            fetchMatchHistory(user.id)
        ]);
        
      } else {
        setError('Please log in to view your profile');
      }
    } catch (err) {
      console.error('Error checking user:', err);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerProfile = async (userId, authUser = null) => {
    try {
      const { data, error } = await supabase
        .from('player')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const normalized = normalizeProfile(data, authUser || user);
      setProfile(normalized);
      setHasExistingProfile(Boolean(data));
      if (!data) {
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load player profile');
    }
  };

  const fetchMatchHistory = async (userId) => {
    try {
      // Using player_to_match table to get match history
      const { data, error } = await supabase
        .from('player_to_match')
        .select(`
          *,
          match:match(
            *
          )
        `)
        .eq('player', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMatchHistory(data || []);
    } catch (err) {
      console.error('Error fetching match history:', err);
      // Don't set error for match history as it's not critical
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('day_availability.')) {
      const day = field.split('.')[1];
      setProfile(prev => ({
        ...prev,
        day_availability: {
          ...prev.day_availability,
          [day]: value
        }
      }));
    } else {
      const nextValue = field === 'ranking' ? Number(value) : value;
      setProfile(prev => ({
        ...prev,
        [field]: nextValue
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const nameString = (profile.name || '').trim();
      const nameParts = nameString ? nameString.split(/\s+/) : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const parsedRanking = Number(profile.ranking);
      const rankingValue = Number.isNaN(parsedRanking) ? 3 : parsedRanking;

      const profileData = {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: profile.email || user.email || '',
        phone: profile.phone || '',
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
        ranking: rankingValue,
        // Security: is_captain is a privileged role and should not be set by the user via profile update.
        // It must be managed by admins or database policies.
        // is_captain: Boolean(profile.is_captain),
        is_active: Boolean(profile.is_active),
        day_availability: profile.day_availability || getDefaultAvailability(),
        notes: profile.notes || ''
      };

      let savedData;
      if (hasExistingProfile) {
        // When updating, we identify the record by user_id
        const { data: updatedData, error: updateError } = await supabase
          .from('player')
          .update(profileData)
          .eq('user_id', user.id)
          .select()
          .single();
        if (updateError) throw updateError;
        savedData = updatedData;
      } else {
        const { data: insertedData, error: insertError } = await supabase
          .from('player')
          .insert(profileData)
          .select()
          .single();
        if (insertError) throw insertError;
        savedData = insertedData;
        setHasExistingProfile(true);
      }

      setProfile(normalizeProfile(savedData, user));
      setSuccess('Profile saved successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset form to original values
    fetchPlayerProfile(user.id, user);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="player-profile">
        <div className="loading">Loading your profile...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="player-profile">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="player-profile">
      <div className="profile-header">
        <h1>Player Profile</h1>
        <p>Manage your tennis league information and preferences</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-content">
        {/* Basic Information */}
        <div className="profile-section card card--interactive">
          <div className="section-header">
            <h2>Basic Information</h2>
            {!isEditing && (
              <button
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="profile-section card card--interactive">
          <h2>Emergency Contact</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="emergency_contact">Emergency Contact Name</label>
              <input
                type="text"
                id="emergency_contact"
                value={profile.emergency_contact}
                onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergency_phone">Emergency Contact Phone</label>
              <input
                type="tel"
                id="emergency_phone"
                value={profile.emergency_phone}
                onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                disabled={!isEditing}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="profile-section card card--interactive">
          <h2>Weekly Availability</h2>
          <div className="availability-grid">
            {profile.day_availability && Object.entries(profile.day_availability).map(([day, available]) => (
              <div key={day} className="day_availability-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => handleInputChange(`day_availability.${day}`, e.target.checked)}
                    disabled={!isEditing}
                  />
                  <span className="checkmark"></span>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Tennis Preferences */}
        <div className="profile-section card card--interactive">
          <h2>Tennis Preferences</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="ranking">Player Ranking</label>
              <select
                id="ranking"
                value={profile.ranking}
                onChange={(e) => handleInputChange('ranking', e.target.value)}
                disabled={!isEditing}
              >
                <option value={1}>1 - Beginner</option>
                <option value={2}>2 - Novice</option>
                <option value={3}>3 - Intermediate</option>
                <option value={4}>4 - Advanced</option>
                <option value={5}>5 - Expert</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label" title="Captain status is managed by league administrators">
                <input
                  type="checkbox"
                  checked={profile.is_captain}
                  disabled={true}
                  readOnly
                />
                <span className="checkmark"></span>
                Team Captain (Read-only)
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={profile.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="checkmark"></span>
                Active Player
              </label>
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                value={profile.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={!isEditing}
                rows="3"
                placeholder="Any additional information about your playing style, preferences, or availability..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="profile-actions card card--flat">
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save Profile'}
            </button>
            <button
              className="cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              ❌ Cancel
            </button>
          </div>
        )}

        {/* Match History */}
        <div className="profile-section card card--interactive">
          <h2>Recent Match History</h2>
          {matchHistory.length > 0 ? (
            <div className="match-history">
              {matchHistory.map((matchPlayer) => (
                <div key={matchPlayer.id} className="match-item card card--interactive card--overlay">
                  <div className="match-date">
                    {formatDate(matchPlayer.match.match_date)}
                  </div>
                  <div className="match-details">
                    Match on {formatDate(matchPlayer.match.match_date)}
                  </div>
                  <div className="match-score">
                    Points: {matchPlayer.match.team_1_points} - {matchPlayer.match.team_2_points}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No match history available</p>
          )}
        </div>
      </div>
    </div>
  );
};
