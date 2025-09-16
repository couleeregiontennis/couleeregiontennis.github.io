import { useState } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/Login.css';

export const Login = ({ onLogin }) => {
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
    <div className="login-page">
      <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
      <form onSubmit={handleAuth}>
        <label>
          Email<br />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password<br />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? (isSignUp ? 'Signing up...' : 'Logging in...') : (isSignUp ? 'Sign Up' : 'Login')}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
      <div>
        <button
          type="button"
          onClick={() => handleOAuth('google')}
        >
          <span style={{ marginRight: 8, verticalAlign: 'middle' }}>🔵</span>
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          className="apple-btn"
        >
          <span style={{ marginRight: 8, verticalAlign: 'middle' }}></span>
          Continue with Apple
        </button>
      </div>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => setIsSignUp(false)} className="switch-link">
              Login
            </button>
          </>
        ) : (
          <>
            New user?{' '}
            <button type="button" onClick={() => setIsSignUp(true)} className="switch-link">
              Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
};