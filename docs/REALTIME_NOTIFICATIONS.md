# Real-Time Notification System - Terra Dominus

## Vue d'ensemble

Le système de notifications envoie des alertes en temps réel aux joueurs via Socket.IO pour les événements importants du jeu. Les notifications sont non-intrusives et n'empêchent jamais les actions principales si Socket.IO est indisponible.

## Architecture

### Service Central

**Fichier:** `backend/utils/notificationService.js`

Service statique qui gère tous les types de notifications. Utilise Socket.IO pour envoyer des messages aux utilisateurs connectés.

**Principe:** Graceful degradation - si Socket.IO n'est pas initialisé ou si l'utilisateur est déconnecté, les notifications sont simplement ignorées sans erreur.

### Types de Notifications

```javascript
NotificationService.TYPES = {
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  LEADERBOARD_RANK_CHANGED: 'leaderboard_rank_changed',
  LEADERBOARD_TOP_ENTRY: 'leaderboard_top_entry',
  BATTLE_PASS_TIER_UP: 'battle_pass_tier_up',
  BATTLE_PASS_REWARD_AVAILABLE: 'battle_pass_reward_available',
  QUEST_COMPLETED: 'quest_completed',
  BUILDING_COMPLETED: 'building_completed',
  RESEARCH_COMPLETED: 'research_completed',
  COMBAT_RESULT: 'combat_result',
  RESOURCE_LOW: 'resource_low',
  CITY_ATTACKED: 'city_attacked'
};
```

### Priorités

```javascript
NotificationService.PRIORITIES = {
  LOW: 'low',           // Informations mineures
  MEDIUM: 'medium',     // Événements importants (défaut)
  HIGH: 'high',         // Événements critiques (top 10, tier up)
  CRITICAL: 'critical'  // Urgences (attaque, ressources critiques)
};
```

## Points d'Intégration

### 1. Achievement System

**Fichier:** `backend/utils/achievementChecker.js`

**Intégration:** Notifications envoyées automatiquement quand un achievement est débloqué

```javascript
if (unlockedAchievements.length > 0) {
  unlockedAchievements.forEach(unlocked => {
    NotificationService.notifyAchievementUnlocked(userId, unlocked.achievement);
  });
}
```

**Événements déclenchés:**
- Combat achievement débloqué
- Building achievement débloqué
- Quest achievement débloqué
- Research achievement débloqué
- Level achievement débloqué
- Trade achievement débloqué

**Format de notification:**

```javascript
{
  type: 'achievement_unlocked',
  title: '🏆 Achievement Unlocked!',
  message: 'You unlocked: Première Victoire',
  icon: 'trophy.png',
  link: '/achievements',
  achievementId: 1,
  achievementName: 'Première Victoire',
  achievementDescription: 'Win your first battle',
  priority: 'medium',
  timestamp: '2024-11-30T12:00:00.000Z'
}
```

### 2. Leaderboard System

**Fichier:** `backend/modules/leaderboard/application/LeaderboardService.js`

**Intégration:** Notifications envoyées lors des mises à jour de score

```javascript
// After score update
const newRank = await this._calculateRank(userId, category);

// Notify if rank changed significantly (≥5 positions or top 10 entry/exit)
if (oldRank && newRank !== oldRank) {
  NotificationService.notifyLeaderboardRankChanged(userId, category, oldRank, newRank);
}

// Notify if newly entered top 10
if (newRank <= 10 && (!oldRank || oldRank > 10)) {
  NotificationService.notifyLeaderboardTopEntry(userId, category, newRank);
}
```

**Conditions de notification:**

| Condition | Notification |
|-----------|--------------|
| Changement ≥ 5 rangs | Rank Changed |
| Entrée top 10 | Top Entry |
| Sortie top 10 | Rank Changed |
| Top 3 (1er, 2e, 3e) | Top Entry avec médaille |

**Format de notification (Rank Changed):**

```javascript
{
  type: 'leaderboard_rank_changed',
  title: '📈 Leaderboard Update',
  message: 'You climbed 7 positions in total_power! (Rank #18)',
  icon: 'leaderboard',
  link: '/leaderboard?category=total_power',
  category: 'total_power',
  oldRank: 25,
  newRank: 18,
  rankDiff: 7,
  priority: 'medium',
  timestamp: '2024-11-30T12:00:00.000Z'
}
```

**Format de notification (Top Entry):**

```javascript
{
  type: 'leaderboard_top_entry',
  title: '🥉 Top 3 in combat_victories!',
  message: 'Congratulations! You're now ranked #3 in the combat_victories leaderboard!',
  icon: 'trophy',
  link: '/leaderboard?category=combat_victories',
  category: 'combat_victories',
  rank: 3,
  priority: 'high',
  timestamp: '2024-11-30T12:00:00.000Z'
}
```

**Médailles:** 🥇 (1er), 🥈 (2e), 🥉 (3e), 🏅 (4-10)

### 3. Battle Pass System

**Fichier:** `backend/modules/battlepass/application/BattlePassService.js`

**Intégration:** Notifications envoyées lors de la montée de tier

```javascript
// After XP addition and tier calculation
if (tiersGained > 0) {
  NotificationService.notifyBattlePassTierUp(userId, newTier, newCurrentXP);
}
```

**Format de notification:**

```javascript
{
  type: 'battle_pass_tier_up',
  title: '⭐ Battle Pass Tier Up!',
  message: 'You reached Tier 5! Check your rewards.',
  icon: 'star',
  link: '/battle-pass',
  tier: 5,
  xp: 250,
  priority: 'high',
  timestamp: '2024-11-30T12:00:00.000Z'
}
```

## Méthodes du Service

### Notifications Utilisateur

#### `sendToUser(userId, type, data, priority)`

Envoie une notification à un utilisateur spécifique.

**Paramètres:**
- `userId` (number): ID de l'utilisateur
- `type` (string): Type de notification (TYPES)
- `data` (object): Données de la notification
  - `title` (string, required): Titre
  - `message` (string, required): Message
  - `icon` (string, optional): Icône
  - `link` (string, optional): Lien vers une page
  - Autres champs spécifiques au type
- `priority` (string, optional): Priorité (défaut: 'medium')

**Exemple:**

```javascript
NotificationService.sendToUser(
  123,
  'custom_event',
  {
    title: 'Event Title',
    message: 'Event description',
    icon: 'bell',
    link: '/events',
    customData: { foo: 'bar' }
  },
  'high'
);
```

#### Méthodes Spécialisées

```javascript
// Achievement
notifyAchievementUnlocked(userId, achievement)

// Leaderboard
notifyLeaderboardRankChanged(userId, category, oldRank, newRank)
notifyLeaderboardTopEntry(userId, category, rank)

// Battle Pass
notifyBattlePassTierUp(userId, newTier, newXP)
notifyBattlePassRewardsAvailable(userId, rewardCount)

// Game Events
notifyQuestCompleted(userId, quest)
notifyBuildingCompleted(userId, building)
notifyResearchCompleted(userId, research)
notifyCombatResult(userId, outcome, details)
notifyCityAttacked(userId, attackDetails)
notifyResourceLow(userId, resourceType, currentAmount)
```

### Notifications Broadcast

#### `sendBroadcast(type, data, priority)`

Envoie une notification à tous les utilisateurs connectés.

**Exemple:**

```javascript
NotificationService.sendBroadcast(
  'server_maintenance',
  {
    title: '🛠️ Server Maintenance',
    message: 'Scheduled maintenance in 10 minutes',
    icon: 'warning'
  },
  'critical'
);
```

## Configuration Socket.IO

### User Rooms

Chaque utilisateur rejoint automatiquement sa "room" personnelle lors de la connexion:

**Fichier:** `backend/server.js`

```javascript
io.on('connection', (socket) => {
  const userId = socket.user?.id;
  
  // Join user-specific room
  const userRoom = `user_${userId}`;
  socket.join(userRoom);
  
  // ...
});
```

Les notifications utilisent cette room pour cibler les utilisateurs:

```javascript
io.to(`user_${userId}`).emit('notification', notification);
```

**Avantages:**
- Multi-device support: toutes les sessions d'un utilisateur reçoivent les notifications
- Ciblage précis sans parcourir tous les sockets
- Performances optimisées

### Format de Notification Reçue

Côté client (frontend), les notifications sont reçues via:

```javascript
socket.on('notification', (notification) => {
  console.log('Notification received:', notification);
  // notification = {
  //   type: 'achievement_unlocked',
  //   title: '🏆 Achievement Unlocked!',
  //   message: 'You unlocked: Première Victoire',
  //   icon: 'trophy.png',
  //   link: '/achievements',
  //   priority: 'medium',
  //   timestamp: '2024-11-30T12:00:00.000Z',
  //   ... (données spécifiques au type)
  // }
});
```

## Tests

### Script de Test

**Fichier:** `backend/testNotifications.js`

```bash
cd backend
node testNotifications.js
```

Le test vérifie:
- ✓ Tous les types de notifications peuvent être appelés
- ✓ Les notifications sont envoyées sans erreur (si Socket.IO disponible)
- ✓ Graceful degradation fonctionne (aucune erreur si Socket.IO absent)
- ✓ Achievement check déclenche notification réelle
- ✓ Battle Pass XP addition déclenche notification réelle

### Test avec Client Réel

1. **Démarrer le serveur:**

```bash
cd backend
npm run start
```

2. **Ouvrir le frontend:**

```bash
cd frontend
npm start
```

3. **Ouvrir la console navigateur** (F12)

4. **Écouter les notifications:**

```javascript
// Dans la console navigateur
socket.on('notification', (notif) => {
  console.log('🔔 Notification:', notif.title, notif.message);
});
```

5. **Déclencher des événements:**

- Gagner un combat → Achievement notification
- Compléter une quête → Quest + Achievement notifications
- Monter de niveau → Level achievement + Battle Pass XP notifications
- Construire un bâtiment → Building achievement notification

## Intégration Frontend

### Redux Slice (Recommandé)

Créer un slice pour gérer les notifications:

```javascript
// frontend/src/redux/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0
  },
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount++;
    },
    markAsRead: (state, action) => {
      const notification = state.items.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount--;
      }
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    }
  }
});
```

### Hook Personnalisé

```javascript
// frontend/src/hooks/useNotifications.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socket } from '../utils/socket';
import { addNotification } from '../redux/notificationSlice';

export const useNotifications = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleNotification = (notification) => {
      // Ajouter au Redux store
      dispatch(addNotification({
        id: Date.now(),
        ...notification,
        read: false
      }));

      // Afficher toast notification
      showToast(notification);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [dispatch]);
};
```

### Composant Notification Toast

```jsx
// frontend/src/components/NotificationToast.jsx
import React from 'react';
import { toast } from 'react-toastify';

export const showNotification = (notification) => {
  const { type, title, message, priority, link } = notification;

  const toastOptions = {
    autoClose: priority === 'critical' ? false : 5000,
    className: `notification-${priority}`,
    onClick: () => link && window.location.assign(link)
  };

  toast(
    <div className="notification-content">
      <h4>{title}</h4>
      <p>{message}</p>
    </div>,
    toastOptions
  );
};
```

### CSS pour Priorités

```css
/* frontend/src/styles/notifications.css */
.notification-low {
  background: #f0f0f0;
  border-left: 4px solid #888;
}

.notification-medium {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.notification-high {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
}

.notification-critical {
  background: #ffebee;
  border-left: 4px solid #f44336;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

## Performance

### Optimisations Backend

1. **Lazy Socket.IO loading:** `getIO()` n'est appelé que quand nécessaire
2. **Graceful degradation:** Pas d'erreur si Socket.IO absent
3. **User rooms:** Ciblage efficace sans parcourir tous les sockets
4. **No-op si déconnecté:** Pas de requêtes DB inutiles

### Optimisations Frontend

1. **Redux pour persistence:** Notifications stockées côté client
2. **Throttling:** Limiter le nombre de toasts affichés simultanément
3. **Lazy loading:** Charger les notifications anciennes à la demande
4. **Auto-dismiss:** Fermer automatiquement les notifications basses priorités

## Sécurité

### Authentification

- **Token JWT required:** Middleware `socketAuthMiddleware` vérifie le token
- **User rooms isolées:** Chaque utilisateur reçoit uniquement ses notifications
- **Pas de données sensibles:** Les notifications contiennent uniquement des infos publiques

### Anti-Spam

**Recommandations futures:**

1. **Rate limiting:** Limiter le nombre de notifications par utilisateur/minute
2. **Debouncing:** Grouper les notifications similaires (ex: plusieurs achievements en 5s)
3. **User preferences:** Permettre aux joueurs de désactiver certains types

## Monitoring

### Logs

Tous les envois de notifications sont loggés:

```javascript
logger.info(`Notification sent to user ${userId}:`, {
  type,
  title: data.title,
  priority
});
```

### Métriques Suggérées

- Nombre de notifications envoyées par type
- Taux de delivery (connecté vs déconnecté)
- Temps de latence entre événement et notification
- Taux de clic sur notifications (si tracking ajouté)

## Évolutions Futures

### Quick Wins

1. **Persistance DB:** Sauvegarder les notifications en base pour historique
2. **Badge count:** Afficher le nombre de notifications non lues
3. **Notification center:** Page dédiée aux notifications
4. **Filtering:** Filtrer par type, priorité, date

### Features Avancées

1. **Push notifications:** Support pour notifications browser natives
2. **Email notifications:** Envoyer aussi par email pour événements critiques
3. **SMS notifications:** Pour attaques ou événements urgents
4. **Notification groups:** Grouper notifications similaires ("3 achievements unlocked")
5. **Rich notifications:** Images, boutons d'action, sons personnalisés

## Dépannage

### Notifications non reçues côté client

**Causes possibles:**
1. Socket.IO non connecté → Vérifier `socket.connected`
2. User room non rejointe → Vérifier logs `Client connected`
3. Frontend listener manquant → Ajouter `socket.on('notification', ...)`

**Solution:**

```javascript
// Vérifier la connexion
console.log('Socket connected:', socket.connected);
console.log('Socket ID:', socket.id);

// Tester manuellement
socket.emit('user_connected', { userId: 78 });
```

### Notifications envoyées mais non affichées

**Cause:** Pas de handler frontend ou toast non configuré

**Solution:**

```javascript
// Ajouter handler basique
socket.on('notification', (notif) => {
  alert(`${notif.title}: ${notif.message}`);
});
```

### "Socket.IO not initialized" dans les logs

**Cause:** Normale dans tests standalone ou avant initialisation serveur

**Solution:** Ce n'est pas une erreur, c'est le graceful degradation qui fonctionne.

## Références

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [React Toastify](https://fkhadra.github.io/react-toastify/)
- [Battle Pass XP Sources](./BATTLE_PASS_XP_SOURCES.md)
- [Achievement Auto-Detection](./ACHIEVEMENT_AUTO_DETECTION.md)
- [Leaderboard Initialization](./LEADERBOARD_INITIALIZATION.md)

---

**Auteur**: GitHub Copilot  
**Date**: 2024-11-30  
**Version**: 1.0  
**Statut**: ✅ Quick Win #4 Complété
