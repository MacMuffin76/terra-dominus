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
import CarteMondeLeaflet from './CarteMondeLeaflet';
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
        <h1>Carte du Monde (Leaflet)</h1>
        {error && (
          <Alert
            type="error"
            title="Carte du monde"
            message={error}
            onAction={loadWorldData}
            actionLabel="Réessayer"
          />
        )}
        <CarteMondeLeaflet
          cities={cities.map(city => ({
            id: city.id,
            name: city.name,
            latitude: city.coords?.lat || 0,
            longitude: city.coords?.lng || 0,
            isCapital: city.isCapital,
          }))}
          colonizableSlots={availableSlots.map(slot => ({
            id: slot.id,
            latitude: slot.lat || 0,
            longitude: slot.lng || 0,
          }))}
          onColonize={async (slotId) => {
            if (cities.length >= maxCities) {
              alert(`Vous avez atteint la limite de ${maxCities} villes. Recherchez des technologies de colonisation.`);
              return;
            }
            const departureCityId = cities[0]?.id;
            if (!departureCityId) {
              alert('Vous devez avoir au moins une ville pour coloniser.');
              return;
            }
            if (!window.confirm('Confirmez la colonisation de cet emplacement ?')) {
              return;
            }
            try {
              await startColonization(departureCityId, slotId);
              alert('Mission de colonisation lancée ! Vos colons sont en route.');
              await loadWorldData();
            } catch (err) {
              alert(getApiErrorMessage(err, 'Erreur lors du lancement de la colonisation.'));
            }
          }}
        />
      </div>
    </div>
  );
};

export default WorldMap;
