# 🗺️ Terra Dominus - Système Multi-Villes & Carte du Monde

## ✅ IMPLÉMENTATION COMPLÈTE

Système de carte du monde, exploration, et colonisation multi-villes **100% fonctionnel** pour Terra Dominus.

---

## 📦 CE QUI A ÉTÉ CRÉÉ

### 🔧 Backend (Node.js + Express + Sequelize)

#### 1. **Migrations SQL**
- `backend/migrations/20251129-create-world-system.js`
  - Tables: `world_grid`, `city_slots`, `explored_tiles`, `colonization_missions`
  - Extension de `cities` avec `coord_x`, `coord_y`, `vision_range`, `founded_at`
  - Indexes optimisés pour performance

#### 2. **Modèles Sequelize**
- `backend/models/WorldGrid.js` - Grille 100x100 du monde
- `backend/models/CitySlot.js` - ~300 emplacements de villes
- `backend/models/ExploredTile.js` - Fog of War par joueur
- `backend/models/ColonizationMission.js` - Missions actives
- `backend/models/worldAssociations.js` - Relations entre modèles

#### 3. **Module World** (`backend/modules/world/`)
```
world/
├── application/
│   └── WorldService.js           # Logique métier carte & exploration
├── infra/
│   └── WorldRepository.js        # Accès données
├── domain/
│   └── worldRules.js             # Règles de jeu (vision, distance, bonus)
└── api/
    ├── worldController.js        # Contrôleur HTTP
    └── worldRoutes.js            # Routes Express
```

**Endpoints:**
- `GET /api/v1/world/visible` - Carte visible (fog of war)
- `GET /api/v1/world/city-slots` - Emplacements disponibles
- `GET /api/v1/world/tile/:x/:y` - Infos case spécifique
- `GET /api/v1/world/stats` - Statistiques globales

#### 4. **Module Colonization** (`backend/modules/colonization/`)
```
colonization/
├── application/
│   └── ColonizationService.js    # Logique colonisation
├── infra/
│   └── ColonizationRepository.js # Accès données missions
└── api/
    ├── colonizationController.js # Contrôleur HTTP
    └── colonizationRoutes.js     # Routes Express
```

**Endpoints:**
- `POST /api/v1/colonization/start` - Lancer colonisation
- `GET /api/v1/colonization/missions` - Mes missions
- `DELETE /api/v1/colonization/missions/:id` - Annuler
- `GET /api/v1/colonization/max-cities` - Limite tech

**Fonctionnalités:**
- Vérifications: limite villes, ressources, colons
- Calcul distance & temps voyage
- Déduction ressources & unités
- Remboursement 50% si annulation

#### 5. **Module Cities** (`backend/modules/cities/`)
```
cities/
└── api/
    └── citiesRoutes.js           # Routes multi-villes
```

**Endpoints:**
- `GET /api/v1/cities/my-cities` - Liste mes villes
- `GET /api/v1/cities/:id` - Détails ville
- `POST /api/v1/cities/:id/set-capital` - Changer capitale
- `PUT /api/v1/cities/:id/rename` - Renommer

#### 6. **Worker Colonization**
- `backend/jobs/workers/colonizationWorker.js`
- Scan toutes les 30s les missions arrivées
- Crée automatiquement les nouvelles villes
- Initialise ressources & bâtiments de base
- Utilise BullMQ + Redis

#### 7. **Scripts Utilitaires**
- `backend/scripts/generateWorldMap.js` - Génère la carte 100x100
  - Types terrains variés avec lissage
  - ~300 emplacements répartis
  - Qualité par emplacement (1-5)
  
- `backend/scripts/setupWorldSystem.js` - Config complète auto
  - Génère carte si absente
  - Crée unité "Colon"
  - Crée 8 technologies
  - Attribue coords aux villes existantes

#### 8. **Intégration**
- `backend/container.js` - Enregistrement DI
- `backend/api/index.js` - Routes montées
- `backend/jobs/index.js` - Worker démarré
- `backend/jobs/queueConfig.js` - Queue colonization

---

### 🎨 Frontend (React + Canvas 2D)

#### 1. **Composant WorldMap**
- `frontend/src/components/WorldMap.js` (360+ lignes)
- `frontend/src/components/WorldMap.css`

**Fonctionnalités:**
- ✅ Canvas 2D interactif
- ✅ Affichage grille avec couleurs par terrain
- ✅ Fog of war (cases explorées vs visibles)
- ✅ Indicateurs villes (vert=capitale, bleu=autres)
- ✅ Emplacements libres (cercles jaunes)
- ✅ Pan & drag pour naviguer
- ✅ Click sur case → infos détaillées
- ✅ Bouton coloniser avec vérifications
- ✅ Légende terrain & icônes
- ✅ Stats (villes, limite, exploration)

#### 2. **API Client**
- `frontend/src/api/world.js`
  - `getVisibleWorld()` - Carte
  - `getAvailableCitySlots()` - Slots
  - `getTileInfo(x, y)` - Case
  - `startColonization()` - Lancer
  - `cancelColonizationMission()` - Annuler
  - `getUserCities()` - Mes villes
  - `getCityDetails()` - Détails
  - `setCapitalCity()` - Capitale
  - `renameCity()` - Renommer

#### 3. **Navigation**
- `frontend/src/App.js` - Route `/world` ajoutée
- `frontend/src/components/Menu.js` - Lien "Carte du Monde" (icône globe)

---

## 🎮 GAMEPLAY

### Phase 1: Début
- 1 ville (capitale) aux coordonnées aléatoires
- Rayon vision: 5 cases (Manhattan distance)
- Limite: 1 ville

### Phase 2: Développement
- Construire bâtiments & rechercher technologies
- Former des **Colons** (2000 or, 1500 métal, 1000 carburant)
- Rechercher **Colonisation I** → max 2 villes

### Phase 3: Expansion
- Ouvrir la carte du monde (`/world`)
- Explorer les emplacements visibles
- Sélectionner emplacement libre (qualité 1-5)
- Lancer colonisation depuis capitale
  - Coût: ~5000 or, 3000 métal, 2000 carburant
  - Consomme 1 Colon
  - Temps voyage: distance × 30min/case

### Phase 4: Multi-villes
- Mission arrive automatiquement (worker)
- Nouvelle ville créée avec:
  - Ressources de base (500 or/métal, 300 carburant)
  - Bâtiments niveau 0
  - Vision 5 cases
- Gérer plusieurs villes via `/cities/my-cities`

### Progression Tech
| Tech | Max Villes | Coût (or) |
|------|------------|-----------|
| Aucune | 1 | - |
| Colonisation I | 2 | 5,000 |
| Colonisation II | 3 | 10,000 |
| Colonisation III | 5 | 25,000 |
| Empire Étendu | 10 | 50,000 |
| Domination Totale | 20 | 100,000 |

| Tech Vision | Bonus | Coût (or) |
|-------------|-------|-----------|
| Cartographie | +2 | 3,000 |
| Éclaireurs | +3 | 8,000 |
| Cartographie avancée | +5 | 15,000 |

---

## 🚀 INSTALLATION RAPIDE

### 1. Exécuter migrations
```powershell
cd backend
npx sequelize-cli db:migrate
```

### 2. Setup automatique complet
```powershell
node backend/scripts/setupWorldSystem.js
```

Ceci fait automatiquement:
- ✅ Génère carte 100x100
- ✅ Crée unité "Colon"
- ✅ Crée 8 technologies
- ✅ Attribue coordonnées villes existantes

### 3. Démarrer
```powershell
# Terminal 1: Backend
cd backend
npm run start

# Terminal 2: Worker
cd backend
npm run worker

# Terminal 3: Frontend
cd frontend
npm run start
```

### 4. Jouer
- Accéder: http://localhost:3000/world
- Se connecter avec compte existant
- Voir sa ville sur la carte
- Commencer l'expansion !

---

## 📊 RÈGLES TECHNIQUES

### Distance & Voyage
- **Distance Manhattan**: `|x1-x2| + |y1-y2|`
- **Temps voyage**: `distance × 1800s` (30min/case)
- **Vitesse**: 2 cases/heure

### Coût Colonisation
```javascript
Base: { or: 5000, metal: 3000, carburant: 2000 }
Multiplié par:
  - Distance: 1 + (distance / 50)
  - Qualité: 1 / (quality × 0.2 + 0.6)
```

### Bonus Terrain
| Terrain | Or | Métal | Carburant | Énergie |
|---------|-----|-------|-----------|---------|
| Plaines | 1.0 | 1.0 | 1.0 | 1.0 |
| Forêt | 0.8 | 0.9 | 1.2 | 1.0 |
| Montagnes | 1.1 | 1.4 | 0.9 | 1.1 |
| Collines | 1.0 | 1.2 | 1.0 | 1.0 |
| Désert | 0.9 | 0.8 | 1.3 | 1.2 |

### Limites
- Max 3 missions colonisation simultanées
- Annulation = remboursement 50%
- Slot réservé pendant voyage
- Worker check toutes les 30s

---

## 🧪 TESTS

### Backend
```powershell
cd backend
npm test
```

### Frontend
```powershell
cd frontend
npm run test:unit
npm run test:e2e
```

---

## 📚 DOCUMENTATION COMPLÈTE

Voir `WORLD_SYSTEM_README.md` pour:
- Architecture détaillée
- Configuration avancée
- Dépannage
- Prochaines étapes

---

## ✨ POINTS FORTS

✅ **Architecture propre** - DDD, DI, séparation claire
✅ **Performance** - Indexes DB, pagination, cache-ready
✅ **Sécurité** - Vérifications strictes, transactions
✅ **UX moderne** - Canvas interactif, drag, fog of war
✅ **Scalable** - Worker async, Redis queues
✅ **Maintenable** - Code documenté, modularisé
✅ **Testable** - Services découplés, DI
✅ **Production-ready** - Logs, tracing, error handling

---

## 🎯 PROCHAINES ÉTAPES SUGGÉRÉES

### Court terme (1-2 semaines)
1. **Notifications temps réel** - Socket.IO pour arrivée missions
2. **Replay missions** - Historique avec détails
3. **Filtres carte** - Par terrain, distance, qualité

### Moyen terme (1 mois)
4. **Combat territorial** - Attaquer villes ennemies
5. **Commerce inter-villes** - Routes automatiques
6. **Spécialisations** - Ville militaire/économique/industrielle
7. **Barbares** - Villages neutres à conquérir

### Long terme (2-3 mois)
8. **Alliance territoriale** - Territoires partagés
9. **Gouverneurs** - IA automatisation
10. **Événements carte** - Ruines, trésors, catastrophes
11. **3D visualization** - Three.js / Babylon.js

---

## 📝 CHANGELOG

### v1.0.0 - 2025-11-29

#### Ajouté
- Système complet carte du monde 100x100
- Fog of war avec exploration progressive
- Colonisation multi-villes (jusqu'à 20)
- 8 technologies progression
- Worker automatique finalisation
- API complète (12 endpoints)
- Interface Canvas 2D interactive
- Multi-villes management
- Scripts setup automatiques

#### Modifié
- Modèle City étendu (coords, vision, founded_at)
- Container DI enrichi
- Routes API v1 étendues
- Menu navigation (+1 lien)

#### Technique
- 4 nouvelles tables SQL
- 8 nouveaux modèles/services/repositories
- 3 nouveaux modules backend
- 2 composants frontend
- 2 scripts utilitaires
- Documentation complète

---

**Développé avec ❤️ pour Terra Dominus**

*Un système de carte territoriale moderne et scalable pour jeux de stratégie multi-joueurs*
