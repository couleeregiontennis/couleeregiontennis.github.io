import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/PlayerProfile.css';

export const PlayerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    emergency_phone: '',
    skill_level: '',
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    preferred_position: '',
    notes: ''
  });
  const [matchHistory, setMatchHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchPlayerProfile(user.id);
        await fetchMatchHistory(user.id);
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

  const fetchPlayerProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('player')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          ...profile,
          id: data.id,
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          phone: data.phone,
          notes: data.notes,
          // Map other fields as needed
        });
      } else {
        // Create a new profile with user's email
        setProfile({
          ...profile,
          email: user?.email || '',
          name: user?.user_metadata?.full_name || ''
        });
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
    if (field.startsWith('availability.')) {
      const day = field.split('.')[1];
      setProfile(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [day]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Split name into first and last name
      const nameParts = profile.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const profileData = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: profile.email,
        phone: profile.phone,
        notes: profile.notes
      };

      let result;
      if (profile.id) {
        // Update existing profile
        result = await supabase
          .from('player')
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single();
      } else {
        // Create new profile
        result = await supabase
          .from('player')
          .insert(profileData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setProfile(result.data);
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
    fetchPlayerProfile(user.id);
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
        <div className="profile-section">
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

            <div className="form-group">
              <label htmlFor="skill_level">Skill Level</label>
              <select
                id="skill_level"
                value={profile.skill_level}
                onChange={(e) => handleInputChange('skill_level', e.target.value)}
                disabled={!isEditing}
              >
                <option value="">Select skill level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="profile-section">
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
        <div className="profile-section">
          <h2>Weekly Availability</h2>
          <div className="availability-grid">
            {Object.entries(profile.availability).map(([day, available]) => (
              <div key={day} className="availability-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => handleInputChange(`availability.${day}`, e.target.checked)}
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
        <div className="profile-section">
          <h2>Tennis Preferences</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="preferred_position">Preferred Position</label>
              <select
                id="preferred_position"
                value={profile.preferred_position}
                onChange={(e) => handleInputChange('preferred_position', e.target.value)}
                disabled={!isEditing}
              >
                <option value="">No preference</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="both">Both Singles & Doubles</option>
              </select>
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
          <div className="profile-actions">
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
        <div className="profile-section">
          <h2>Recent Match History</h2>
          {matchHistory.length > 0 ? (
            <div className="match-history">
              {matchHistory.map((matchPlayer) => (
                <div key={matchPlayer.id} className="match-item">
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
