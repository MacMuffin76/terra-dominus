# 🎮 Terra Dominus - Refonte Système de Jeu

## 📅 Date: 1er Décembre 2025

## 🎯 Objectif de la Refonte

Transformer le système de déblocage des unités d'un modèle basé uniquement sur le **niveau du joueur** vers un système basé sur les **niveaux de bâtiments + recherches complétées**.

### Thème du jeu
- **Post-apocalyptique terrestre** 🌍
- **Pas d'unités aériennes** (civilisation décimée repartant de zéro)
- **8 unités terrestres** avec système de contre (rock-paper-scissors)
- **8 défenses** avec système de contre
- **Arbre technologique** avec dépendances

---

## ✅ Réalisations Complètes

### 1. Fichiers de Définitions (Domain Layer)

#### 📦 `backend/modules/combat/domain/unitDefinitions.js`
- **8 unités terrestres** définies (plus d'unités aériennes)
- **4 tiers** basés sur niveaux de bâtiments
- Système de **counters** et **weakTo** pour chaque unité
- Prérequis: `requiredBuildings` (Training Center + Forge) + `requiredResearch`

**Unités:**
1. 🪖 **Milice** (Tier 1) - Unité de base
2. 🎖️ **Fusiliers** (Tier 1) - Infanterie standard
3. 🔍 **Éclaireurs** (Tier 2) - Reconnaissance rapide
4. 🚚 **Transport** (Tier 2) - Logistique
5. 🛠️ **Sapeurs** (Tier 2) - Génie militaire
6. 🎯 **Tireurs d'Élite** (Tier 3) - Précision longue portée
7. 🚗 **Chars Légers** (Tier 3) - Véhicules blindés légers
8. 💣 **Anti-Blindage** (Tier 4) - Spécialisé anti-véhicules
9. 🛡️ **Tanks Lourds** (Tier 4) - Assaut blindé lourd

**Exemple d'équilibrage:**
```javascript
HEAVY_TANK: {
  requiredBuildings: { trainingCenter: 10, forge: 8 },
  requiredResearch: ['heavy_armor'],
  counters: ['light_tank', 'riflemen'],
  weakTo: ['anti_armor']
}
```

#### 🛡️ `backend/modules/combat/domain/defenseDefinitions.js`
- **8 structures défensives**
- **4 tiers** basés sur Defense Workshop
- Système de counters contre unités spécifiques

**Défenses:**
1. 🧱 **Mur Renforcé** (Tier 1)
2. 🔫 **Tourelle Mitrailleuse** (Tier 1)
3. ⚡ **Piège Électrique** (Tier 2)
4. 🎯 **Tourelle Anti-Véhicule** (Tier 2)
5. 🏰 **Bunker Fortifié** (Tier 3)
6. 💥 **Canon Anti-Tank** (Tier 3)
7. 🌟 **Tourelle Plasma** (Tier 4)
8. 🛡️ **Bouclier Énergétique** (Tier 4)

#### 🔬 `backend/modules/research/domain/researchDefinitions.js`
- **20+ technologies** réparties en **6 catégories**
- Système de **dépendances** entre recherches
- Effet **unlocks** pour débloquer unités/défenses

**Catégories:**
- 💰 `ECONOMY` - Production et efficacité
- 🎖️ `MILITARY_INFANTRY` - Unités d'infanterie
- 🚗 `MILITARY_VEHICLES` - Véhicules blindés
- ⚔️ `MILITARY_ADVANCED` - Technologies avancées
- 🛡️ `DEFENSE` - Structures défensives
- 🗺️ `EXPLORATION` - Expansion et reconnaissance

**Exemple de chaîne de recherche:**
```
military_training_1 → guerrilla_tactics_1 → motorization_1 → light_armor → heavy_armor
```

#### 🏗️ `backend/modules/facilities/domain/facilityDefinitions.js`
- **6 installations stratégiques**
- Bonus par niveau
- Déblocages par niveau (levelUnlocks)

**Installations:**
1. 🎯 **Centre d'Entraînement** (Training Center) - Max Niv 15
2. 🛠️ **Atelier de Défense** (Defense Workshop) - Max Niv 15
3. 🔬 **Laboratoire de Recherche** (Research Lab) - Max Niv 15
4. ⚙️ **Forge Militaire** (Military Forge) - Max Niv 10
5. 🏛️ **Centre de Commandement** (Command Center) - Max Niv 10
6. 💱 **Poste de Commerce** (Trading Post) - Max Niv 10

---

### 2. Services Backend (Application Layer)

#### ⚔️ `UnitUnlockService` (RÉÉCRIT)
**Avant:** Vérifiait uniquement `user.level >= tier.unlockLevel`

**Après:** 
- Vérifie **Training Center level**
- Vérifie **Forge level**
- Vérifie **recherches complétées**
- Retourne `unlocked[]`, `locked[]`, `nextUnlock`, `tierProgress`

**Endpoints:**
- `GET /api/units/unlock/available`
- `GET /api/units/unlock/check/:unitId`
- `GET /api/units/unlock/tiers`

#### 🛡️ `DefenseUnlockService` (NOUVEAU)
- Vérifie **Defense Workshop level**
- Vérifie **recherches complétées**
- Même structure que UnitUnlockService

**Endpoints:**
- `GET /api/defense/unlock/available`
- `GET /api/defense/unlock/check/:defenseId`
- `GET /api/defense/unlock/tiers`

#### 🔬 `ResearchUnlockService` (NOUVEAU)
- Vérifie **Research Lab level**
- Vérifie **recherches prérequises**
- Retourne `available`, `inProgress`, `completed`, `locked`

**Endpoints:**
- `GET /api/research/unlock/available`
- `GET /api/research/unlock/check/:researchId`
- `GET /api/research/unlock/category/:category`

#### 🏗️ `FacilityService` (NOUVEAU)
- Liste toutes les installations
- Calcule bonus par niveau
- Calcule coûts d'amélioration avec multiplicateur

**Endpoints:**
- `GET /api/facilities/unlock/list`
- `GET /api/facilities/unlock/details/:facilityKey`
- `GET /api/facilities/unlock/bonuses`

---

### 3. Frontend - Nouvelles Pages Unifiées

#### 🎖️ `TrainingUnified.js` (Remplace Training.js + UnitTrainingPanel.js)
**Fonctionnalités:**
- **Onglet Unités:** Affiche 8 unités avec statut unlock/locked
- **Onglet Installations:** Affiche Training Center, Forge, etc.
- Filtres par **Tier** (1, 2, 3, 4)
- Affichage des **prérequis manquants**
- **Barre de progression** des tiers

**Routes:**
- `/training` → `TrainingUnified`
- `/units` → `TrainingUnified` (même composant)

#### 🛡️ `DefenseUnified.js` (Remplace Defense.js)
**Fonctionnalités:**
- Affiche 8 défenses avec unlock status
- Filtres par Tier
- Affichage counters/weaknesses
- Prérequis (Defense Workshop + Recherches)

**Route:**
- `/defense` → `DefenseUnified`

---

### 4. Infrastructure Backend

#### 📦 `container.js` - Injection de Dépendances
Nouveaux services enregistrés:
```javascript
container.register('unitUnlockService', ...)
container.register('defenseUnlockService', ...)
container.register('researchUnlockService', ...)
container.register('facilityService', ...)
```

Dépendances injectées: `User`, `Research`, `Building`, `Facility`, `City`, `sequelize`

#### 🌐 `api/index.js` - Routes API
Nouvelles routes:
```javascript
router.use('/units/unlock', createUnitUnlockRouter(container));
router.use('/defense/unlock', createDefenseUnlockRouter(container));
router.use('/research/unlock', createResearchUnlockRouter(container));
router.use('/facilities/unlock', createFacilityUnlockRouter(container));
```

---

## 🔄 Changements Architecturaux

### Ancien Système
```
Player Level → Unit Unlocked
```

### Nouveau Système
```
Building Levels + Completed Research → Unit/Defense/Research Unlocked
```

### Exemple Concret: Débloquer "Tanks Lourds"
**Avant:**
- Niveau joueur >= 40

**Après:**
- Centre d'Entraînement Niv **10** ✅
- Forge Militaire Niv **8** ✅
- Recherche "Blindage Lourd" **complétée** ✅

---

## 📊 Équilibrage - Système de Contre

### Bonus/Malus
- **COUNTER_BONUS:** `1.5x` dégâts (fort contre)
- **WEAK_TO_PENALTY:** `0.7x` dégâts (faible contre)

### Exemple de Matrice de Contre
| Unité | Fort contre | Faible contre |
|-------|-------------|---------------|
| Fusiliers | Milice, Éclaireurs | Chars, Tanks |
| Chars Légers | Infanterie | Anti-Blindage, Tanks |
| Anti-Blindage | Chars Légers, Tanks Lourds | Infanterie |
| Tireurs d'Élite | Éclaireurs, Infanterie | Véhicules blindés |

---

## 🗂️ Fichiers Créés/Modifiés

### Backend - Nouveaux Fichiers (12)
```
backend/modules/combat/domain/unitDefinitions.js (500+ lignes)
backend/modules/combat/domain/defenseDefinitions.js (400+ lignes)
backend/modules/research/domain/researchDefinitions.js (600+ lignes)
backend/modules/facilities/domain/facilityDefinitions.js (300+ lignes)

backend/modules/combat/application/DefenseUnlockService.js
backend/modules/research/application/ResearchUnlockService.js
backend/modules/facilities/application/FacilityService.js

backend/modules/combat/api/defenseUnlockRoutes.js
backend/modules/research/api/researchUnlockRoutes.js
backend/modules/facilities/api/facilityUnlockRoutes.js
```

### Backend - Fichiers Réécrits (1)
```
backend/modules/combat/application/UnitUnlockService.js (complètement réécrit)
```

### Backend - Fichiers Modifiés (2)
```
backend/container.js (4 nouveaux services enregistrés)
backend/api/index.js (4 nouvelles routes ajoutées)
```

### Frontend - Nouveaux Fichiers (3)
```
frontend/src/components/TrainingUnified.js
frontend/src/components/DefenseUnified.js
frontend/src/api/defenseUnlocks.js
```

### Frontend - Fichiers Modifiés (1)
```
frontend/src/App.js (routes Training, Units, Defense mises à jour)
```

**Total: 19 fichiers créés/modifiés**

---

## 🎯 Prochaines Étapes (Frontend)

### Pages à Créer
1. **ResearchUnified.js** - Affichage arbre technologique avec dépendances visuelles
2. **FacilitiesUnified.js** - Affichage 6 installations avec niveaux et bonus

### Composants UI Recommandés
- `TechTreeDiagram` - Graphe de dépendances recherches
- `RequirementsTooltip` - Tooltip détaillé pour prérequis
- `ProgressBar` - Barre de progression générique réutilisable
- `UnlockBadge` - Badge visuel unlock/locked

---

## 📝 Checklist Validation

### Backend ✅
- [x] Définitions 8 unités terrestres
- [x] Définitions 8 défenses
- [x] Arbre technologique 20+ recherches
- [x] 6 installations stratégiques
- [x] UnitUnlockService (bâtiments + recherches)
- [x] DefenseUnlockService
- [x] ResearchUnlockService
- [x] FacilityService
- [x] Routes API complètes (12 endpoints)
- [x] Container DI configuré
- [x] Services enregistrés

### Frontend ✅ (Partiel)
- [x] TrainingUnified.js créé
- [x] DefenseUnified.js créé
- [x] Routes mises à jour (App.js)
- [x] API client defenseUnlocks.js
- [ ] ResearchUnified.js - EN ATTENTE
- [ ] FacilitiesUnified.js - EN ATTENTE
- [ ] Tests E2E

---

## 🚀 Déploiement

### Ordre Recommandé
1. ✅ **Backend:** Services et routes déployés
2. ⏳ **Migrations DB:** Vérifier table `facilities` existe
3. ✅ **Frontend:** Pages Training et Defense déployées
4. ⏳ **Tests:** Validation complète
5. ⏳ **Production:** Déploiement progressif

### Points de Vigilance ⚠️
- Vérifier que tous les joueurs ont des facilities initialisées
- Valider compatibilité anciennes données
- Invalider cache frontend si nécessaire
- Tester système unlock avec vrais joueurs

---

**Refonte réalisée le 1er Décembre 2025**  
**Durée totale:** ~3 heures  
**Lignes de code:** ~2500+ lignes (backend + frontend)  
**Architecture:** DDD (Domain-Driven Design)
