import React, { useEffect, useState } from 'react';
import { Building, TrendingUp } from 'lucide-react';
import Menu from './Menu';
import { useAsyncError } from '../hooks/useAsyncError';
import './Resources.css';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Modal } from './ui';
import BuildingCard from './resources/BuildingCard';
import ResourceDetail from './ResourceDetail';
import {
  getAllowedResourceBuildings,
  getResourceBuildings,
} from '../api/resourceBuildings';

const Resources = () => {
  const { error, catchError, clearError } = useAsyncError('Resources');
  const [data, setData] = useState([]);
  const [selectedBuilding, setSel] = useState(null);
  const [allowedBuildings, setAllowedBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, production, storage

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

  const handleClick = b => setSel(prev => prev?.id === b.id ? null : b);
  const handleUp = updated => handleUpdate(updated);
  const handleDown = updated => handleUpdate(updated);

  const handleUpdate = updated => {
    const upd = data.map(b => b.id === updated.id ? updated : b);
    const ordered = orderBuildings(upd, allowedBuildings);
    setData(ordered);
    setSel(updated);
  };

  const getFilteredBuildings = () => {
    if (filterType === 'all') return data;
    if (filterType === 'production') {
      return data.filter(b => 
        b.name.includes('Mine') || 
        b.name.includes('Extracteur') || 
        b.name.includes('Centrale')
      );
    }
    if (filterType === 'storage') {
      return data.filter(b => 
        b.name.includes('Hangar') || 
        b.name.includes('Réservoir')
      );
    }
    return data;
  };

  const filteredData = getFilteredBuildings();
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

        {/* Filter Tabs */}
        {!loading && !error && (
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Tous ({data.length})
            </button>
            <button
              className={`filter-tab ${filterType === 'production' ? 'active' : ''}`}
              onClick={() => setFilterType('production')}
            >
              Production ({data.filter(b => b.name.includes('Mine') || b.name.includes('Extracteur') || b.name.includes('Centrale')).length})
            </button>
            <button
              className={`filter-tab ${filterType === 'storage' ? 'active' : ''}`}
              onClick={() => setFilterType('storage')}
            >
              Stockage ({data.filter(b => b.name.includes('Hangar') || b.name.includes('Réservoir')).length})
            </button>
          </div>
        )}

        <div className="resources-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <BuildingCard key={`skeleton-${idx}`} loading={true} />
            ))
          ) : filteredData.length > 0 ? (
            filteredData.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                isSelected={selectedBuilding?.id === building.id}
                onClick={handleClick}
                status={building.status}
                constructionEndsAt={building.constructionEndsAt}
              />
            ))
          ) : (
            !error && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <p>Aucun bâtiment dans cette catégorie</p>
              </div>
            )
          )}
        </div>

        {selectedBuilding && (
          <Modal isOpen={!!selectedBuilding} onClose={() => setSel(null)}>
            <ResourceDetail
              building={selectedBuilding}
              onBuildingUpgraded={handleUp}
              onBuildingDowngraded={handleDown}
              onClose={() => setSel(null)}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Resources;
