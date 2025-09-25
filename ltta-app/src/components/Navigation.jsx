import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../scripts/supabaseClient';
import '../styles/Navigation.css';

export const Navigation = ({ theme = 'light', onToggleTheme = () => {} }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const navRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

  return (
    <header>
      <nav className="navbar" ref={navRef}>
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/" onClick={closeMenu}>LTTA</Link>
          </div>
          <div className="navbar-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => {
                onToggleTheme();
                closeMenu();
              }}
              aria-label="Toggle color theme"
              aria-pressed={theme === 'dark'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
            </button>

            <button
              className="navbar-toggle"
              aria-label="Toggle navigation"
              onClick={toggleMenu}
              type="button"
            >
              ☰
            </button>
          </div>
          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <ul>
              <li><Link to="/" onClick={closeMenu}>Teams</Link></li>
              
              {/* League Info Dropdown */}
              <li className="dropdown">
                <button 
                  className="dropdown-toggle"
                  onClick={() => toggleDropdown('league')}
                  aria-expanded={openDropdown === 'league'}
                  aria-haspopup="menu"
                  type="button"
                >
                  League Info <span className="dropdown-arrow">▼</span>
                </button>
                <ul className={`dropdown-menu ${openDropdown === 'league' ? 'show' : ''}`} role="menu">
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
                </ul>
              </li>

              {/* Player Tools Dropdown */}
              <li className="dropdown">
                <button 
                  className="dropdown-toggle"
                  onClick={() => toggleDropdown('player')}
                  aria-expanded={openDropdown === 'player'}
                  aria-haspopup="menu"
                  type="button"
                >
                  Player Tools <span className="dropdown-arrow">▼</span>
                </button>
                <ul className={`dropdown-menu ${openDropdown === 'player' ? 'show' : ''}`} role="menu">
                  <li><Link to="/subs" onClick={closeMenu}>Find a Sub</Link></li>
                  <li><Link to="/greenisland" onClick={closeMenu}>Green Island</Link></li>
                </ul>
              </li>

              {/* My Account Dropdown - Only show if user is logged in */}
              {user && (
                <li className="dropdown">
                  <button 
                    className="dropdown-toggle"
                    onClick={() => toggleDropdown('account')}
                    aria-expanded={openDropdown === 'account'}
                    aria-haspopup="menu"
                    type="button"
                  >
                    My Account <span className="dropdown-arrow">▼</span>
                  </button>
                  <ul className={`dropdown-menu ${openDropdown === 'account' ? 'show' : ''}`} role="menu">
                    <li><Link to="/player-profile" onClick={closeMenu}>My Profile</Link></li>
                    <li><Link to="/captain-dashboard" onClick={closeMenu}>Captain Dashboard</Link></li>
                    <li><Link to="/add-score" onClick={closeMenu}>Add Score</Link></li>
                  </ul>
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