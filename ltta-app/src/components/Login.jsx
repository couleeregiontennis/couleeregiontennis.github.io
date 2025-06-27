import React, { useState } from 'react';
import { supabase } from '../scripts/supabaseClient';

export function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    setLoading(false);
    if (result.error) setError(result.error.message);
    else if (!isSignUp && onLogin) onLogin(result.user);
  };

  const handleOAuth = async (provider) => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    setLoading(false);
    if (error) setError(error.message);
    // On success, Supabase will redirect to your configured redirect URL
  };

  return (
    <div className="login-page" style={{ maxWidth: 340, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
      <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
      <form onSubmit={handleAuth}>
        <label>
          Email<br />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 12, padding: 8 }}
          />
        </label>
        <label>
          Password<br />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 12, padding: 8 }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#2a4d69', color: '#fff', border: 'none', borderRadius: 4 }}>
          {loading ? (isSignUp ? 'Signing up...' : 'Logging in...') : (isSignUp ? 'Sign Up' : 'Login')}
        </button>
        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      </form>
      <div style={{ margin: '24px 0 8px 0', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          style={{
            width: '100%',
            padding: 10,
            background: '#fff',
            color: '#222',
            border: '1px solid #888',
            borderRadius: 4,
            marginBottom: 10,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <span style={{ marginRight: 8, verticalAlign: 'middle' }}>🔵</span>
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          style={{
            width: '100%',
            padding: 10,
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <span style={{ marginRight: 8, verticalAlign: 'middle' }}></span>
          Continue with Apple
        </button>
      </div>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => setIsSignUp(false)} style={{ color: '#2a4d69', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Login
            </button>
          </>
        ) : (
          <>
            New user?{' '}
            <button type="button" onClick={() => setIsSignUp(true)} style={{ color: '#2a4d69', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
}