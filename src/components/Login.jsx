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
      <div className="login-header">
        <h1>{isSignUp ? 'Create your LTTA account' : 'Welcome back to LTTA'}</h1>
        <p>Access captain tools, submit scores, and stay connected with your league team.</p>
      </div>

      <div className="login-layout">
        <div className="login-panel">
          <div className="login-toggle" role="tablist" aria-label="Authentication method">
            <button
              type="button"
              className={`toggle-button ${!isSignUp ? 'active' : ''}`}
              onClick={() => setIsSignUp(false)}
              disabled={loading}
              role="tab"
              aria-selected={!isSignUp}
              aria-controls="auth-panel"
              id="tab-login"
            >
              Login
            </button>
            <button
              type="button"
              className={`toggle-button ${isSignUp ? 'active' : ''}`}
              onClick={() => setIsSignUp(true)}
              disabled={loading}
              role="tab"
              aria-selected={isSignUp}
              aria-controls="auth-panel"
              id="tab-signup"
            >
              Sign Up
            </button>
          </div>

          <div
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={isSignUp ? "tab-signup" : "tab-login"}
            className="login-tab-content"
          >
            <form className="login-form" onSubmit={handleAuth}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              <button className="primary-action" type="submit" disabled={loading}>
                {loading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create account' : 'Sign in')}
              </button>
            </form>

            <div className="oauth-divider">
              <span />
              <p>or continue with</p>
              <span />
            </div>

            <div className="oauth-actions">
              <button
                type="button"
                className="oauth-button google"
                onClick={() => handleOAuth('google')}
                disabled={loading}
              >
                <span className="oauth-icon" aria-hidden>🔵</span>
                Google
              </button>
              <button
                type="button"
                className="oauth-button apple"
                onClick={() => handleOAuth('apple')}
                disabled={loading}
              >
                <span className="oauth-icon" aria-hidden></span>
                Apple
              </button>
            </div>
          </div>

          <p className="login-switch">
            {isSignUp ? (
              <>
                Already have an account?
                <button type="button" onClick={() => setIsSignUp(false)} disabled={loading}>
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to LTTA?
                <button type="button" onClick={() => setIsSignUp(true)} disabled={loading}>
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>

        <aside className="login-side-card">
          <h2>Why create an account?</h2>
          <ul>
            <li>
              <span>Submit match scores instantly from the court.</span>
            </li>
            <li>
              <span>View upcoming schedules and roster availability.</span>
            </li>
            <li>
              <span>Receive real-time updates from league captains.</span>
            </li>
          </ul>
          <p className="support-text">
            Need assistance? Email
            {' '}
            <a href="mailto:support@ltta.com">support@ltta.com</a>
            {' '}for help with your account.
          </p>
        </aside>
      </div>
    </div>
  );
};
