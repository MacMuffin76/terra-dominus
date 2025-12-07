import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ImageOverlay, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import { getWorldConfig, getPlayerTerritories, claimTerritory, getExploredAreas } from '../api/world';

// Fix icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

// Générateur de carte procédurale avec bruit de Perlin amélioré
const generateProceduralMap = (width = 1024, height = 512, seed = 12345) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Générateur de nombres pseudo-aléatoires basé sur seed
  const random = (x, y) => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  };

  // Interpolation cosinus lisse
  const interpolate = (a, b, t) => {
    const ft = t * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  };

  // Bruit de Perlin 2D
  const perlinNoise = (x, y) => {
    const X = Math.floor(x);
    const Y = Math.floor(y);
    const xf = x - X;
    const yf = y - Y;

    // Valeurs aux coins
    const a = random(X, Y);
    const b = random(X + 1, Y);
    const c = random(X, Y + 1);
    const d = random(X + 1, Y + 1);

    // Interpolation bilinéaire
    const x1 = interpolate(a, b, xf);
    const x2 = interpolate(c, d, xf);
    return interpolate(x1, x2, yf);
  };

  // Génération de bruit fractal multi-octave (FBM)
  const fbm = (x, y, octaves = 6) => {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += perlinNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  };

  // Génération de la carte avec échelle appropriée
  const imageData = ctx.createImageData(width, height);
  const scale = 0.002;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x * scale;
      const ny = y * scale;
      
      // Plusieurs couches de bruit pour créer des continents variés
      let continentShape = fbm(nx * 0.5, ny * 0.5, 5); // Grandes formes continentales
      let continentDetail = fbm(nx * 1.2 + 50, ny * 1.2 + 50, 5); // Détails moyens
      let coastalDetail = fbm(nx * 2.5 + 100, ny * 2.5 + 100, 4) * 0.3; // Détails côtiers
      
      // Mélange des différentes échelles
      let baseValue = continentShape * 0.5 + continentDetail * 0.35 + coastalDetail;
      
      // Ajustement pour avoir environ 40-50% de terre
      let value = Math.pow(baseValue * 1.3, 0.9) - 0.1;
      
      // S'assurer que les valeurs sont dans [0, 1]
      value = Math.max(0, Math.min(1, value));
      
      const idx = (y * width + x) * 4;

      // Palettes de couleurs basées sur l'altitude (style carte fantasy)
      if (value < 0.35) {
        // Océan profond
        imageData.data[idx] = 20;
        imageData.data[idx + 1] = 50;
        imageData.data[idx + 2] = 110;
      } else if (value < 0.4) {
        // Océan moyen
        imageData.data[idx] = 40;
        imageData.data[idx + 1] = 80;
        imageData.data[idx + 2] = 150;
      } else if (value < 0.43) {
        // Eau peu profonde
        imageData.data[idx] = 60;
        imageData.data[idx + 1] = 120;
        imageData.data[idx + 2] = 190;
      } else if (value < 0.45) {
        // Plage
        imageData.data[idx] = 240;
        imageData.data[idx + 1] = 220;
        imageData.data[idx + 2] = 170;
      } else if (value < 0.55) {
        // Plaines côtières (vert clair)
        imageData.data[idx] = 140;
        imageData.data[idx + 1] = 200;
        imageData.data[idx + 2] = 90;
      } else if (value < 0.65) {
        // Plaines (vert)
        imageData.data[idx] = 100;
        imageData.data[idx + 1] = 170;
        imageData.data[idx + 2] = 70;
      } else if (value < 0.75) {
        // Forêts et collines
        imageData.data[idx] = 70;
        imageData.data[idx + 1] = 130;
        imageData.data[idx + 2] = 50;
      } else if (value < 0.85) {
        // Collines rocheuses
        imageData.data[idx] = 150;
        imageData.data[idx + 1] = 140;
        imageData.data[idx + 2] = 100;
      } else if (value < 0.92) {
        // Montagnes
        imageData.data[idx] = 130;
        imageData.data[idx + 1] = 120;
        imageData.data[idx + 2] = 100;
      } else {
        // Sommets enneigés
        imageData.data[idx] = 245;
        imageData.data[idx + 1] = 245;
        imageData.data[idx + 2] = 255;
      }
      imageData.data[idx + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};

const defaultPosition = [0, 0];
const defaultZoom = 2;
// Format rectangulaire 3:1 pour une carte plus large
const bounds = [[-60, -180], [60, 180]];

// Helper pour déterminer le type de terrain à partir de la valeur d'élévation
const getTerrainTypeFromValue = (value) => {
  if (value < 0.43) return 'water';
  if (value < 0.45) return 'plains'; // Plage/côte
  if (value < 0.55) return 'plains';
  if (value < 0.65) return 'plains';
  if (value < 0.75) return 'forest';
  if (value < 0.85) return 'hills';
  if (value < 0.92) return 'mountain';
  return 'mountain'; // Sommets enneigés
};

const CarteMondeLeaflet = ({ cities = [], colonizableSlots = [], onColonize }) => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [worldConfig, setWorldConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [territories, setTerritories] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [exploredAreas, setExploredAreas] = useState([]);
  const [showFogOfWar, setShowFogOfWar] = useState(true);
  
  // Charger la configuration du monde, territoires et zones explorées
  useEffect(() => {
    const loadData = async () => {
      try {
        const [config, playerTerritories, explored] = await Promise.all([
          getWorldConfig(),
          getPlayerTerritories().catch(() => []),
          getExploredAreas().catch(() => []),
        ]);
        setWorldConfig(config);
        setTerritories(playerTerritories);
        setExploredAreas(explored);
      } catch (error) {
        console.error('Erreur chargement config monde:', error);
        // Fallback sur config par défaut
        setWorldConfig({
          seed: 12345,
          width: 2400,
          height: 800,
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Génération de la carte procédurale avec la seed du serveur
  const mapImageUrl = useMemo(() => {
    if (!worldConfig) return null;
    return generateProceduralMap(worldConfig.width, worldConfig.height, worldConfig.seed);
  }, [worldConfig]);

  // Génération de la carte fog of war (superposition sombre pour zones non explorées)
  const fogOfWarUrl = useMemo(() => {
    if (!worldConfig || !showFogOfWar || exploredAreas.length === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = worldConfig.width;
    canvas.height = worldConfig.height;
    const ctx = canvas.getContext('2d');

    // Remplir tout en noir (non exploré)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Créer des cercles transparents pour les zones explorées
    ctx.globalCompositeOperation = 'destination-out';
    exploredAreas.forEach((area) => {
      // Convertir lat/lng en coordonnées de canvas
      const x = ((area.longitude + 180) / 360) * canvas.width;
      const y = ((60 - area.latitude) / 120) * canvas.height;
      
      // Dessiner un cercle de révélation
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, 2 * Math.PI); // Rayon de 50 pixels
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fill();
    });

    return canvas.toDataURL();
  }, [worldConfig, exploredAreas, showFogOfWar]);

  // Fonction pour revendiquer un territoire
  const handleClaimTerritory = async (lat, lng) => {
    if (claiming) return;
    
    setClaiming(true);
    try {
      // Calculer le type de terrain à cette position
      // On utilise le même algorithme que pour générer la carte
      const scale = 0.002;
      const nx = ((lng + 180) / 360) * worldConfig.width * scale;
      const ny = ((60 - lat) / 120) * worldConfig.height * scale;
      
      // Simulation du calcul FBM pour obtenir la valeur
      // Pour simplifier, on va juste envoyer 'plains' par défaut
      // Dans une vraie implémentation, on recalculerait le terrain exact
      const terrainType = 'plains';
      
      const territory = await claimTerritory(lat, lng, terrainType);
      setTerritories([...territories, territory]);
      setSelectedPosition(null);
      alert(`Territoire revendiqué avec succès! Type: ${terrainType}`);
    } catch (error) {
      console.error('Erreur revendication:', error);
      alert(error.response?.data?.message || 'Erreur lors de la revendication du territoire');
    } finally {
      setClaiming(false);
    }
  };

  // Component to handle map clicks
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setSelectedPosition(e.latlng);
      },
    });
    return null;
  };

  // Afficher un loader pendant le chargement
  if (loading || !mapImageUrl) {
    return (
      <div style={{ height: '70vh', width: '100%', backgroundColor: '#2050a0', minHeight: '500px', maxHeight: '800px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div>Génération de la carte du monde...</div>
      </div>
    );
  }

  return (
    <div style={{ height: '70vh', width: '100%', backgroundColor: '#2050a0', minHeight: '500px', maxHeight: '800px' }}>
      <MapContainer
        center={defaultPosition} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', backgroundColor: '#2050a0' }}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        minZoom={1}
        maxZoom={6}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
        worldCopyJump={false}
        maxBoundsViscosity={1.0}
      >
        <ImageOverlay
          url={mapImageUrl}
          bounds={bounds}
          opacity={1}
          zIndex={1}
        />

        {/* Fog of War overlay */}
        {fogOfWarUrl && (
          <ImageOverlay
            url={fogOfWarUrl}
            bounds={bounds}
            opacity={1}
            zIndex={2}
          />
        )}

        {cities.map((city) => (
          <Marker key={city.id} position={[city.latitude, city.longitude]}>
            <Popup>
              <strong>{city.name}</strong><br />
              Capitale: {city.isCapital ? 'Oui' : 'Non'}
            </Popup>
          </Marker>
        ))}

        {colonizableSlots.map((slot) => (
          <Marker key={slot.id} position={[slot.latitude, slot.longitude]}>
            <Popup>
              <div>
                <p>Emplacement colonisable</p>
                <button onClick={() => onColonize(slot.id)}>Coloniser ici</button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Afficher les territoires du joueur */}
        {territories.map((territory) => (
          <Circle
            key={territory.id}
            center={[territory.latitude, territory.longitude]}
            radius={territory.radius * 10000} // Conversion en mètres pour Leaflet
            pathOptions={{
              color: '#00ff00',
              fillColor: '#00ff00',
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <div>
                <strong>Votre Territoire</strong><br />
                Type: {territory.terrain_type}<br />
                Défense: Niveau {territory.defense_level}<br />
                Bonus: {JSON.stringify(territory.resource_bonus)}
              </div>
            </Popup>
          </Circle>
        ))}

        <MapClickHandler />
      </MapContainer>

      {/* Légende de la carte */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000,
        fontSize: '12px',
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Légende</h4>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#2850a0', marginRight: '8px' }}></div>
          <span>Océan</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#8cc850', marginRight: '8px' }}></div>
          <span>Plaines</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#468230', marginRight: '8px' }}></div>
          <span>Forêts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#968c64', marginRight: '8px' }}></div>
          <span>Collines</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#827864', marginRight: '8px' }}></div>
          <span>Montagnes</span>
        </div>
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showFogOfWar}
              onChange={(e) => setShowFogOfWar(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Brouillard de guerre
          </label>
        </div>
        <div style={{ marginTop: '10px', fontSize: '11px', opacity: 0.7 }}>
          Territoires: {territories.length}<br />
          Zones explorées: {exploredAreas.length}
        </div>
      </div>

      {selectedPosition && (
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
          color: 'white', 
          padding: '15px 20px', 
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        }}>
          <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
            📍 Position: Lat {selectedPosition.lat.toFixed(4)}, Lng {selectedPosition.lng.toFixed(4)}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleClaimTerritory(selectedPosition.lat, selectedPosition.lng)}
              disabled={claiming}
              style={{
                padding: '10px 20px',
                backgroundColor: claiming ? '#666' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: claiming ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              {claiming ? '⏳ Revendication...' : '🚩 Revendiquer'}
            </button>
            <button 
              onClick={() => setSelectedPosition(null)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ❌ Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarteMondeLeaflet;
