# 💬 Système de Chat Frontend - Terra Dominus

## 📋 Vue d'ensemble

Implémentation complète du système de messagerie en temps réel pour Terra Dominus avec support du chat global, chat d'alliance et architecture prête pour les messages privés.

## ✅ Composants Implémentés

### 1. Redux Store - `chatSlice.js`
**Localisation:** `frontend/src/redux/chatSlice.js`

**Fonctionnalités:**
- ✅ Gestion de l'état des messages (global, alliance, privés)
- ✅ Actions asynchrones (fetch, send, edit, delete)
- ✅ Indicateurs de frappe en temps réel
- ✅ Compteur de messages non lus par canal
- ✅ Pagination des messages
- ✅ Synchronisation Socket.IO

**Actions Redux:**
```javascript
// Actions synchrones
addMessage(message)              // Ajouter un message reçu via Socket.IO
updateMessage(message)           // Mettre à jour un message édité
removeMessage(messageId)         // Marquer un message comme supprimé
setActiveChannel({ channelType, userId })  // Changer de canal
addTypingUser({ channel, userId })         // Ajouter un indicateur de frappe
removeTypingUser({ channel, userId })      // Retirer un indicateur
setConnected(boolean)            // État de connexion Socket.IO
clearMessages(channelType)       // Vider les messages d'un canal
resetChat()                      // Réinitialiser tout

// Actions asynchrones (thunks)
fetchMessages({ channelType, channelId, limit, offset })
sendMessageHttp({ channelType, channelId, message, metadata })
editMessage({ messageId, message })
deleteMessage(messageId)
```

### 2. Composant ChatMessage - `ChatMessage.js`
**Localisation:** `frontend/src/components/ChatMessage.js`

**Fonctionnalités:**
- ✅ Affichage d'un message individuel avec avatar
- ✅ Édition en ligne (pour les messages propres)
- ✅ Suppression avec confirmation
- ✅ Timestamps relatifs ("Il y a 5 min")
- ✅ Indicateur "(modifié)" si édité
- ✅ Support des messages système
- ✅ Affichage des messages supprimés
- ✅ Actions hover (éditer/supprimer)

**Props:**
```javascript
{
  message: Object,      // Message complet avec author, timestamps, etc.
  isOwnMessage: boolean // true si c'est le message de l'utilisateur actuel
}
```

### 3. Composant Chat Principal - `Chat.js`
**Localisation:** `frontend/src/components/Chat.js`

**Fonctionnalités:**
- ✅ Onglets Global / Alliance
- ✅ Liste de messages scrollable avec auto-scroll
- ✅ Input avec compteur de caractères (2000 max)
- ✅ Indicateurs de frappe en temps réel
- ✅ État de connexion Socket.IO
- ✅ Badges de messages non lus
- ✅ Pagination ("Charger plus")
- ✅ Envoi via Socket.IO (temps réel)
- ✅ Gestion erreurs

**Événements Socket.IO écoutés:**
```javascript
connect                 // Connexion établie
disconnect             // Déconnexion
chat:message           // Nouveau message reçu
chat:edited            // Message édité
chat:deleted           // Message supprimé
chat:typing            // Utilisateur en train d'écrire
chat:joined            // Confirmation de rejoint un canal
chat:error             // Erreur côté serveur
```

**Événements Socket.IO émis:**
```javascript
chat:join:global                                    // Rejoindre chat global
chat:join:alliance { allianceId }                   // Rejoindre chat alliance
chat:send { channelType, message, channelId }       // Envoyer message
chat:typing { channelType, channelId }              // Indicateur de frappe
```

### 4. Styles CSS
**Fichiers:**
- `frontend/src/components/Chat.css` - Styles du composant principal
- `frontend/src/components/ChatMessage.css` - Styles des messages

**Design:**
- ✅ Design moderne avec dégradés bleu/rouge
- ✅ Responsive (mobile-first)
- ✅ Animations fluides (typing dots, hover)
- ✅ Mode sombre par défaut (cohérent avec le jeu)
- ✅ Scrollbar personnalisée
- ✅ Badges de notification

## 🔧 Configuration Socket.IO

**Fichier:** `frontend/src/utils/socket.js`

**Modifications apportées:**
```javascript
// Ajout de l'authentification JWT
export const socket = io(SOCKET_URL, {
  path: "/socket.io",
  transports: ["websocket"],
  auth: {
    token: getAuthToken()  // JWT pour authentification
  },
  autoConnect: true,
});
```

## 🗺️ Intégration dans l'App

### Redux Store
**Fichier:** `frontend/src/redux/store.js`

```javascript
import chatReducer from './chatSlice';

const store = configureStore({
  reducer: {
    // ... autres reducers
    chat: chatReducer,  // ✅ Ajouté
  },
});
```

### Routing
**Fichier:** `frontend/src/App.js`

```javascript
const Chat = React.lazy(() => import('./components/Chat'));

// Route ajoutée
<Route
  path="/chat"
  element={(
    <PrivateRoute>
      <Chat />
    </PrivateRoute>
  )}
/>
```

### Menu Navigation
**Fichier:** `frontend/src/components/Menu.js`

```javascript
import ChatIcon from '@mui/icons-material/Chat';

<li>
  <Link to="/chat" className={isActive('/chat') ? 'active' : ''}>
    <ChatIcon className="menu-icon" />
    <div>Chat</div>
  </Link>
</li>
```

## 📱 Utilisation

### Accès au Chat
1. Se connecter au jeu
2. Cliquer sur "Chat" dans le menu
3. Choisir entre Global ou Alliance (si membre d'une alliance)

### Envoyer un message
1. Taper dans l'input en bas
2. Appuyer sur Entrée ou cliquer sur "📤 Envoyer"
3. Le message apparaît immédiatement pour tous les joueurs du canal

### Éditer un message
1. Survoler son propre message
2. Cliquer sur l'icône "✎"
3. Modifier le texte et valider

### Supprimer un message
1. Survoler son propre message
2. Cliquer sur l'icône "🗑"
3. Confirmer la suppression

## 🎨 Personnalisation

### Modifier les couleurs
**Fichier:** `Chat.css`

```css
/* Couleur primaire (rouge) */
.chat-tab.active {
  background: linear-gradient(135deg, #e63946 0%, #d62828 100%);
}

/* Couleur secondaire (vert pour typing) */
.status-indicator.connected {
  color: #06ffa5;
}
```

### Ajouter des emojis/réactions
Modifier `ChatMessage.js` pour ajouter un système de réactions:

```javascript
// À implémenter
const handleReact = (emoji) => {
  socket.emit('chat:react', { messageId: message.id, emoji });
};
```

## 🔐 Sécurité

### Authentification
- ✅ JWT token requis pour toutes les opérations Socket.IO
- ✅ Vérification côté backend de l'identité de l'utilisateur
- ✅ Impossible de modifier/supprimer les messages des autres

### Validation
- ✅ Longueur max: 2000 caractères
- ✅ Messages vides rejetés
- ✅ Filtre anti-profanité côté backend (basique)

### Permissions
- **Global:** Tous les joueurs authentifiés
- **Alliance:** Membres de l'alliance uniquement
- **Édition/Suppression:** Auteur du message ou admin

## 🐛 Dépannage

### Le chat ne se connecte pas
1. Vérifier que le backend est lancé sur le port 5000
2. Ouvrir la console navigateur et chercher les erreurs Socket.IO
3. Vérifier que le JWT token est valide

```javascript
// Dans la console navigateur
localStorage.getItem('jwtToken')  // Doit retourner un token
```

### Les messages n'apparaissent pas
1. Vérifier la connexion Socket.IO (indicateur 🟢 Connecté)
2. Recharger la page
3. Vérifier les logs backend

### Erreur "Failed to fetch messages"
1. Vérifier que l'API backend `/api/v1/chat/messages` est accessible
2. Vérifier le token JWT
3. Regarder les logs backend pour plus de détails

## 📊 Performance

### Optimisations implémentées
- ✅ Pagination (50 messages par requête)
- ✅ Lazy loading des anciens messages
- ✅ Évite les doublons (check des IDs)
- ✅ Auto-scroll intelligent (seulement si en bas)
- ✅ Debounce sur l'indicateur de frappe (2s)

### Limites
- **Messages affichés:** Illimité en mémoire (scroll infini)
- **Messages par requête:** 50 (configurable)
- **Timeout typing:** 3 secondes
- **Reconnexion Socket.IO:** Automatique

## 🚀 Prochaines Étapes

### Messages Privés (TODO)
1. Créer `PrivateChat.js` pour les conversations 1-on-1
2. Ajouter une liste de contacts/joueurs
3. Gérer les notifications de MP non lus
4. Implémenter le backend `private` channel

### Fonctionnalités Avancées (Future)
- [ ] Réactions emoji aux messages
- [ ] Mentions (@username) avec notifications
- [ ] Pièces jointes (images)
- [ ] Rich text (markdown)
- [ ] Recherche de messages
- [ ] Historique exportable
- [ ] Messages épinglés
- [ ] Modération (mute, ban)

## 📝 API Backend Utilisée

### Endpoints HTTP
```
GET    /api/v1/chat/messages        - Récupérer messages (pagination)
POST   /api/v1/chat/messages        - Envoyer message (fallback)
PUT    /api/v1/chat/messages/:id    - Modifier message
DELETE /api/v1/chat/messages/:id    - Supprimer message
```

### Socket.IO Events
Voir documentation complète: `docs/CHAT_SYSTEM.md`

## 🎯 Tests Recommandés

1. **Test multi-utilisateurs:** Ouvrir 2 navigateurs différents et vérifier la synchronisation
2. **Test reconnexion:** Arrêter/redémarrer le backend, vérifier l'auto-reconnexion
3. **Test pagination:** Envoyer 100+ messages, vérifier le bouton "Charger plus"
4. **Test alliance:** Créer une alliance, vérifier que le chat alliance fonctionne
5. **Test mobile:** Vérifier le responsive sur petit écran

## 📚 Documentation Complémentaire

- Backend: `docs/CHAT_SYSTEM.md` (723 lignes)
- Architecture: `STRATEGIC_ROADMAP.md` (ligne 940)
- Socket.IO: https://socket.io/docs/v4/

---

**Développé le:** 13 décembre 2025  
**Version:** 1.0.0  
**Statut:** ✅ Production Ready  
**Compatibilité:** Backend Chat System v1.0.0
