import React from 'react';
import Menu from './Menu';
import './Fleet.css';
import ResourcesWidget from './ResourcesWidget';
const Fleet = () => {
  return (
    <div className="fleet-container">
      <Menu />
      <ResourcesWidget />
      <div className="content">
        <h1>Fleet</h1>
      </div>
    </div>
  );
};

export default Fleet;
