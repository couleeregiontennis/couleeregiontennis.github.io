import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../scripts/supabaseClient';
import '../styles/Navigation.css';

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

  return (
    <header>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/" onClick={closeMenu}>LTTA</Link>
          </div>
          <button
            className="navbar-toggle"
            aria-label="Toggle navigation"
            onClick={toggleMenu}
          >
            ☰
          </button>
          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <ul>
              <li><Link to="/" onClick={closeMenu}>Teams</Link></li>
              <li><Link to="/subs" onClick={closeMenu}>Find a Sub</Link></li>
              <li><Link to="/greenisland" onClick={closeMenu}>Green Island</Link></li>
              <li><Link to="/rules" onClick={closeMenu}>Rules</Link></li>
              <li><Link to="/standings" onClick={closeMenu}>Standings</Link></li>
              <li><Link to="/schedule" onClick={closeMenu}>Schedule</Link></li>
              <li><Link to="/league-stats" onClick={closeMenu}>League Stats</Link></li>
              <li>
                <a
                  href="http://www.couleeregiontennis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  CRTA Website
                </a>
              </li>
              {user && (
                <li>
                  <Link to="/add-score" onClick={closeMenu}>
                    Add Score
                  </Link>
                </li>
              )}
              {user && (
                <li>
                  <Link to="/captain-dashboard" onClick={closeMenu}>
                    Captain Dashboard
                  </Link>
                </li>
              )}
              {user && (
                <li>
                  <Link to="/player-profile" onClick={closeMenu}>
                    My Profile
                  </Link>
                </li>
              )}
              {user && (
                <li>
                  <Link to="/user" onClick={closeMenu}>
                    User
                  </Link>
                </li>
              )}
              <li className="navbar-auth">
                {user ? (
                  <>
                    <span className="navbar-user-icon" title={user.email}>👤</span>
                    <button className="navbar-logout-btn" onClick={() => { handleLogout(); closeMenu(); }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" title="Login" className="navbar-login-icon" onClick={closeMenu}>
                    🔑 Login
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};