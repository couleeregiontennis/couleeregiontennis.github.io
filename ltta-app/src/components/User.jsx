import React, { useEffect, useState } from 'react';
import { supabase } from '../scripts/supabaseClient';

export function User() {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    ranking: 3,
    is_captain: false,
    email: '',
    phone: '',
    notes: '',
    is_active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

  // Fetch current user and player profile
  useEffect(() => {
    let ignore = false;
    async function fetchUserAndPlayer() {
      setLoading(true);
      setError('');
      setSuccess('');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      setUser(user);
      // Fetch player row by user_id
      const { data, error: playerError } = await supabase
        .from('player')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (!ignore && data) {
        setPlayer(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          ranking: data.ranking ?? 3,
          is_captain: data.is_captain ?? false,
          email: data.email || user.email || '',
          phone: data.phone || '',
          notes: data.notes || '',
          is_active: data.is_active ?? true,
        });
      }
      if (!ignore && playerError && playerError.code !== 'PGRST116') {
        setError('Error loading profile.');
      }
      setLoading(false);
    }
    fetchUserAndPlayer();
    return () => { ignore = true; };
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {
      ...form,
      user_id: user.id,
      email: form.email || user.email,
      ranking: Number(form.ranking),
    };

    let result;
    if (player) {
      // Update
      const { error: updateError } = await supabase
        .from('player')
        .update(payload)
        .eq('id', player.id);
      if (updateError) setError('Update failed: ' + updateError.message);
      else setSuccess('Profile updated!');
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('player')
        .insert([payload]);
      if (insertError) setError('Registration failed: ' + insertError.message);
      else setSuccess('Registration complete!');
    }
    setLoading(false);
  };

  if (loading) return <div className="user-form"><p>Loading...</p></div>;
  if (error) return <div className="user-form error">{error}</div>;

  return (
    <div className="user-form" style={{ maxWidth: 420, margin: '2rem auto', background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #0001' }}>
      <h2>{player ? 'Edit Profile' : 'Register as Player'}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          First Name<br />
          <input
            name="first_name"
            type="text"
            value={form.first_name}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <label>
          Last Name<br />
          <input
            name="last_name"
            type="text"
            value={form.last_name}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <label>
          Email<br />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <label>
          Phone<br />
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Optional"
          />
        </label>
        <br />
        <label>
          Ranking<br />
          <select name="ranking" value={form.ranking} onChange={handleChange}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </label>
        <br />
        <label>
          Captain?{' '}
          <input
            name="is_captain"
            type="checkbox"
            checked={form.is_captain}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Notes<br />
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Optional"
          />
        </label>
        <br />
        <label>
          Active?{' '}
          <input
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={handleChange}
          />
        </label>
        <br />
        <button type="submit" disabled={loading}>
          {player ? 'Update Profile' : 'Register'}
        </button>
        {success && <div className="success" style={{ color: 'green', marginTop: 12 }}>{success}</div>}
        {error && <div className="error" style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      </form>
    </div>
  );
}

export default User;