import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
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
import LogoutIcon from '@mui/icons-material/Logout';
import './Menu.css';
import { useTheme } from '../context/ThemeContext';
import { trackSessionEnd } from '../utils/analytics';

const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = (path, event) => {
    // Si on clique sur le lien de la page actuelle, recharger
    if (location.pathname === path) {
      event.preventDefault();
      window.location.reload();
    } else {
      closeMenuOnNavigation();
    }
  };

  const handleLogout = () => {
    trackSessionEnd('logout');
    dispatch(logout());
    navigate('/login');
  };

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
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            aria-label="Se déconnecter"
          >
            <LogoutIcon className="menu-icon" />
            <span className="logout-label">Déconnexion</span>
          </button>
        </div>
        <ul className="menu-list">
          <li>
            <Link to="/dashboard" onClick={(e) => handleLinkClick('/dashboard', e)} id="menu-dashboard" className={isActive('/dashboard') ? 'active' : ''}>
              <DashboardIcon className="menu-icon" />
              <div>
                Tableau de bord
              </div>
            </Link>
          </li>
          <li>
            <Link to="/resources" onClick={(e) => handleLinkClick('/resources', e)} id="menu-resources" className={isActive('/resources') ? 'active' : ''}>
              <CategoryIcon className="menu-icon" />
              <div>
                Ressource
              </div>
            </Link>
          </li>
          <li>
            <Link to="/facilities" onClick={(e) => handleLinkClick('/facilities', e)} id="menu-facilities" className={isActive('/facilities') ? 'active' : ''}>
              <BusinessIcon className="menu-icon" />
              <div>
                Installation
              </div>
            </Link>
          </li>
          <li>
            <Link to="/research" onClick={(e) => handleLinkClick('/research', e)} id="menu-research" className={isActive('/research') ? 'active' : ''}>
              <ScienceIcon className="menu-icon" />
              <div>
                Recherche
              </div>
            </Link>
          </li>
          <li>
            <Link to="/training" onClick={(e) => handleLinkClick('/training', e)} id="menu-training" className={isActive('/training') ? 'active' : ''}>
              <BuildIcon className="menu-icon" />
              <div>
                Centre d'entrainement
              </div>
            </Link>
          </li>
          <li>
            <Link to="/defense" onClick={(e) => handleLinkClick('/defense', e)} className={isActive('/defense') ? 'active' : ''}>
              <SecurityIcon className="menu-icon" />
              <div>
                Defense
              </div>
            </Link>
          </li>
          <li>
            <Link to="/fleet" onClick={(e) => handleLinkClick('/fleet', e)} className={isActive('/fleet') ? 'active' : ''}>
              <DirectionsBoatIcon className="menu-icon" />
              <div>
                Flotte
              </div>
            </Link>
          </li>
          <li>
            <Link to="/trade" onClick={(e) => handleLinkClick('/trade', e)} className={isActive('/trade') ? 'active' : ''}>
              <LocalShippingIcon className="menu-icon" />
              <div>
                Commerce
              </div>
            </Link>
          </li>
          <li>
            <Link to="/market" onClick={(e) => handleLinkClick('/market', e)} className={isActive('/market') ? 'active' : ''}>
              <ShoppingCartIcon className="menu-icon" />
              <div>
                Marché
              </div>
            </Link>
          </li>
          <li>
            <Link to="/world" onClick={(e) => handleLinkClick('/world', e)} id="menu-world" className={isActive('/world') ? 'active' : ''}>
              <PublicIcon className="menu-icon" />
              <div>
                Carte du Monde
              </div>
            </Link>
          </li>
          <li>
            <Link to="/portals" onClick={(e) => handleLinkClick('/portals', e)} id="menu-portals" className={isActive('/portals') ? 'active' : ''}>
              <ExploreIcon className="menu-icon" />
              <div>
                Portails PvE
              </div>
            </Link>
          </li>
          <li>
            <Link to="/cities" onClick={(e) => handleLinkClick('/cities', e)} className={isActive('/cities') ? 'active' : ''}>
              <LocationCityIcon className="menu-icon" />
              <div>
                Spécialisation
              </div>
            </Link>
          </li>
          <li>
            <Link to="/alliance" onClick={(e) => handleLinkClick('/alliance', e)} className={isActive('/alliance') ? 'active' : ''}>
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