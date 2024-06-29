import React from 'react';
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

const Menu = () => {
  return (
    <div className="menu">
      <div className="menu-title">Main Menu</div>
      <Link to="/dashboard">
        <DashboardIcon className="menu-icon" />
        <div>
          Dashboard
        </div>
      </Link>
      <Link to="/resources">
        <CategoryIcon className="menu-icon" />
        <div>
          Resources
        </div>
      </Link>
      <Link to="/facilities">
        <BusinessIcon className="menu-icon" />
        <div>
          Facilities
        </div>
      </Link>
      <Link to="/research">
        <ScienceIcon className="menu-icon" />
        <div>
          Research
        </div>
      </Link>
      <Link to="/construction">
        <BuildIcon className="menu-icon" />
        <div>
          Construction Site
        </div>
      </Link>
      <Link to="/defense">
        <SecurityIcon className="menu-icon" />
        <div>
          Defense
        </div>
      </Link>
      <Link to="/fleet">
        <DirectionsBoatIcon className="menu-icon" />
        <div>
          Fleet
        </div>
      </Link>
      <Link to="/alliance">
        <GroupIcon className="menu-icon" />
        <div>
          Alliance
        </div>
      </Link>
    </div>
  );
};

export default Menu;
