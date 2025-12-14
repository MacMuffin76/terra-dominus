# Correction du problème de mise à niveau des installations

## 🐛 Problème identifié

Les installations (facilities) restaient bloquées en statut "En cours..." même après l'expiration du timer de construction.

## 🔍 Causes racines

### 1. **Problème Backend - Type manquant dans la queue**
Dans `FacilityService.js`, lors de la programmation du job Bull, le `type: 'facility'` n'était pas transmis à `scheduleConstructionCompletion`. 

**Conséquence**: Le job était programmé dans la mauvaise queue (`resource-upgrade` au lieu de `facility-upgrade`), donc le worker `facilityUpgradeWorker` ne le traitait jamais.

**Fichier**: `backend/modules/facilities/application/FacilityService.js` ligne ~460

### 2. **Problème Frontend - Ancienne API utilisée**
Le frontend utilisait l'ancienne route `/facilities/facility-buildings/:id/upgrade` qui faisait l'upgrade **immédiatement** sans passer par la construction queue.

**Conséquence**: L'interface montrait l'upgrade comme instantané, mais en réalité aucun job n'était programmé pour finaliser la construction.

**Fichier**: `frontend/src/components/facilities/FacilityDetailModal.js`

### 3. **Problème Frontend - Pas d'écoute socket**
Le frontend n'écoutait pas les événements `construction_queue:update` pour rafraîchir automatiquement les données des installations.

**Conséquence**: Même si le backend finalisait la construction, l'interface ne se mettait pas à jour.

## ✅ Solutions appliquées

### Backend

#### 1. Ajout du type dans scheduleConstructionCompletion
**Fichier**: `backend/modules/facilities/application/FacilityService.js`
```javascript
await scheduleConstructionCompletion({
  id: committedItem.id,
  finishTime: committedItem.finishTime,
  type: 'facility', // ← AJOUTÉ
}, { userId });
```

#### 2. Nouvelle route pour récupérer les détails par clé
**Fichier**: `backend/modules/facilities/api/facilityUnlockRoutes.js`
```javascript
router.get('/details/:facilityKey', protect, async (req, res) => {
  // ...
});
```

**Fichier**: `backend/modules/facilities/application/FacilityService.js`
```javascript
async getFacilityDetailsByKey(userId, facilityKey) {
  // Nouvelle méthode pour récupérer les détails d'une facility par sa clé
}
```

### Frontend

#### 1. Utilisation de la nouvelle API avec construction queue
**Fichier**: `frontend/src/components/facilities/FacilityDetailModal.js`
```javascript
// Avant:
await axiosInstance.post(`/facilities/facility-buildings/${facility.id}/upgrade`);

// Après:
await axiosInstance.post(`/facilities/unlock/upgrade/${facility.key}`);
```

#### 2. Écoute des événements socket dans la modale
**Fichier**: `frontend/src/components/facilities/FacilityDetailModal.js`
```javascript
useEffect(() => {
  const handleConstructionUpdate = () => {
    console.log('🏗️ Construction queue updated, refreshing facility details...');
    fetchDetail();
  };

  socket.on('construction_queue:update', handleConstructionUpdate);

  return () => {
    socket.off('construction_queue:update', handleConstructionUpdate);
  };
}, [facility.id, facility.key]);
```

#### 3. Écoute des événements socket dans la liste des facilities
**Fichier**: `frontend/src/components/Facilities.js`
```javascript
useEffect(() => {
  const socket = require('../utils/socket').default;
  
  const handleConstructionUpdate = () => {
    console.log('🏗️ Construction queue updated, refreshing facilities list...');
    fetchData().catch(() => {});
  };

  socket.on('construction_queue:update', handleConstructionUpdate);

  return () => {
    socket.off('construction_queue:update', handleConstructionUpdate);
  };
}, [fetchData]);
```

## 🛠️ Outils de diagnostic créés

### 1. Script de diagnostic
**Fichier**: `backend/check_facility_upgrade_issue.js`

Permet de vérifier:
- Les constructions en cours dans la DB
- Les jobs dans la queue Redis
- Le nombre de workers actifs
- Les constructions bloquées

**Usage**:
```bash
cd backend
node check_facility_upgrade_issue.js
```

### 2. Script de correction
**Fichier**: `backend/fix_stuck_facility_upgrades.js`

Finalise manuellement les constructions bloquées en statut `in_progress` dont le timer est expiré.

**Usage**:
```bash
cd backend
node fix_stuck_facility_upgrades.js
```

## 📋 Checklist de vérification

Avant de déployer, vérifier:

- [ ] Le backend est démarré (`cd backend && npm run start`)
- [ ] Le worker `facilityUpgradeWorker` est actif (vérifier avec le script de diagnostic)
- [ ] Redis est démarré
- [ ] Le frontend est redéployé avec les nouvelles modifications
- [ ] Tester une mise à niveau et vérifier que:
  - [ ] La construction démarre (statut "En cours...")
  - [ ] Le timer s'affiche et décompte
  - [ ] À la fin du timer, l'installation passe au niveau supérieur automatiquement
  - [ ] Les ressources sont déduites au démarrage de la construction
  - [ ] L'interface se met à jour automatiquement sans F5

## 🎯 Flux correct maintenant

1. **Utilisateur clique sur "Améliorer"**
   - Frontend appelle `/facilities/unlock/upgrade/:facilityKey`
   
2. **Backend (FacilityService.upgradeFacilityByKey)**
   - Vérifie les prérequis et ressources
   - Déduit les ressources
   - Crée une entrée dans `construction_queue` avec `type: 'facility'` et `status: 'in_progress'`
   - Programme un job Bull dans la queue `facility-upgrade` avec le bon delay
   - Retourne `{ message: 'Construction started', ... }`

3. **Frontend reçoit la réponse**
   - Affiche un message de confirmation
   - Ferme la modale
   - La liste des facilities montre la construction en cours

4. **Pendant la construction**
   - Le timer décompte côté frontend
   - Le job reste dans la queue Redis avec le delay calculé

5. **À la fin du timer**
   - Le worker `facilityUpgradeWorker` traite le job
   - Appelle `FacilityService.finalizeFacilityUpgrade(queueId, userId)`
   - Met à jour le niveau de la facility en DB
   - Marque la construction comme `completed`
   - Émet l'événement socket `construction_queue:update`

6. **Frontend reçoit l'événement socket**
   - Rafraîchit automatiquement la liste des facilities
   - Met à jour la modale si elle est ouverte
   - L'utilisateur voit le nouveau niveau sans F5

## 📝 Notes importantes

- **Ne jamais utiliser** l'ancienne route `/facilities/facility-buildings/:id/upgrade` pour les nouvelles installations
- **Toujours** passer par `/facilities/unlock/upgrade/:facilityKey` pour respecter le système de construction queue
- **Vérifier** que le backend est démarré avant de tester les constructions
- **Redis** doit être actif pour que Bull fonctionne

## 🔮 Améliorations futures possibles

1. Afficher le statut de la construction dans la modale (temps restant, barre de progression)
2. Ajouter une notification push quand la construction est terminée
3. Permettre d'annuler une construction en cours
4. Afficher les constructions en cours directement dans la carte de la facility
5. Ajouter un son/animation quand la construction est terminée
