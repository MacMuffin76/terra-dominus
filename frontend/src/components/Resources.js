import React, { useEffect, useState } from 'react';
import { Building, TrendingUp } from 'lucide-react';
import Menu from './Menu';
import { useAsyncError } from '../hooks/useAsyncError';
import socket from '../utils/socket';
import './Resources.css';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader } from './ui';
import PremiumCard from './shared/PremiumCard';
import DetailModal from './shared/DetailModal';
import {
  getAllowedResourceBuildings,
  getResourceBuildings,
  upgradeResourceBuilding,
} from '../api/resourceBuildings';

const Resources = () => {
  const { error, catchError, clearError } = useAsyncError('Resources');
  const [data, setData] = useState([]);
  const [selectedBuilding, setSel] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [allowedBuildings, setAllowedBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const orderBuildings = (list, allowed) => 
    allowed.map(n => list.find(b => b.name === n)).filter(Boolean);

  const fetchData = async () => {
    setLoading(true);
    clearError();
    
    try {
      const [allowed, buildings] = await Promise.all([
        getAllowedResourceBuildings(),
        getResourceBuildings(),
      ]);
      
      setAllowedBuildings(allowed);
      const filtered = buildings.filter(b => allowed.includes(b.name));
      setData(orderBuildings(filtered, allowed));
    } catch (err) {
      catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {}); // Ignorer le re-throw
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Écouter les événements de construction
  useEffect(() => {
    const handleConstructionUpdate = () => {
      // Rafraîchir les données quand une construction est mise à jour
      fetchData();
    };

    socket.on('construction_queue:update', handleConstructionUpdate);

    // Vérifier régulièrement si des constructions sont terminées
    const checkInterval = setInterval(() => {
      const hasBuilding = data.some(b => b.status === 'building' && b.constructionEndsAt);
      if (hasBuilding) {
        const now = new Date().getTime();
        const shouldRefresh = data.some(b => {
          if (b.status === 'building' && b.constructionEndsAt) {
            const endTime = new Date(b.constructionEndsAt).getTime();
            return endTime <= now;
          }
          return false;
        });
        if (shouldRefresh) {
          fetchData();
        }
      }
    }, 2000); // Vérifier toutes les 2 secondes

    return () => {
      socket.off('construction_queue:update', handleConstructionUpdate);
      clearInterval(checkInterval);
    };
  }, [data]);

  const handleCardClick = (building) => {
    setSel(building);
    setModalOpen(true);
  };

  const handleUpgrade = async () => {
    if (!selectedBuilding || upgrading) return;
    
    setUpgrading(true);
    try {
      const response = await upgradeResourceBuilding(selectedBuilding.id);
      const updated = response.data?.building || response;
      
      // Update local state
      const updatedData = data.map(b => b.id === updated.id ? updated : b);
      setData(orderBuildings(updatedData, allowedBuildings));
      setSel(updated);
      
      // Ne fermer le modal que si ce n'est pas une construction en cours
      if (updated.status !== 'building') {
        setModalOpen(false);
      }
    } catch (err) {
      catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {});
    } finally {
      setUpgrading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSel(null);
  };

  const builtCount = data.filter(b => b.level > 0).length;
  const totalProduction = data.reduce((sum, b) => {
    if (b.level > 0) {
      return sum + (b.level * 10);
    }
    return sum;
  }, 0);

  return (
    <div className="resources-container">
      <Menu />
      <div className="resources-content" id="main-content">
        <ResourcesWidget />
        <div className="resources-header">
          <div className="header-title">
            <Building size={32} />
            <h1>Bâtiments de Ressources</h1>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <TrendingUp size={20} />
              <span>{builtCount}/{data.length} Construits</span>
            </div>
            {totalProduction > 0 && (
              <div className="stat-badge production">
                <span>📈 Production active</span>
              </div>
            )}
          </div>
        </div>

        {loading && <Loader label="Chargement des ressources..." />}
        
        {error && (
          <Alert
            type="error"
            title="Bâtiments de ressources"
            message={error}
            onAction={fetchData}
            actionLabel="Réessayer"
          />
        )}

        <div className="resources-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="card-skeleton" />
            ))
          ) : data.length > 0 ? (
            data.map((building) => {
              const isBuilt = building.level > 0;
              const isBuilding = building.status === 'building';
              const formatFileName = (name) => {
                if (!name) return 'default';
                return name
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/['']/g, '')
                  .replace(/\s+/g, '_');
              };

              // Resource icon
              const getIcon = (name) => {
                if (!name) return '🏗️';
                if (name.includes('or')) return '💰';
                if (name.includes('métal')) return '⚙️';
                if (name.includes('Extracteur')) return '⛽';
                if (name.includes('électrique')) return '⚡';
                if (name.includes('Hangar')) return '📦';
                if (name.includes('Réservoir')) return '🛢️';
                return '🏗️';
              };

              // Tier based on building type
              const getTier = (name) => {
                if (!name) return 1;
                if (name.includes('Centrale')) return 3;
                if (name.includes('Réservoir')) return 2;
                if (name.includes('métal') || name.includes('Extracteur')) return 2;
                return 1;
              };

              return (
                <PremiumCard
                  key={building.id}
                  title={building.name}
                  image={`/images/buildings/${formatFileName(building.name)}.png`}
                  description={building.description || 'Bâtiment de ressource'}
                  tier={getTier(building.name)}
                  level={building.level}
                  maxLevel={building.max_level || 10}
                  isLocked={!isBuilt}
                  lockReason={!isBuilt ? 'Non construit' : undefined}
                  isInProgress={isBuilding}
                  buildTime={building.constructionEndsAt}
                  badge={getIcon(building.name)}
                  stats={{
                    production: building.production_rate || 0,
                    capacity: building.capacite || 0,
                  }}
                  cost={{
                    gold: building.cost_gold || 0,
                    metal: building.cost_metal || 0,
                    fuel: building.cost_fuel || 0,
                    energy: building.cost_energy || 0,
                    time: building.construction_time || 0,
                  }}
                  onClick={() => handleCardClick(building)}
                  onAction={() => handleCardClick(building)}
                  actionLabel={isBuilt ? 'Améliorer' : 'Construire'}
                />
              );
            })
          ) : (
            !error && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <p>Aucun bâtiment dans cette catégorie</p>
              </div>
            )
          )}
        </div>

        {selectedBuilding && (
          <DetailModal
            isOpen={modalOpen}
            onClose={handleCloseModal}
            title={selectedBuilding.name || 'Bâtiment'}
            image={`/images/buildings/${selectedBuilding.name ? selectedBuilding.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['']/g, '').replace(/\s+/g, '_') : 'default'}.png`}
            description={selectedBuilding.description || 'Bâtiment de production ou de stockage de ressources'}
            tier={selectedBuilding.name ? (selectedBuilding.name.includes('Centrale') ? 3 : selectedBuilding.name.includes('Réservoir') || selectedBuilding.name.includes('métal') ? 2 : 1) : 1}
            level={selectedBuilding.level}
            nextLevel={selectedBuilding.level + 1}
            stats={{
              production: selectedBuilding.production_rate || 0,
              capacity: selectedBuilding.capacite || 0,
            }}
            nextLevelStats={{
              production: (selectedBuilding.production_rate || 0) * 1.5,
              capacity: (selectedBuilding.capacite || 0) * 1.5,
            }}
            cost={{
              gold: selectedBuilding.cost_gold || 0,
              metal: selectedBuilding.cost_metal || 0,
              fuel: selectedBuilding.cost_fuel || 0,
              energy: selectedBuilding.cost_energy || 0,
              time: selectedBuilding.construction_time || 0,
            }}
            benefits={[
              'Augmente la production de ressources',
              'Améliore la capacité de stockage',
              'Débloque de nouvelles technologies',
            ]}
            requirements={{}}
            onAction={handleUpgrade}
            actionLabel={upgrading ? 'Amélioration...' : (selectedBuilding.level > 0 ? 'Améliorer' : 'Construire')}
            actionDisabled={upgrading || selectedBuilding.status === 'building'}
          />
        )}
      </div>
    </div>
  );
};

export default Resources;
