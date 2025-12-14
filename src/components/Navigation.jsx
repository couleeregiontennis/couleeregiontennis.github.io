import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import '../styles/Navigation.css';

export const Navigation = ({ theme = 'light', onToggleTheme = () => { } }) => {
  const { user, userRole, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const navRef = useRef(null);

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
    await signOut();
    navigate('/login');
    closeMenu();
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
              <li><Link to="/schedule" onClick={closeMenu}>Schedule</Link></li>

              {/* League Dropdown */}
              <li className="dropdown">
                <button
                  className="dropdown-toggle"
                  onClick={() => toggleDropdown('league')}
                  aria-expanded={openDropdown === 'league'}
                  aria-haspopup="menu"
                  type="button"
                >
                  League <span className="dropdown-arrow">▼</span>
                </button>
                <ul className={`dropdown-menu ${openDropdown === 'league' ? 'show' : ''}`} role="menu">
                  <li><Link to="/standings" onClick={closeMenu}>Standings</Link></li>
                  <li><Link to="/player-rankings" onClick={closeMenu}>Player Rankings</Link></li>
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
                  <li><Link to="/rules" onClick={closeMenu}>Rules</Link></li>
                </ul>
              </li>

              {/* Player Hub Dropdown - only show if user is logged in */}
              {user && (
                <li className="dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={() => toggleDropdown('player')}
                    aria-expanded={openDropdown === 'player'}
                    aria-haspopup="menu"
                    type="button"
                  >
                    My Hub <span className="dropdown-arrow">▼</span>
                  </button>
                  <ul className={`dropdown-menu ${openDropdown === 'player' ? 'show' : ''}`} role="menu">
                    <li><Link to="/player-profile" onClick={closeMenu}>My Profile</Link></li>
                    <li><Link to="/my-schedule" onClick={closeMenu}>My Schedule</Link></li>
                    {userRole.isCaptain && (
                      <>
                        <li><Link to="/captain-dashboard" onClick={closeMenu}>Captain Dashboard</Link></li>
                        <li><Link to="/add-score" onClick={closeMenu}>Submit Scores</Link></li>
                      </>
                    )}
                  </ul>
                </li>
              )}

              {/* General Player Resources */}
              <li className="dropdown">
                <button
                  className="dropdown-toggle"
                  onClick={() => toggleDropdown('resources')}
                  aria-expanded={openDropdown === 'resources'}
                  aria-haspopup="menu"
                  type="button"
                >
                  Resources <span className="dropdown-arrow">▼</span>
                </button>
                <ul className={`dropdown-menu ${openDropdown === 'resources' ? 'show' : ''}`} role="menu">
                  <li><Link to="/courts-locations" onClick={closeMenu}>Courts & Locations</Link></li>
                  <li><Link to="/player-resources" onClick={closeMenu}>Player Resources</Link></li>
                  <li><Link to="/feedback" onClick={closeMenu}>Feedback</Link></li>
                </ul>
              </li>

              {/* Admin Dropdown - only show for admins */}
              {user && userRole.isAdmin && (
                <li className="dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={() => toggleDropdown('admin')}
                    aria-expanded={openDropdown === 'admin'}
                    aria-haspopup="menu"
                    type="button"
                  >
                    Admin <span className="dropdown-arrow">▼</span>
                  </button>
                  <ul className={`dropdown-menu ${openDropdown === 'admin' ? 'show' : ''}`} role="menu">
                    <li><Link to="/admin/schedule-generator" onClick={closeMenu}>Schedule Generator</Link></li>
                    <li><Link to="/admin/audit-logs" onClick={closeMenu}>Audit Logs</Link></li>
                    <li><Link to="/admin/player-management" onClick={closeMenu}>Player Management</Link></li>
                    <li><Link to="/admin/team-management" onClick={closeMenu}>Team Management</Link></li>
                  </ul>
                </li>
              )}

              {/* Authentication */}
              {user ? (
                <li className="navbar-auth">
                  <span className="navbar-user-icon" title={user.email}>👤</span>
                  <button className="navbar-logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              ) : (
                <li className="navbar-auth">
                  <Link to="/login" title="Login" className="navbar-login-icon" onClick={closeMenu}>
                    🔑 Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};
