// src/components/Dashboard.js

import React from 'react';
import Menu from './Menu';
import './Dashboard.css';
import useDashboardData from '../hooks/useDashboardData';
import { Alert, Loader, Skeleton } from './ui';
import ResourcesWidget from './dashboard/ResourcesWidget';
import StatCard from './dashboard/StatCard';
import ProgressCard from './dashboard/ProgressCard';
import NotificationPanel from './dashboard/NotificationPanel';

const Dashboard = () => {
  const { dashboard, resources, loading, connectionStatus, error, refresh } = useDashboardData();
  const { user, buildings, units } = dashboard;

  if (loading && !user?.username)
    return <Loader center label="Chargement du tableau de bord" size="lg" />;

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

  // Prepare data for ProgressCard components
  const buildingsData = buildings.map(b => ({
    id: b.id,
    name: b.name,
    level: b.level,
    image: `./images/buildings/${formatFileName(b.name)}.png`
  }));

  const unitsData = units.map(u => ({
    id: u.id,
    name: u.name,
    quantity: u.quantity,
    image: `./images/training/${formatFileName(u.name)}.png`
  }));

  return (
    <div className="dashboard">
      <Menu />
      <div className="dashboard-content" id="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">⚡ COMMANDEMENT CENTRAL</h1>
        </div>

        <NotificationPanel connectionStatus={connectionStatus} onRefresh={refresh} />

        {error && (
          <div className="dashboard-alert">
            <Alert
              type="error"
              title="Données du tableau de bord"
              message={error}
              onAction={refresh}
              actionLabel="Rafraîchir"
            />
          </div>
        )}

        <ResourcesWidget resources={resources} />

        <div className="dashboard-stats-grid">
          <StatCard
            icon="👤"
            label="Commandant"
            value={user?.username}
            variant="primary"
            loading={!user?.username}
          />
          <StatCard
            icon="⭐"
            label="Niveau"
            value={user?.level}
            sublabel={`${user?.points_experience || 0} XP`}
            variant="success"
            loading={user?.level === undefined}
          />
          <StatCard
            icon="🏆"
            label="Rang"
            value={user?.rang || 'Recrue'}
            variant="warning"
            loading={!user?.rang}
          />
          <StatCard
            icon="🏛️"
            label="Bâtiments"
            value={buildings.length}
            sublabel="Structures actives"
            variant="default"
          />
        </div>

        <div className="dashboard-progress-grid">
          <ProgressCard
            title="Bâtiments"
            icon="🏛️"
            items={buildingsData}
            emptyMessage="Aucun bâtiment construit"
          />
          <ProgressCard
            title="Unités"
            icon="⚔️"
            items={unitsData}
            emptyMessage="Aucune unité entraînée"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;