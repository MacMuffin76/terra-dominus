// src/components/dashboard/StatCard.js

import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, label, value, sublabel, variant = 'default', loading = false }) => {
  const Skeleton = () => (
    <div className="terra-stat-skeleton"></div>
  );

  return (
    <div className={`terra-stat-card terra-stat-card-${variant}`}>
      <div className="terra-stat-header">
        {icon && <span className="terra-stat-icon">{icon}</span>}
        <span className="terra-stat-label">{label}</span>
      </div>
      <div className="terra-stat-value">
        {loading ? <Skeleton /> : value}
      </div>
      {sublabel && (
        <div className="terra-stat-sublabel">{sublabel}</div>
      )}
      <div className="terra-stat-glow"></div>
    </div>
  );
};

export default StatCard;
