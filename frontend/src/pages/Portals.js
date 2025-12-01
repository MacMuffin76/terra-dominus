import React, { useState, useEffect } from 'react';
import Menu from '../components/Menu';
import { getActivePortals } from '../api/portals';
import PortalModal from '../components/PortalModal';
import '../components/Portals.css';

/**
 * Page Portails PvE
 * Affiche la liste des portails disponibles pour les expéditions
 */
const Portals = () => {
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [filter, setFilter] = useState('all'); // all, easy, medium, hard

  useEffect(() => {
    loadPortals();
  }, []);

  const loadPortals = async () => {
    try {
      setLoading(true);
      const data = await getActivePortals();
      setPortals(data.portals || []);
    } catch (error) {
      console.error('Erreur lors du chargement des portails:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      1: '#4ade80', // Facile - vert
      2: '#60a5fa', // Moyen - bleu
      3: '#f59e0b', // Difficile - orange
      4: '#ef4444', // Très difficile - rouge
      5: '#a855f7', // Extrême - violet
    };
    return colors[difficulty] || '#6b7280';
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      1: '⭐ Facile',
      2: '⭐⭐ Moyen',
      3: '⭐⭐⭐ Difficile',
      4: '⭐⭐⭐⭐ Très Difficile',
      5: '⭐⭐⭐⭐⭐ Extrême',
    };
    return labels[difficulty] || 'Inconnu';
  };

  const filteredPortals = portals.filter((portal) => {
    if (filter === 'all') return true;
    if (filter === 'easy') return portal.difficulty <= 2;
    if (filter === 'medium') return portal.difficulty === 3;
    if (filter === 'hard') return portal.difficulty >= 4;
    return true;
  });

  return (
    <>
      <Menu />
      <div className="portals-page">
        <div className="portals-header">
          <h1>🌀 Portails Dimensionnels</h1>
          <p className="subtitle">
            Envoyez vos unités en expédition pour découvrir des ressources et des récompenses
          </p>
        </div>

        {/* Filtres */}
        <div className="portals-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous ({portals.length})
          </button>
          <button
            className={`filter-btn ${filter === 'easy' ? 'active' : ''}`}
            onClick={() => setFilter('easy')}
          >
            Facile ({portals.filter((p) => p.difficulty <= 2).length})
          </button>
          <button
            className={`filter-btn ${filter === 'medium' ? 'active' : ''}`}
            onClick={() => setFilter('medium')}
          >
            Moyen ({portals.filter((p) => p.difficulty === 3).length})
          </button>
          <button
            className={`filter-btn ${filter === 'hard' ? 'active' : ''}`}
            onClick={() => setFilter('hard')}
          >
            Difficile ({portals.filter((p) => p.difficulty >= 4).length})
          </button>
        </div>

        {/* Liste des portails */}
        {loading ? (
          <div className="portals-loading">
            <div className="loader-spinner" />
            <p>Chargement des portails...</p>
          </div>
        ) : (
          <div className="portals-grid">
            {filteredPortals.map((portal) => (
              <div
                key={portal.id}
                className="portal-card"
                onClick={() => setSelectedPortal(portal)}
                style={{
                  borderColor: getDifficultyColor(portal.difficulty),
                }}
              >
                <div className="portal-icon">🌀</div>
                <h3>{portal.name}</h3>
                <div
                  className="portal-difficulty"
                  style={{ color: getDifficultyColor(portal.difficulty) }}
                >
                  {getDifficultyLabel(portal.difficulty)}
                </div>
                <div className="portal-info">
                  <div className="portal-stat">
                    <span className="stat-label">Puissance:</span>
                    <span className="stat-value">{portal.power || 0}</span>
                  </div>
                  <div className="portal-stat">
                    <span className="stat-label">Récompense:</span>
                    <span className="stat-value">⭐ {portal.reward_multiplier || 1}x</span>
                  </div>
                </div>
                <button className="portal-explore-btn">Explorer →</button>
              </div>
            ))}

            {filteredPortals.length === 0 && (
              <div className="no-portals">
                <p>Aucun portail disponible avec ce filtre</p>
              </div>
            )}
          </div>
        )}

        {/* Modal de portail */}
        {selectedPortal && (
          <PortalModal
            portal={selectedPortal}
            onClose={() => setSelectedPortal(null)}
            onExpeditionComplete={loadPortals}
          />
        )}
      </div>
    </>
  );
};

export default Portals;
