import React, { useEffect, useState, useRef, useCallback } from 'react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import PortalMarker from './PortalMarker';
import PortalModal from './PortalModal';
import { getVisibleWorld, getAvailableCitySlots, getTileInfo, startColonization } from '../api/world';
import { getUserCities, getMaxCitiesLimit } from '../api/world';
import { getActivePortals } from '../api/portals';
import { Alert, Loader } from './ui';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { useAsyncError } from '../hooks/useAsyncError';
import { usePortalEvents } from '../hooks/usePortalEvents';
import { getLogger } from '../utils/logger';
import './WorldMap.css';

const logger = getLogger('WorldMap');

const CELL_SIZE = 30; // Taille d'une case en pixels
const TERRAIN_COLORS = {
  plains: '#90EE90',
  forest: '#228B22',
  mountain: '#8B4513',
  hills: '#D2B48C',
  desert: '#F4A460',
  water: '#4682B4',
};

const WorldMap = () => {
  const { error, loading: asyncLoading, catchError, clearError } = useAsyncError('WorldMap');
  const [worldData, setWorldData] = useState(null);
  const [cities, setCities] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [maxCities, setMaxCities] = useState(1);
  const [portals, setPortals] = useState([]);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [tileInfo, setTileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Charger les données initiales
  const loadWorldData = useCallback(async () => {
    setLoading(true);
    clearError();

    const result = await catchError(
      async () => {
        const [world, userCities, slots, limitData, portalsData] = await Promise.all([
          getVisibleWorld(),
          getUserCities(),
          getAvailableCitySlots(),
          getMaxCitiesLimit(),
          getActivePortals().catch((err) => {
            logger.warn('Failed to load portals (non-critical)', err);
            return { data: [] };
          })
        ]);
        
        return { world, userCities, slots, limitData, portalsData };
      },
      { 
        toast: true, 
        logError: true,
        fallbackMessage: 'Impossible de charger la carte du monde.'
      }
    );

    if (result) {
      setWorldData(result.world);
      setCities(result.userCities);
      setAvailableSlots(result.slots);
      setMaxCities(result.limitData.maxCities);
      setPortals(result.portalsData?.data || []);

      // Centrer la vue sur la capitale (première ville)
      if (result.userCities.length > 0) {
        const capital = result.userCities[0];
        if (capital.coords) {
          setViewOffset({
            x: -(capital.coords.x * CELL_SIZE) + window.innerWidth / 2,
            y: -(capital.coords.y * CELL_SIZE) + window.innerHeight / 2,
          });
        }
      }
    }

    setLoading(false);
  }, [catchError, clearError]);

  useEffect(() => {
    loadWorldData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Socket.IO events for portals
  usePortalEvents({
    onPortalSpawned: (data) => {
      logger.info('New portal spawned!', data);
      // Reload portals
      getActivePortals()
        .then(result => setPortals(result.data || []))
        .catch(err => logger.error('Failed to reload portals', err));
      
      // Show notification
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Nouveau Portail!', {
          body: `Un portail ${data.tier} est apparu sur la carte!`,
          icon: '/favicon.ico'
        });
      }
    },
    onPortalExpired: (data) => {
      logger.info('Portal expired', data);
      // Remove expired portal from state
      setPortals(prev => prev.filter(p => p.id !== data.portalId));
    },
    onExpeditionResolved: (data) => {
      logger.info('Expedition resolved!', data);
      const message = data.victory 
        ? `✅ Victoire! Vous avez vaincu le portail ${data.portal.tier}!`
        : `❌ Défaite... Vos unités ont été repoussées.`;
      
      alert(message);
      
      // Reload data
      loadWorldData();
    }
  });

  // Dessiner la carte sur le canvas
  useEffect(() => {
    if (!worldData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Adapter la taille du canvas
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Effacer
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner les tiles visibles
    worldData.tiles.forEach((tile) => {
      const x = tile.x * CELL_SIZE + viewOffset.x;
      const y = tile.y * CELL_SIZE + viewOffset.y;

      // Skip si hors écran
      if (x + CELL_SIZE < 0 || y + CELL_SIZE < 0 || x > canvas.width || y > canvas.height) {
        return;
      }

      // Fond selon terrain
      if (tile.isVisible) {
        ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#CCCCCC';
      } else {
        // Case explorée mais non visible: version sombre
        ctx.fillStyle = '#555555';
      }

      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

      // Bordure
      ctx.strokeStyle = tile.isVisible ? '#333' : '#222';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

      // Indicateur city slot
      if (tile.hasCitySlot) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Highlight selected
      if (selectedTile && selectedTile.x === tile.x && selectedTile.y === tile.y) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    });

    // Dessiner les villes
    cities.forEach((city) => {
      if (!city.coords) return;

      const x = city.coords.x * CELL_SIZE + viewOffset.x;
      const y = city.coords.y * CELL_SIZE + viewOffset.y;

      // Icône ville (cercle vert pour capitale, bleu sinon)
      ctx.fillStyle = city.isCapital ? '#00FF00' : '#0000FF';
      ctx.beginPath();
      ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Nom de la ville
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(city.name, x + CELL_SIZE / 2, y - 5);
    });

    // Dessiner les slots disponibles
    availableSlots.forEach((slot) => {
      const x = slot.x * CELL_SIZE + viewOffset.x;
      const y = slot.y * CELL_SIZE + viewOffset.y;

      // Cercle jaune pour slots libres
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 6, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Note: Portals are rendered as React components, not on canvas
  }, [worldData, cities, availableSlots, viewOffset, selectedTile]);

  // Gestion du clic sur une case
  const handleCanvasClick = async (e) => {
    if (!worldData) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const tileX = Math.floor((clickX - viewOffset.x) / CELL_SIZE);
    const tileY = Math.floor((clickY - viewOffset.y) / CELL_SIZE);

    // Trouver la tile correspondante
    const tile = worldData.tiles.find((t) => t.x === tileX && t.y === tileY);

    if (tile) {
      setSelectedTile({ x: tileX, y: tileY });

      const info = await catchError(
        () => getTileInfo(tileX, tileY),
        { toast: false, logError: true }
      );
      
      setTileInfo(info || null);
    }
  };

  // Gestion du drag pour déplacer la carte
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    setViewOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Coloniser un slot
  const handleColonize = async () => {
    if (!tileInfo || !tileInfo.citySlot || tileInfo.citySlot.status !== 'free') {
      alert('Cet emplacement n\'est pas disponible pour la colonisation.');
      return;
    }

    if (cities.length >= maxCities) {
      alert(`Vous avez atteint la limite de ${maxCities} villes. Recherchez des technologies de colonisation.`);
      return;
    }

    const slot = availableSlots.find((s) => s.x === tileInfo.x && s.y === tileInfo.y);
    if (!slot) {
      alert('Slot introuvable.');
      return;
    }

    const departureCityId = cities[0]?.id; // Utiliser la capitale par défaut
    if (!departureCityId) {
      alert('Vous devez avoir au moins une ville pour coloniser.');
      return;
    }

    if (!window.confirm(`Coloniser cet emplacement depuis ${cities[0].name} ?\n\nCoût estimé: ~5000 or, 3000 métal, 2000 carburant\nVous devez avoir au moins 1 Colon.`)) {
      return;
    }

    try {
      await startColonization(departureCityId, slot.id);
      alert('Mission de colonisation lancée ! Vos colons sont en route.');
      
      // Recharger les données
      await loadWorldData();
      setTileInfo(null);
      setSelectedTile(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors du lancement de la colonisation.'));
    }
  };

  const handlePortalClick = (portal) => {
    setSelectedPortal(portal);
    setShowPortalModal(true);
  };

  const handlePortalModalClose = () => {
    setShowPortalModal(false);
    setSelectedPortal(null);
  };

  const handleExpeditionLaunched = () => {
    // Reload world data to update portals
    loadWorldData();
  };

  if (loading) {
    return (
      <div className="worldmap-container">
        <Menu />
        <div className="worldmap-content" id="main-content">
          <ResourcesWidget />
          <Loader center label="Chargement de la carte du monde" size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="worldmap-container">
      <Menu />
      <div className="worldmap-content" id="main-content">
        <ResourcesWidget />
        <div className="worldmap-header">
          <h1>Carte du Monde</h1>
          <div className="worldmap-stats">
            <span>Villes: {cities.length} / {maxCities}</span>
            <span>Cases explorées: {worldData?.exploredCount || 0}</span>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            title="Carte du monde"
            message={error}
            onAction={loadWorldData}
            actionLabel="Réessayer"
          />
        )}

        <div
          className="worldmap-canvas-container"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          role="button"
          aria-label="Carte interactive du monde"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
            }
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          />

          {/* Render portals as React components on top of canvas */}
          {portals.map((portal) => {
            const x = portal.coord_x * CELL_SIZE + viewOffset.x;
            const y = portal.coord_y * CELL_SIZE + viewOffset.y;
            
            // Only render if on screen
            if (x + CELL_SIZE < 0 || y + CELL_SIZE < 0 || 
                x > (containerRef.current?.clientWidth || 0) || 
                y > (containerRef.current?.clientHeight || 0)) {
              return null;
            }

            return (
              <PortalMarker
                key={portal.id}
                portal={portal}
                x={x}
                y={y}
                cellSize={CELL_SIZE}
                isSelected={selectedPortal?.id === portal.id}
                onClick={handlePortalClick}
              />
            );
          })}

          {tileInfo && (
            <div className="worldmap-tile-info">
              <h3>Case ({tileInfo.x}, {tileInfo.y})</h3>
              <p><strong>Terrain:</strong> {tileInfo.terrainInfo?.description || tileInfo.terrain}</p>
              {tileInfo.citySlot && (
                <>
                  <p><strong>Statut:</strong> {tileInfo.citySlot.status}</p>
                  <p><strong>Qualité:</strong> {tileInfo.citySlot.quality} / 5</p>
                  {tileInfo.citySlot.status === 'free' && cities.length < maxCities && (
                    <button onClick={handleColonize} className="btn-colonize">
                      Coloniser
                    </button>
                  )}
                </>
              )}
              <button onClick={() => { setTileInfo(null); setSelectedTile(null); }} className="btn-close">
                Fermer
              </button>
            </div>
          )}
        </div>

        <div className="worldmap-legend">
          <h4>Légende</h4>
          <div className="legend-item">
            <span className="legend-color" style={{ background: TERRAIN_COLORS.plains }}></span> Plaines
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: TERRAIN_COLORS.forest }}></span> Forêt
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: TERRAIN_COLORS.mountain }}></span> Montagnes
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: TERRAIN_COLORS.desert }}></span> Désert
          </div>
          <div className="legend-item">
            <div className="legend-icon" style={{ background: '#00FF00', borderRadius: '50%', width: 16, height: 16 }}></div> Capitale
          </div>
          <div className="legend-item">
            <div className="legend-icon" style={{ background: '#0000FF', borderRadius: '50%', width: 16, height: 16 }}></div> Ville
          </div>
          <div className="legend-item">
            <div className="legend-icon" style={{ background: '#FFD700', borderRadius: '50%', width: 12, height: 12 }}></div> Emplacement libre
          </div>
          <div className="legend-item">
            <div className="legend-icon portal-legend-icon"></div> Portails PvE
          </div>
        </div>

        {showPortalModal && selectedPortal && (
          <PortalModal
            portal={selectedPortal}
            onClose={handlePortalModalClose}
            onExpeditionLaunched={handleExpeditionLaunched}
          />
        )}
      </div>
    </div>
  );
};

export default WorldMap;
