/**
 * Portals Page
 * Main portal system interface - list, filters, mastery, history
 */

import React, { useState, useEffect } from 'react';
import { 
  getActivePortals, 
  getUserMastery, 
  getBattleHistory,
  getGoldenPortalEvents 
} from '../api/portals';
import PortalCard from '../components/portals/PortalCard';
import PortalDetailModal from '../components/portals/PortalDetailModal';
import PortalMasteryPanel from '../components/portals/PortalMasteryPanel';
import PortalHistoryPanel from '../components/portals/PortalHistoryPanel';
import BossListPanel from '../components/portals/BossListPanel';
import RaidPanel from '../components/portals/RaidPanel';
import PortalQuestPanel from '../components/portals/PortalQuestPanel';
import QuestProgressNotification from '../components/portals/QuestProgressNotification';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import './Portals.css';

const TIER_FILTERS = [
  { value: '', label: 'Tous les tiers', color: '#666' },
  { value: 'grey', label: 'Gris (E)', color: '#808080' },
  { value: 'green', label: 'Vert (D)', color: '#00FF00' },
  { value: 'blue', label: 'Bleu (C)', color: '#0099FF' },
  { value: 'purple', label: 'Violet (B)', color: '#9933FF' },
  { value: 'red', label: 'Rouge (A)', color: '#FF0000' },
  { value: 'golden', label: 'Doré (S)', color: '#FFD700' }
];

const Portals = () => {
  const [activeTab, setActiveTab] = useState('portals'); // portals | mastery | history | bosses | raids
  const [portals, setPortals] = useState([]);
  const [filteredPortals, setFilteredPortals] = useState([]);
  const [mastery, setMastery] = useState([]);
  const [history, setHistory] = useState([]);
  const [goldenEvents, setGoldenEvents] = useState([]);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAlliance, setUserAlliance] = useState(null); // For raid panel
  
  // Filters
  const [tierFilter, setTierFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState({ min: 1, max: 10 });
  const [sortBy, setSortBy] = useState('expiry'); // expiry | difficulty | power

  useEffect(() => {
    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [portals, tierFilter, difficultyFilter, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [portalsData, masteryData, historyData, eventsData] = await Promise.all([
        getActivePortals(),
        getUserMastery().catch(() => []),
        getBattleHistory(20).catch(() => []),
        getGoldenPortalEvents().catch(() => [])
      ]);

      setPortals(portalsData.data || portalsData || []);
      setMastery(masteryData.data || masteryData || []);
      setHistory(historyData.data || historyData || []);
      setGoldenEvents(eventsData.data || eventsData || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading portal data:', err);
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des portails'));
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...portals];

    // Tier filter
    if (tierFilter) {
      filtered = filtered.filter(p => p.tier === tierFilter);
    }

    // Difficulty filter
    filtered = filtered.filter(p => 
      p.difficulty >= difficultyFilter.min && 
      p.difficulty <= difficultyFilter.max
    );

    // Sort
    if (sortBy === 'expiry') {
      filtered.sort((a, b) => new Date(a.expiry_time) - new Date(b.expiry_time));
    } else if (sortBy === 'difficulty') {
      filtered.sort((a, b) => b.difficulty - a.difficulty);
    } else if (sortBy === 'power') {
      filtered.sort((a, b) => b.recommended_power - a.recommended_power);
    }

    setFilteredPortals(filtered);
  };

  const handlePortalSelect = (portal) => {
    setSelectedPortal(portal);
  };

  const handlePortalClose = () => {
    setSelectedPortal(null);
  };

  const handleBattleComplete = () => {
    setSelectedPortal(null);
    loadData(); // Refresh data
    
    // Notify quest panel to refresh quest progress
    window.dispatchEvent(new CustomEvent('questProgressUpdate', {
      detail: { source: 'portal_battle' }
    }));
  };

  const formatTimeRemaining = (expiryTime) => {
    const now = new Date();
    const expires = new Date(expiryTime);
    const diff = expires - now;

    if (diff <= 0) return 'Expiré';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}j ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading && portals.length === 0) {
    return (
      <div className="portals-page">
        <div className="portals-loading">
          <div className="spinner"></div>
          <p>Chargement des portails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portals-page">
      <div className="portals-header">
        <h1>🌀 Portails PvE</h1>
        <p className="portals-subtitle">
          Explorez des portails interdimensionnels, combattez des ennemis et obtenez des récompenses
        </p>
      </div>

      {goldenEvents.length > 0 && (
        <div className="golden-event-banner">
          <div className="golden-glow"></div>
          <h3>🏆 PORTAIL DORÉ ACTIF !</h3>
          <p>Un portail légendaire est apparu ! Récompenses exclusives disponibles.</p>
          <button 
            className="btn-golden"
            onClick={() => {
              const goldenPortal = portals.find(p => p.tier === 'golden');
              if (goldenPortal) handlePortalSelect(goldenPortal);
            }}
          >
            Voir le Portail Doré
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="portals-tabs">
        <button
          className={`tab ${activeTab === 'portals' ? 'active' : ''}`}
          onClick={() => setActiveTab('portals')}
        >
          Portails Actifs ({filteredPortals.length})
        </button>
        <button
          className={`tab ${activeTab === 'mastery' ? 'active' : ''}`}
          onClick={() => setActiveTab('mastery')}
        >
          Maîtrise
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Historique
        </button>
        <button
          className={activeTab === 'bosses' ? 'active' : ''}
          onClick={() => setActiveTab('bosses')}
        >
          🐉 Boss Battles
        </button>
        <button
          className={activeTab === 'raids' ? 'active' : ''}
          onClick={() => setActiveTab('raids')}
        >
          👥 Alliance Raids
        </button>
        <button
          className={activeTab === 'quests' ? 'active' : ''}
          onClick={() => setActiveTab('quests')}
        >
          📜 Quêtes
        </button>
      </div>

      {activeTab === 'portals' && (
        <>
          <div className="portals-filters">
            <div className="filter-group">
              <label>Tier:</label>
              <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                {TIER_FILTERS.map(tier => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Difficulté:</label>
              <div className="difficulty-range">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={difficultyFilter.min}
                  onChange={(e) => setDifficultyFilter(prev => ({ 
                    ...prev, 
                    min: parseInt(e.target.value) 
                  }))}
                />
                <span>-</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={difficultyFilter.max}
                  onChange={(e) => setDifficultyFilter(prev => ({ 
                    ...prev, 
                    max: parseInt(e.target.value) 
                  }))}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Trier par:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="expiry">Temps restant</option>
                <option value="difficulty">Difficulté</option>
                <option value="power">Puissance</option>
              </select>
            </div>

            <button className="btn-refresh" onClick={loadData}>
              🔄 Actualiser
            </button>
          </div>

          <div className="portals-grid">
            {filteredPortals.length === 0 ? (
              <div className="no-portals">
                <p>Aucun portail actif ne correspond à vos filtres.</p>
                <button onClick={() => {
                  setTierFilter('');
                  setDifficultyFilter({ min: 1, max: 10 });
                }}>
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              filteredPortals.map(portal => (
                <PortalCard
                  key={portal.id}
                  portal={portal}
                  onClick={() => handlePortalSelect(portal)}
                  formatTimeRemaining={formatTimeRemaining}
                />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'mastery' && (
        <PortalMasteryPanel mastery={mastery} onRefresh={loadData} />
      )}

      {activeTab === 'history' && (
        <PortalHistoryPanel history={history} onRefresh={loadData} />
      )}

      {activeTab === 'bosses' && (
        <BossListPanel />
      )}

      {activeTab === 'raids' && (
        <RaidPanel allianceId={userAlliance?.id} />
      )}

      {activeTab === 'quests' && (
        <PortalQuestPanel />
      )}

      {selectedPortal && (
        <PortalDetailModal
          portal={selectedPortal}
          onClose={handlePortalClose}
          onBattleComplete={handleBattleComplete}
        />
      )}

      {/* Quest progress notifications */}
      <QuestProgressNotification />
    </div>
  );
};

export default Portals;
