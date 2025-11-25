// src/components/Dashboard.js

import React from 'react';
import Menu from './Menu';
import './Dashboard.css';
import useDashboardData from '../hooks/useDashboardData';

const Dashboard = () => {
  const { dashboard, resources, loading, connectionStatus } = useDashboardData();
  const { user, buildings, units } = dashboard;

  if (loading && !user?.username) return <div>Loading...</div>;

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

  return (
    <div className="dashboard">
      <Menu />
      <div className="dashboard-content" id="main-content">
        <div className="dashboard-header">
          <h1>Tableau de bord</h1>
          <p className="dashboard-connection">{connectionStatus}</p>
        </div>
        <div className="dashboard-modules">
          <div className="dashboard-module">
            <h2>Informations</h2>
            <p>Pseudo: {user?.username}</p>
            <p>Level: {user?.level}</p>
            <p>Points d'expérience: {user?.points_experience}</p>
            <p>Rang: {user?.rang}</p>
          </div>

          <div className="dashboard-module dashboard-resources">
            <h2>Ressources</h2>
            <ul>
              {resources.map((r) => {
                const amt = Math.floor(Number(r.amount) || 0);
                return (
                  <li key={r.type}>
                    <img
                      src={`./images/resources/${formatFileName(r.type)}.png`}
                      alt={r.type}
                      className="dashboard-resource-icon"
                    />
                    <span className="dashboard-resource-text">
                      {r.type.charAt(0).toUpperCase() + r.type.slice(1)}: {amt}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="dashboard-module dashboard-buildings">
            <h2>Bâtiments</h2>
            <ul>
              {buildings.map((b) => (
                <li key={b.id}>
                  <img
                    src={`./images/buildings/${formatFileName(b.name)}.png`}
                    alt={b.name}
                    className="dashboard-building-icon"
                  />
                  <span className="dashboard-building-text">
                    {b.name} (Level: {b.level})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="dashboard-module dashboard-units">
            <h2>Unités</h2>
            <ul>
              {units.map((u) => (
                <li key={u.id}>
                  <img
                    src={`./images/training/${formatFileName(u.name)}.png`}
                    alt={u.name}
                    className="dashboard-unit-icon"
                  />
                  <span className="dashboard-unit-text">
                    {u.name}: {u.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;