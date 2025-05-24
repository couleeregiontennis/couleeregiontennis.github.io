import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/">LTTA</Link>
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
              <li><Link to="/">Teams</Link></li>
              <li><Link to="/subs">Find a Sub</Link></li>
              <li><Link to="/greenisland">Green Island</Link></li>
              <li><Link to="/rules">Rules</Link></li>
              <li>
                <a 
                  href="http://www.couleeregiontennis.com" 
                  target="_blank"
                  rel="noopener noreferrer"
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