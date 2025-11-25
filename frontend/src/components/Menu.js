import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import ScienceIcon from '@mui/icons-material/Science';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import GroupIcon from '@mui/icons-material/Group';
import './Menu.css';
import { useTheme } from '../context/ThemeContext';

const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(true);
      } else {
        setIsMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const closeMenuOnNavigation = () => {
    if (window.innerWidth < 768) {
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Passer au contenu principal
      </a>

      <button
        type="button"
        className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
        aria-expanded={isMenuOpen}
        aria-controls="primary-navigation"
        aria-label="Basculer la navigation"
        onClick={toggleMenu}
      >
        <span className="menu-toggle-bar" />
        <span className="menu-toggle-bar" />
        <span className="menu-toggle-bar" />
      </button>

      <nav
        className={`menu ${isMenuOpen ? 'open' : ''}`}
        aria-label="Menu principal"
        id="primary-navigation"
      >
        <div className="menu-title">Main Menu</div>
        <div className="menu-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
            aria-pressed={theme === 'dark'}
          >
            <span className="theme-icon" aria-hidden>
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
            <span className="theme-label">{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</span>
          </button>
        </div>
        <ul className="menu-list">
          <li>
            <Link to="/dashboard" onClick={closeMenuOnNavigation}>
              <DashboardIcon className="menu-icon" />
              <div>
                Tableau de bord
              </div>
            </Link>
          </li>
          <li>
            <Link to="/resources" onClick={closeMenuOnNavigation}>
              <CategoryIcon className="menu-icon" />
              <div>
                Ressource
              </div>
            </Link>
          </li>
          <li>
            <Link to="/facilities" onClick={closeMenuOnNavigation}>
              <BusinessIcon className="menu-icon" />
              <div>
                Installation
              </div>
            </Link>
          </li>
          <li>
            <Link to="/research" onClick={closeMenuOnNavigation}>
              <ScienceIcon className="menu-icon" />
              <div>
                Recherche
              </div>
            </Link>
          </li>
          <li>
            <Link to="/training" onClick={closeMenuOnNavigation}>
              <BuildIcon className="menu-icon" />
              <div>
                Centre d'entrainement
              </div>
            </Link>
          </li>
          <li>
            <Link to="/defense" onClick={closeMenuOnNavigation}>
              <SecurityIcon className="menu-icon" />
              <div>
                Defense
              </div>
            </Link>
          </li>
          <li>
            <Link to="/fleet" onClick={closeMenuOnNavigation}>
              <DirectionsBoatIcon className="menu-icon" />
              <div>
                Flotte
              </div>
            </Link>
          </li>
          <li>
            <Link to="/alliance" onClick={closeMenuOnNavigation}>
              <GroupIcon className="menu-icon" />
              <div>
                Alliance
              </div>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Menu;