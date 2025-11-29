# Terra Dominus - Système de Carte du Monde et Colonisation

## 🗺️ Vue d'ensemble

Ce document décrit le nouveau système de carte du monde, d'exploration et de colonisation multi-villes ajouté à Terra Dominus.

## 📦 Composants installés

### Backend

#### Modèles de données
- **WorldGrid** - Grille du monde (100x100 cases)
- **CitySlot** - Emplacements de villes disponibles (~300)
- **ExploredTile** - Cases explorées par joueur (Fog of War)
- **ColonizationMission** - Missions de colonisation actives

#### Modules
- `backend/modules/world/` - Gestion carte et exploration
- `backend/modules/colonization/` - Gestion colonisation
- `backend/modules/cities/` - Gestion multi-villes

#### API Endpoints

**World:**
- `GET /api/v1/world/visible` - Récupère la carte visible
- `GET /api/v1/world/city-slots` - Emplacements disponibles
- `GET /api/v1/world/tile/:x/:y` - Infos d'une case
- `GET /api/v1/world/stats` - Statistiques globales

**Colonization:**
- `POST /api/v1/colonization/start` - Lance une colonisation
- `GET /api/v1/colonization/missions` - Missions du joueur
- `DELETE /api/v1/colonization/missions/:id` - Annule une mission
- `GET /api/v1/colonization/max-cities` - Limite de villes

**Cities:**
- `GET /api/v1/cities/my-cities` - Liste des villes
- `GET /api/v1/cities/:id` - Détails d'une ville
- `POST /api/v1/cities/:id/set-capital` - Change la capitale
- `PUT /api/v1/cities/:id/rename` - Renomme une ville

### Frontend

- **WorldMap.js** - Composant carte interactive (Canvas 2D)
- **WorldMap.css** - Styles de la carte
- **api/world.js** - Fonctions API pour monde/colonisation/villes

## 🚀 Installation

### 1. Exécuter les migrations

```powershell
cd backend
npm run migrate
```

Ou manuellement:
```powershell
psql "$env:DATABASE_URL" -c "SELECT * FROM pg_available_extensions WHERE name='uuid-ossp';"
node -e "require('./migrations/20251129-create-world-system.js').up(require('./db').getQueryInterface(), require('sequelize'))"
```

### 2. Générer la carte du monde

```powershell
cd backend
node scripts/generateWorldMap.js
```

Ceci génère:
- 10,000 cases de grille (100x100)
- ~300 emplacements de villes
- Terrains variés (plaines, forêts, montagnes, déserts)
- Lissage pour zones cohérentes

### 3. Mettre à jour les villes existantes

Les villes existantes n'ont pas de coordonnées. Attribuez-leur:

```sql
-- Attribuer des coordonnées aux villes existantes
UPDATE cities c
SET coord_x = cs.coord_x,
    coord_y = cs.coord_y
FROM (
  SELECT DISTINCT ON (cs.id)
    cs.id as slot_id,
    wg.coord_x,
    wg.coord_y
  FROM city_slots cs
  JOIN world_grid wg ON cs.grid_id = wg.id
  WHERE cs.status = 'free'
  ORDER BY cs.id, RANDOM()
) cs
WHERE c.coord_x IS NULL
  AND c.id = (
    SELECT id FROM cities WHERE coord_x IS NULL LIMIT 1 OFFSET 0
  );

-- Marquer les slots comme occupés
UPDATE city_slots
SET status = 'occupied',
    city_id = (SELECT id FROM cities WHERE coord_x = world_grid.coord_x AND coord_y = world_grid.coord_y LIMIT 1)
FROM world_grid
WHERE city_slots.grid_id = world_grid.id
  AND EXISTS (
    SELECT 1 FROM cities
    WHERE cities.coord_x = world_grid.coord_x
      AND cities.coord_y = world_grid.coord_y
  );
```

### 4. Ajouter l'unité "Colon"

Pour coloniser, les joueurs ont besoin de l'unité "Colon":

```sql
-- Créer l'entité Colon
INSERT INTO entities (entity_type, name, description, created_at, updated_at)
VALUES ('unit', 'Colon', 'Unité de colonisation permettant de fonder de nouvelles villes', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Ajouter coûts de formation (exemple)
INSERT INTO resource_costs (entity_id, level, resource_type, amount, created_at, updated_at)
SELECT 
  (SELECT entity_id FROM entities WHERE name = 'Colon' AND entity_type = 'unit'),
  1,
  'or',
  2000,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM resource_costs rc
  JOIN entities e ON rc.entity_id = e.entity_id
  WHERE e.name = 'Colon' AND rc.level = 1
);
```

### 5. Ajouter les technologies de colonisation

```sql
-- Colonisation I (max 2 villes)
INSERT INTO entities (entity_type, name, description, created_at, updated_at)
VALUES ('research', 'Colonisation I', 'Permet de fonder jusqu''à 2 villes', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Colonisation II (max 3 villes)
INSERT INTO entities (entity_type, name, description, created_at, updated_at)
VALUES ('research', 'Colonisation II', 'Permet de fonder jusqu''à 3 villes', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Colonisation III (max 5 villes)
INSERT INTO entities (entity_type, name, description, created_at, updated_at)
VALUES ('research', 'Colonisation III', 'Permet de fonder jusqu''à 5 villes', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Empire Étendu (max 10 villes)
INSERT INTO entities (entity_type, name, description, created_at, updated_at)
VALUES ('research', 'Empire Étendu', 'Permet de fonder jusqu''à 10 villes', NOW(), NOW())
ON CONFLICT DO NOTHING;
```

### 6. Redémarrer le backend avec worker

```powershell
cd backend
npm run start  # Démarre serveur
npm run worker # Démarre les workers (dans un autre terminal)
```

Le worker colonization vérifie toutes les 30 secondes les missions arrivées et crée automatiquement les nouvelles villes.

## 🎮 Utilisation

### Pour les joueurs

1. **Accéder à la carte** : Menu → "Carte du Monde"

2. **Explorer** :
   - Chaque ville a un rayon de vision (5 cases par défaut)
   - Les cases dans le rayon sont automatiquement explorées
   - Augmentez le rayon avec les technologies "Cartographie", "Éclaireurs"

3. **Coloniser** :
   - Cliquez sur un emplacement libre (cercle jaune)
   - Vérifiez que vous avez :
     - Au moins 1 Colon
     - Les ressources nécessaires (~5000 or, 3000 métal, 2000 carburant)
     - Pas atteint la limite de villes
   - Cliquez sur "Coloniser"
   - Attendez que vos colons arrivent

4. **Gérer vos villes** :
   - `GET /api/v1/cities/my-cities` liste toutes vos villes
   - Changez de ville active dans l'interface
   - Définissez une nouvelle capitale si besoin

### Progression technologique

| Technologie | Max villes |
|-------------|-----------|
| Aucune | 1 (capitale) |
| Colonisation I | 2 |
| Colonisation II | 3 |
| Colonisation III | 5 |
| Empire Étendu | 10 |
| Domination Totale | 20 |

### Types de terrain et bonus

| Terrain | Bonus or | Bonus métal | Bonus carburant | Bonus énergie |
|---------|----------|-------------|-----------------|---------------|
| Plaines | 1.0x | 1.0x | 1.0x | 1.0x |
| Forêt | 0.8x | 0.9x | 1.2x | 1.0x |
| Montagnes | 1.1x | 1.4x | 0.9x | 1.1x |
| Collines | 1.0x | 1.2x | 1.0x | 1.0x |
| Désert | 0.9x | 0.8x | 1.3x | 1.2x |

## 🔧 Configuration

### Paramètres de la carte

Modifiable dans `backend/scripts/generateWorldMap.js`:

```javascript
const CONFIG = {
  WORLD_SIZE_X: 100,
  WORLD_SIZE_Y: 100,
  CITY_SLOTS_COUNT: 300,
  MIN_CITY_DISTANCE: 8,
  TERRAIN_DISTRIBUTION: {
    plains: 40,
    forest: 25,
    mountain: 15,
    hills: 10,
    desert: 7,
    water: 3,
  },
};
```

### Règles de colonisation

Modifiable dans `backend/modules/world/domain/worldRules.js`:

```javascript
// Rayon de vision par défaut
const DEFAULT_VISION_RANGE = 5;

// Coût de colonisation
function getColonizationCost(distance, quality) {
  const baseCost = {
    or: 5000,
    metal: 3000,
    carburant: 2000,
  };
  // Ajusté selon distance et qualité
}
```

## 🧪 Tests

```powershell
# Backend
cd backend
npm test

# Frontend
cd frontend
npm run test:unit
npm run test:e2e
```

## 🐛 Dépannage

### La carte ne se charge pas
- Vérifiez que les migrations sont exécutées
- Vérifiez que la carte est générée : `SELECT COUNT(*) FROM world_grid;`
- Consultez les logs backend

### Erreur "Limite de villes atteinte"
- Recherchez les technologies de colonisation
- Vérifiez votre limite : `GET /api/v1/colonization/max-cities`

### Mission de colonisation bloquée
- Vérifiez que le worker tourne : `npm run worker`
- Consultez les logs : `backend/logs/`
- Vérifiez Redis : les jobs sont dans la queue `colonization`

### Villes sans coordonnées
- Exécutez les requêtes SQL de mise à jour (section 3)

## 📚 Architecture

```
backend/
├── migrations/
│   └── 20251129-create-world-system.js
├── models/
│   ├── WorldGrid.js
│   ├── CitySlot.js
│   ├── ExploredTile.js
│   └── ColonizationMission.js
├── modules/
│   ├── world/
│   │   ├── application/WorldService.js
│   │   ├── infra/WorldRepository.js
│   │   ├── domain/worldRules.js
│   │   └── api/
│   │       ├── worldController.js
│   │       └── worldRoutes.js
│   ├── colonization/
│   │   ├── application/ColonizationService.js
│   │   ├── infra/ColonizationRepository.js
│   │   └── api/
│   │       ├── colonizationController.js
│   │       └── colonizationRoutes.js
│   └── cities/
│       └── api/citiesRoutes.js
├── jobs/
│   └── workers/colonizationWorker.js
└── scripts/
    └── generateWorldMap.js

frontend/
├── src/
│   ├── api/world.js
│   └── components/
│       ├── WorldMap.js
│       └── WorldMap.css
```

## 🎯 Prochaines étapes suggérées

1. **Combat territorial** : attaquer les villes d'autres joueurs
2. **Commerce entre villes** : routes automatiques
3. **Spécialisations de villes** : militaire, économique, industrielle
4. **Gouverneurs** : automatiser la gestion
5. **Événements sur la carte** : barbares, ruines, trésors
6. **Visualisation 3D** : Three.js pour une carte plus immersive

---

**Développé pour Terra Dominus** | Novembre 2025
