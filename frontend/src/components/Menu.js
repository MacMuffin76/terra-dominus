import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import ScienceIcon from '@mui/icons-material/Science';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GroupIcon from '@mui/icons-material/Group';
import PublicIcon from '@mui/icons-material/Public';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExploreIcon from '@mui/icons-material/Explore';
import './Menu.css';
import { useTheme } from '../context/ThemeContext';

const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

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
            <span className="theme-icon" aria-hidden="true">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
            <span className="theme-label">{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</span>
          </button>
        </div>
        <ul className="menu-list">
          <li>
            <Link to="/dashboard" onClick={closeMenuOnNavigation} id="menu-dashboard" className={isActive('/dashboard') ? 'active' : ''}>
              <DashboardIcon className="menu-icon" />
              <div>
                Tableau de bord
              </div>
            </Link>
          </li>
          <li>
            <Link to="/resources" onClick={closeMenuOnNavigation} id="menu-resources" className={isActive('/resources') ? 'active' : ''}>
              <CategoryIcon className="menu-icon" />
              <div>
                Ressource
              </div>
            </Link>
          </li>
          <li>
            <Link to="/facilities" onClick={closeMenuOnNavigation} id="menu-facilities" className={isActive('/facilities') ? 'active' : ''}>
              <BusinessIcon className="menu-icon" />
              <div>
                Installation
              </div>
            </Link>
          </li>
          <li>
            <Link to="/research" onClick={closeMenuOnNavigation} id="menu-research" className={isActive('/research') ? 'active' : ''}>
              <ScienceIcon className="menu-icon" />
              <div>
                Recherche
              </div>
            </Link>
          </li>
          <li>
            <Link to="/training" onClick={closeMenuOnNavigation} id="menu-training" className={isActive('/training') ? 'active' : ''}>
              <BuildIcon className="menu-icon" />
              <div>
                Centre d'entrainement
              </div>
            </Link>
          </li>
          <li>
            <Link to="/defense" onClick={closeMenuOnNavigation} className={isActive('/defense') ? 'active' : ''}>
              <SecurityIcon className="menu-icon" />
              <div>
                Defense
              </div>
            </Link>
          </li>
          <li>
            <Link to="/fleet" onClick={closeMenuOnNavigation} className={isActive('/fleet') ? 'active' : ''}>
              <DirectionsBoatIcon className="menu-icon" />
              <div>
                Flotte
              </div>
            </Link>
          </li>
          <li>
            <Link to="/trade" onClick={closeMenuOnNavigation} className={isActive('/trade') ? 'active' : ''}>
              <LocalShippingIcon className="menu-icon" />
              <div>
                Commerce
              </div>
            </Link>
          </li>
          <li>
            <Link to="/market" onClick={closeMenuOnNavigation} className={isActive('/market') ? 'active' : ''}>
              <ShoppingCartIcon className="menu-icon" />
              <div>
                Marché
              </div>
            </Link>
          </li>
          <li>
            <Link to="/world" onClick={closeMenuOnNavigation} id="menu-world" className={isActive('/world') ? 'active' : ''}>
              <PublicIcon className="menu-icon" />
              <div>
                Carte du Monde
              </div>
            </Link>
          </li>
          <li>
            <Link to="/portals" onClick={closeMenuOnNavigation} id="menu-portals" className={isActive('/portals') ? 'active' : ''}>
              <ExploreIcon className="menu-icon" />
              <div>
                Portails PvE
              </div>
            </Link>
          </li>
          <li>
            <Link to="/cities" onClick={closeMenuOnNavigation} className={isActive('/cities') ? 'active' : ''}>
              <LocationCityIcon className="menu-icon" />
              <div>
                Spécialisation
              </div>
            </Link>
          </li>
          <li>
            <Link to="/alliance" onClick={closeMenuOnNavigation} className={isActive('/alliance') ? 'active' : ''}>
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