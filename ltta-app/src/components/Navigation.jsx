import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navigation.css';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
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
          </div>
        </div>
      </nav>
    </header>
  );
}