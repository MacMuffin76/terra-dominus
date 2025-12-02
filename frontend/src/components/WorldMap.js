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

const CELL_SIZE = 60; // Taille d'une case en pixels (augmenté pour meilleure visibilité)
const TERRAIN_COLORS = {
  plains: '#90EE90',     // Vert clair
  forest: '#228B22',     // Vert forêt
  mountain: '#8B4513',   // Brun montagne
  hills: '#D2B48C',      // Beige collines
  desert: '#F4A460',     // Sable
  water: '#4682B4',      // Bleu eau
};

const TERRAIN_COLORS_EXPLORED = {
  plains: '#5a7d5a',     // Vert moyen-sombre
  forest: '#2a5d2a',     // Vert sombre
  mountain: '#5d3820',   // Brun moyen-sombre
  hills: '#7a6d5a',      // Beige moyen-sombre
  desert: '#8b7050',     // Sable moyen-sombre
  water: '#3a5d7b',      // Bleu moyen-sombre
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mouseCoords, setMouseCoords] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    showCities: true,
    showSlots: true,
    showPortals: true,
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const minimapRef = useRef(null);
  const loadWorldDataRef = useRef(null);

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

      // Centrer la vue sur la capitale après un court délai pour avoir les bonnes dimensions
      setTimeout(() => {
        if (result.userCities.length > 0) {
          const capital = result.userCities[0];
          if (capital.coords) {
            const container = containerRef.current;
            if (container) {
              const centerX = container.clientWidth / 2;
              const centerY = container.clientHeight / 2;
              setViewOffset({
                x: -(capital.coords.x * CELL_SIZE) + centerX,
                y: -(capital.coords.y * CELL_SIZE) + centerY,
              });
              logger.info(`Centered on capital at (${capital.coords.x}, ${capital.coords.y})`);
            }
          }
        } else if (result.world.tiles && result.world.tiles.length > 0) {
          // Si pas de ville, centrer sur le centre des tiles explorées
          const tiles = result.world.tiles;
          const avgX = tiles.reduce((sum, t) => sum + t.x, 0) / tiles.length;
          const avgY = tiles.reduce((sum, t) => sum + t.y, 0) / tiles.length;
          const container = containerRef.current;
          if (container) {
            const centerX = container.clientWidth / 2;
            const centerY = container.clientHeight / 2;
            setViewOffset({
              x: -(avgX * CELL_SIZE) + centerX,
              y: -(avgY * CELL_SIZE) + centerY,
            });
            logger.info(`Centered on average position (${avgX}, ${avgY})`);
          }
        }
      }, 100);
    }

    setLoading(false);
  }, [catchError, clearError]);

  // Store loadWorldData in ref to avoid dependency issues
  useEffect(() => {
    loadWorldDataRef.current = loadWorldData;
  });

  useEffect(() => {
    loadWorldDataRef.current?.();
  }, []);

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
    const cellSize = CELL_SIZE * zoomLevel;

    // Adapter la taille du canvas
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Fond de la carte (brouillard de guerre)
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Message de debug si pas de tiles
    if (worldData.tiles.length === 0) {
      ctx.fillStyle = '#00D9FF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Aucune case explorée - Déplacez la vue ou explorez le monde', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Dessiner les tiles visibles
    worldData.tiles.forEach((tile) => {
      const x = tile.x * cellSize + viewOffset.x;
      const y = tile.y * cellSize + viewOffset.y;

      // Skip si hors écran
      if (x + cellSize < 0 || y + cellSize < 0 || x > canvas.width || y > canvas.height) {
        return;
      }

      // Fond selon terrain
      if (tile.isVisible) {
        // Zone actuellement visible: couleurs vives
        ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#CCCCCC';
      } else if (tile.isExplored) {
        // Zone explorée mais hors de vue: couleurs sombres
        ctx.fillStyle = TERRAIN_COLORS_EXPLORED[tile.terrain] || '#3a3a3a';
      } else {
        // Ne devrait pas arriver (brouillard de guerre)
        ctx.fillStyle = '#1a1a1a';
      }

      ctx.fillRect(x, y, cellSize, cellSize);

      // Bordure plus visible
      if (tile.isVisible) {
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Indicateur city slot
      if (tile.hasCitySlot && filters.showSlots) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, Math.max(6, 6 * zoomLevel), 0, 2 * Math.PI);
        ctx.fill();
      }

      // Highlight selected
      if (selectedTile && selectedTile.x === tile.x && selectedTile.y === tile.y) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    });

    // Dessiner les villes
    if (filters.showCities) {
      cities.forEach((city) => {
        if (!city.coords) return;

        const x = city.coords.x * cellSize + viewOffset.x;
        const y = city.coords.y * cellSize + viewOffset.y;

        // Icône ville (cercle vert pour capitale, bleu sinon)
        ctx.fillStyle = city.isCapital ? '#00FF00' : '#0000FF';
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, Math.max(12, 12 * zoomLevel), 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Nom de la ville (uniquement si zoom >= 0.5)
        if (zoomLevel >= 0.5) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${Math.max(14, 14 * zoomLevel)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(city.name, x + cellSize / 2, y - 8);
        }
      });
    }

    // Dessiner les slots disponibles
    if (filters.showSlots) {
      availableSlots.forEach((slot) => {
        const x = slot.x * cellSize + viewOffset.x;
        const y = slot.y * cellSize + viewOffset.y;

        // Cercle jaune pour slots libres
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, Math.max(8, 8 * zoomLevel), 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Note: Portals are rendered as React components, not on canvas

    // Dessiner la mini-map
    if (minimapRef.current) {
      const minimap = minimapRef.current;
      const miniCtx = minimap.getContext('2d');
      const minimapSize = 150;
      minimap.width = minimapSize;
      minimap.height = minimapSize;

      // Fond sombre (brouillard de guerre)
      miniCtx.fillStyle = '#1a1f2e';
      miniCtx.fillRect(0, 0, minimapSize, minimapSize);

      if (worldData.tiles.length > 0) {
        // Utiliser les bounds du monde entier (0-99) au lieu des tiles chargées
        const minX = 0;
        const maxX = 99;
        const minY = 0;
        const maxY = 99;
        const worldWidth = maxX - minX + 1;
        const worldHeight = maxY - minY + 1;
        const scale = Math.min(minimapSize / worldWidth, minimapSize / worldHeight);

        // Dessiner les tiles explorées/visibles
        worldData.tiles.forEach((tile) => {
          const mx = (tile.x - minX) * scale;
          const my = (tile.y - minY) * scale;
          
          if (tile.isVisible) {
            // Zone visible: couleur vive
            miniCtx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#CCCCCC';
          } else if (tile.isExplored) {
            // Zone explorée: couleur sombre
            miniCtx.fillStyle = TERRAIN_COLORS_EXPLORED[tile.terrain] || '#3a3a3a';
          } else {
            miniCtx.fillStyle = '#1a1a1a';
          }
          
          miniCtx.fillRect(mx, my, Math.max(scale, 1), Math.max(scale, 1));
        });

        // Dessiner les villes
        if (filters.showCities) {
          cities.forEach((city) => {
            if (!city.coords) return;
            const mx = (city.coords.x - minX) * scale;
            const my = (city.coords.y - minY) * scale;
            miniCtx.fillStyle = city.isCapital ? '#00FF00' : '#0000FF';
            miniCtx.fillRect(mx - 1, my - 1, 3, 3);
          });
        }

        // Dessiner le viewport
        const vpCenterX = -viewOffset.x / cellSize;
        const vpCenterY = -viewOffset.y / cellSize;
        const vpWidth = canvas.width / cellSize;
        const vpHeight = canvas.height / cellSize;
        const vpX = (vpCenterX - vpWidth / 2 - minX) * scale;
        const vpY = (vpCenterY - vpHeight / 2 - minY) * scale;
        miniCtx.strokeStyle = '#00D9FF';
        miniCtx.lineWidth = 2;
        miniCtx.strokeRect(vpX, vpY, vpWidth * scale, vpHeight * scale);
      }
    }
  }, [worldData, cities, availableSlots, viewOffset, selectedTile, zoomLevel, filters]);

  // Gestion du clic sur une case
  const handleCanvasClick = async (e) => {
    if (!worldData) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const cellSize = CELL_SIZE * zoomLevel;

    const tileX = Math.floor((clickX - viewOffset.x) / cellSize);
    const tileY = Math.floor((clickY - viewOffset.y) / cellSize);

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

  // Gestion du zoom avec la molette
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  // Gestion du survol pour afficher les coordonnées
  const handleMouseMoveCoords = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const cellSize = CELL_SIZE * zoomLevel;
    const tileX = Math.floor((mouseX - viewOffset.x) / cellSize);
    const tileY = Math.floor((mouseY - viewOffset.y) / cellSize);
    setMouseCoords({ x: tileX, y: tileY });
  };

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      const step = 50;
      switch (e.key) {
        case 'ArrowUp':
          setViewOffset((prev) => ({ ...prev, y: prev.y + step }));
          break;
        case 'ArrowDown':
          setViewOffset((prev) => ({ ...prev, y: prev.y - step }));
          break;
        case 'ArrowLeft':
          setViewOffset((prev) => ({ ...prev, x: prev.x + step }));
          break;
        case 'ArrowRight':
          setViewOffset((prev) => ({ ...prev, x: prev.x - step }));
          break;
        case '+':
        case '=':
          setZoomLevel((prev) => Math.min(3, prev + 0.1));
          break;
        case '-':
        case '_':
          setZoomLevel((prev) => Math.max(0.5, prev - 0.1));
          break;
        case '0':
          setZoomLevel(1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Gestion du touch pour mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - viewOffset.x, y: touch.clientY - viewOffset.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setViewOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Recentrer sur la capitale ou le centre des tiles
  const recenterView = () => {
    if (cities.length > 0) {
      const capital = cities[0];
      if (capital.coords && containerRef.current) {
        const centerX = containerRef.current.clientWidth / 2;
        const centerY = containerRef.current.clientHeight / 2;
        setViewOffset({
          x: -(capital.coords.x * CELL_SIZE) + centerX,
          y: -(capital.coords.y * CELL_SIZE) + centerY,
        });
      }
    } else if (worldData?.tiles && worldData.tiles.length > 0) {
      const tiles = worldData.tiles;
      const avgX = tiles.reduce((sum, t) => sum + t.x, 0) / tiles.length;
      const avgY = tiles.reduce((sum, t) => sum + t.y, 0) / tiles.length;
      if (containerRef.current) {
        const centerX = containerRef.current.clientWidth / 2;
        const centerY = containerRef.current.clientHeight / 2;
        setViewOffset({
          x: -(avgX * CELL_SIZE) + centerX,
          y: -(avgY * CELL_SIZE) + centerY,
        });
      }
    }
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
            <span>Cases chargées: {worldData?.tiles?.length || 0}</span>
            {cities.length > 0 && cities[0].coords && (
              <span>Capitale: ({cities[0].coords.x}, {cities[0].coords.y})</span>
            )}
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

        {!loading && worldData && worldData.tiles.length === 0 && (
          <Alert
            type="info"
            title="Carte vide"
            message="Aucune case explorée. Vérifiez que vous avez au moins une ville ou que vos données sont correctement chargées."
            onAction={loadWorldData}
            actionLabel="Recharger"
          />
        )}

        <div
          className="worldmap-canvas-container"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handleMouseMoveCoords(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setMouseCoords(null);
          }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="button"
          aria-label="Carte interactive du monde. Utilisez les flèches pour naviguer, +/- pour zoomer"
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

          {/* Affichage des coordonnées */}
          {mouseCoords && (
            <div className="worldmap-coords">
              X: {mouseCoords.x}, Y: {mouseCoords.y}
            </div>
          )}

          {/* Mini-map */}
          <canvas ref={minimapRef} className="worldmap-minimap" />

          {/* Contrôles de zoom */}
          <div className="worldmap-zoom-controls">
            <button onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.2))} title="Zoom +">+</button>
            <span>{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.2))} title="Zoom -">-</button>
            <button onClick={() => setZoomLevel(1)} title="Réinitialiser zoom">⟲</button>
            <button onClick={recenterView} title="Recentrer sur ma capitale">🎯</button>
          </div>

          {/* Bouton filtres */}
          <button 
            className="worldmap-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            title="Filtres d'affichage"
          >
            🔍
          </button>

          {/* Panel filtres */}
          {showFilters && (
            <div className="worldmap-filters">
              <h4>Filtres</h4>
              <label>
                <input
                  type="checkbox"
                  checked={filters.showCities}
                  onChange={(e) => setFilters({ ...filters, showCities: e.target.checked })}
                />
                Villes
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.showSlots}
                  onChange={(e) => setFilters({ ...filters, showSlots: e.target.checked })}
                />
                Emplacements
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.showPortals}
                  onChange={(e) => setFilters({ ...filters, showPortals: e.target.checked })}
                />
                Portails
              </label>
            </div>
          )}

          {/* Render portals as React components on top of canvas */}
          {filters.showPortals && portals.map((portal) => {
            const cellSize = CELL_SIZE * zoomLevel;
            const x = portal.coord_x * cellSize + viewOffset.x;
            const y = portal.coord_y * cellSize + viewOffset.y;
            
            // Only render if on screen
            if (x + cellSize < 0 || y + cellSize < 0 || 
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
                cellSize={cellSize}
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
