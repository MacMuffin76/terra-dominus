import React from 'react';
import Menu from './Menu';
import './Alliance.css';
import ResourcesWidget from './ResourcesWidget';
const Alliance = () => {
  return (
    <div className="alliance-container">
      <Menu />
      <ResourcesWidget />
      <div className="content">
        <h1>Alliance</h1>
      </div>
    </div>
  );
};

export default Alliance;
