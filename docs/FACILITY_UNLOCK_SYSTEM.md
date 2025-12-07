# 🔓 Système de Déverrouillage des Installations

## Vue d'ensemble

Le système de déverrouillage des installations est maintenant basé sur le **niveau du Centre de Commandement**. Chaque installation nécessite un niveau minimum du Centre de Commandement pour être construite ou améliorée.

## 📋 Règles de Déverrouillage

### Centre de Commandement (Max: Niveau 10)

Le Centre de Commandement est le bâtiment principal qui débloque progressivement toutes les autres installations.

| Niveau CC | Installations Débloquées |
|-----------|--------------------------|
| **0** | Aucune installation disponible |
| **1** | Centre d'Entraînement (jusqu'au niv 3), Atelier de Défense (jusqu'au niv 3) |
| **2** | Centre d'Entraînement (jusqu'au niv 5), Atelier de Défense (jusqu'au niv 5) |
| **3** | Laboratoire de Recherche (jusqu'au niv 5) |
| **4** | Centre d'Entraînement (jusqu'au niv 8), Atelier de Défense (jusqu'au niv 8) |
| **5** | Laboratoire de Recherche (jusqu'au niv 10), Forge Militaire (jusqu'au niv 5) |
| **6** | Centre d'Entraînement (jusqu'au niv 10), Comptoir Commercial (jusqu'au niv 5) |
| **7** | Atelier de Défense (jusqu'au niv 10), Forge Militaire (jusqu'au niv 8) |
| **8** | Centre d'Entraînement (jusqu'au niv 15), Laboratoire de Recherche (jusqu'au niv 15), Comptoir Commercial (jusqu'au niv 10) |
| **9** | Atelier de Défense (jusqu'au niv 15), Forge Militaire (jusqu'au niv 10) |
| **10** | Toutes installations au niveau maximum |

### Installations et Leurs Prérequis

#### 🎯 Centre d'Entraînement (Max: Niveau 15)
- **CC Niv 1**: Déblocage initial (niveaux 1-3)
- **CC Niv 2**: Niveaux 4-5
- **CC Niv 4**: Niveaux 6-8
- **CC Niv 6**: Niveaux 9-10
- **CC Niv 8**: Niveaux 11-15

#### 🛡️ Atelier de Défense (Max: Niveau 15)
- **CC Niv 1**: Déblocage initial (niveaux 1-3)
- **CC Niv 2**: Niveaux 4-5
- **CC Niv 4**: Niveaux 6-8
- **CC Niv 7**: Niveaux 9-10
- **CC Niv 9**: Niveaux 11-15

#### 🔬 Laboratoire de Recherche (Max: Niveau 15)
- **CC Niv 3**: Déblocage initial (niveaux 1-5)
- **CC Niv 5**: Niveaux 6-10
- **CC Niv 8**: Niveaux 11-15

#### 🏭 Forge Militaire (Max: Niveau 10)
- **CC Niv 5**: Déblocage initial (niveaux 1-5)
- **CC Niv 7**: Niveaux 6-8
- **CC Niv 9**: Niveaux 9-10

#### 🏪 Comptoir Commercial (Max: Niveau 10)
- **CC Niv 6**: Déblocage initial (niveaux 1-5)
- **CC Niv 8**: Niveaux 6-10

## 🔧 Implémentation Technique

### Backend

#### Service: `FacilityUnlockService`
**Emplacement**: `backend/modules/facilities/application/FacilityUnlockService.js`

**Méthodes principales**:
- `getCommandCenterLevel(userId)` - Récupère le niveau actuel du CC
- `checkFacilityUnlock(userId, facilityKey, targetLevel)` - Vérifie si une installation peut être construite/améliorée
- `getAvailableFacilities(userId)` - Liste toutes les installations avec leur statut de déverrouillage
- `getUnlockProgressSummary(userId)` - Résumé de progression

#### Routes API

**Base URL**: `/api/v1/facilities/unlock/`

```javascript
GET /available
// Retourne: { facilities: [...], commandCenterLevel: 3 }

GET /check/:facilityKey?targetLevel=5
// Retourne: { canBuild: true/false, reason: "...", commandCenterLevel: 3, requiredLevel: 2 }

GET /progress
// Retourne: { commandCenterLevel, totalFacilities, locked, unlocked, nextUnlock }

GET /command-center-level
// Retourne: { level: 3 }
```

### Frontend

#### Composant: `FacilityCard`
**Emplacement**: `frontend/src/components/facilities/FacilityCard.js`

**Nouvelles props**:
- `isLocked` - Indique si l'installation est verrouillée
- `lockReason` - Raison du verrouillage (ex: "Centre de Commandement niveau 3 requis")

**Affichage**:
- 🔒 Icône de cadenas pour les installations verrouillées
- Filtre grayscale + opacité réduite
- Tooltip au survol avec raison du verrouillage
- Désactivation du clic

## 🧪 Tests

### Script de Test
```bash
node test_facility_unlock.js [userId]
```

**Ce que le script teste**:
1. Niveau du Centre de Commandement
2. Liste de toutes les installations disponibles
3. Installations verrouillées et leurs prérequis
4. Résumé de progression
5. Vérifications spécifiques pour différents niveaux

### Tests Unitaires (à ajouter)
```bash
cd backend
npm test -- modules/facilities/application/FacilityUnlockService.test.js
```

## 📊 Exemples d'Utilisation

### Frontend - Récupérer les installations disponibles
```javascript
import axiosInstance from '../utils/axiosInstance';

const { data: unlockData } = await axiosInstance.get('/facilities/unlock/available');

console.log(`Centre de Commandement: Niveau ${unlockData.commandCenterLevel}`);
console.log(`Installations verrouillées: ${unlockData.facilities.filter(f => f.isLocked).length}`);
```

### Backend - Vérifier avant l'upgrade
```javascript
const facilityUnlockService = container.resolve('facilityUnlockService');
const unlockCheck = await facilityUnlockService.checkFacilityUnlock(
  userId, 
  'TRAINING_CENTER', 
  targetLevel
);

if (!unlockCheck.canBuild) {
  throw new Error(unlockCheck.reason);
}
```

## 🎯 Progression Recommandée

### Early Game (CC 1-3)
1. Construire le Centre de Commandement niveau 1
2. Débloquer Centre d'Entraînement et Atelier de Défense
3. Améliorer le CC au niveau 3
4. Débloquer le Laboratoire de Recherche

### Mid Game (CC 4-6)
1. Monter les installations militaires à niveau 8
2. Débloquer la Forge Militaire (CC niv 5)
3. Débloquer le Comptoir Commercial (CC niv 6)

### Late Game (CC 7-10)
1. Maximiser toutes les installations
2. Débloquer les derniers niveaux avancés
3. Optimiser les bonus globaux

## 🔄 Intégration avec les Autres Systèmes

### Unités
Les unités restent débloquées par le Centre d'Entraînement, mais le Centre d'Entraînement nécessite maintenant un CC minimum.

### Recherches
Les recherches restent débloquées par le Laboratoire de Recherche, qui nécessite CC niveau 3 minimum.

### Défenses
Les défenses restent débloquées par l'Atelier de Défense, disponible dès CC niveau 1.

## 📝 Notes de Développement

- Le Centre de Commandement n'a **aucun prérequis** - c'est le point de départ
- Les vérifications sont effectuées côté backend lors des upgrades
- Le frontend affiche visuellement les installations verrouillées
- Les tooltips informent le joueur des prérequis manquants

## 🚀 Prochaines Étapes

- [ ] Ajouter des tests unitaires complets
- [ ] Créer des notifications lors du déverrouillage
- [ ] Ajouter une barre de progression vers le prochain déverrouillage
- [ ] Intégrer avec le système de quêtes (débloquer installations via quêtes)
