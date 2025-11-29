# 🏗️ Architecture Terra Dominus

## Vue d'ensemble

Terra Dominus est une application full-stack utilisant Node.js/Express pour le backend et React pour le frontend. L'architecture suit les principes de Domain-Driven Design (DDD) avec une séparation claire des responsabilités.

## Stack technique

### Backend
- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **ORM** : Sequelize (PostgreSQL)
- **WebSocket** : Socket.IO
- **Jobs asynchrones** : BullMQ + Redis
- **Validation** : Zod
- **Logging** : Pino
- **Tests** : Jest

### Frontend
- **Framework** : React 17
- **State Management** : Redux Toolkit
- **HTTP Client** : Axios
- **WebSocket** : Socket.IO Client
- **Tests** : Jest + Playwright
- **Build** : Create React App

### Infrastructure
- **Base de données** : PostgreSQL 12+
- **Cache/Queue** : Redis 6+
- **Reverse Proxy** : Nginx (production)

---

## Architecture backend

### Structure modulaire (DDD)

Chaque module suit la structure Domain-Driven Design :

\`\`\`
modules/
└── [module-name]/
    ├── domain/          # Règles métier pures (logique de domaine)
    │   └── rules.js     # Fonctions pures, pas de dépendances externes
    │
    ├── application/     # Services applicatifs (use cases)
    │   └── Service.js   # Orchestration, transactions, logging
    │
    ├── infra/           # Infrastructure (accès données)
    │   └── Repository.js # Accès DB via Sequelize
    │
    └── api/             # Interface HTTP
        ├── controller.js # Validation, mapping req/res
        └── routes.js    # Définition des routes Express
\`\`\`

**Exemple concret : module Combat**

\`\`\`
modules/combat/
├── domain/
│   └── combatRules.js              # Calculs de combat, loot, pertes
├── application/
│   ├── CombatService.js            # launchAttack(), resolveAttack()
│   └── __tests__/
│       └── CombatService.test.js
├── infra/
│   ├── CombatRepository.js         # CRUD attacks, reports
│   └── BattleReportRepository.js
└── api/
    ├── combatController.js         # Handlers HTTP
    └── combatRoutes.js             # POST /attack, GET /attacks, etc.
\`\`\`

### Dependency Injection (DI)

Le container (`backend/container.js`) gère l'instanciation et l'injection des dépendances :

\`\`\`javascript
// Enregistrement
container.register('combatRepository', () => new CombatRepository());
container.register('combatService', (c) => 
  new CombatService({ 
    combatRepository: c.resolve('combatRepository') 
  })
);

// Résolution
const combatService = container.resolve('combatService');
\`\`\`

**Avantages** :
- Facilite les tests unitaires (mocking)
- Découplage entre modules
- Gestion centralisée des dépendances

### Layers & responsabilités

\`\`\`
┌─────────────────────────────────────────────┐
│  HTTP Request (Express Router)              │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────▼───────────┐
         │   Controller       │ ← Validation (Zod), mapping
         │   - authMiddleware │
         │   - rateLimiter    │
         └────────┬───────────┘
                  │
         ┌────────▼───────────┐
         │   Service          │ ← Business logic, transactions
         │   - orchestration  │
         │   - logging        │
         └────────┬───────────┘
                  │
         ┌────────▼───────────┐
         │   Repository       │ ← Data access (Sequelize)
         │   - CRUD ops       │
         └────────┬───────────┘
                  │
         ┌────────▼───────────┐
         │   Database         │ ← PostgreSQL
         │   (Sequelize ORM)  │
         └────────────────────┘
\`\`\`

---

## Flux de données

### 1. Requête HTTP standard

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Middleware
    participant Controller
    participant Service
    participant Repository
    participant DB

    Client->>Express: POST /api/v1/combat/attack
    Express->>Middleware: authMiddleware
    Middleware->>Middleware: Verify JWT
    Middleware->>Controller: req.user populated
    Controller->>Controller: Validate request (Zod)
    Controller->>Service: launchAttack(userId, attackData)
    Service->>Repository: getCity(cityId)
    Repository->>DB: SELECT * FROM cities WHERE id=?
    DB-->>Repository: City data
    Repository-->>Service: City object
    Service->>Service: Business logic checks
    Service->>Repository: createAttack(attackData)
    Repository->>DB: INSERT INTO attacks
    DB-->>Repository: Attack created
    Repository-->>Service: Attack object
    Service->>Service: Log event
    Service-->>Controller: Attack response
    Controller-->>Client: 201 Created + JSON
\`\`\`

### 2. Communication WebSocket (Socket.IO)

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant SocketIO
    participant Server
    participant Service

    Client->>SocketIO: connect (avec JWT)
    SocketIO->>Server: connection event
    Server->>Server: Verify JWT
    Server->>Server: socket.join(`user_${userId}`)
    
    Note over Server: Événement déclenché (ex: attack completed)
    
    Service->>SocketIO: io.to(`user_${userId}`).emit('attack_victory')
    SocketIO->>Client: 'attack_victory' event
    Client->>Client: Update UI (Redux dispatch)
\`\`\`

### 3. Jobs asynchrones (BullMQ)

\`\`\`mermaid
sequenceDiagram
    participant API
    participant Queue
    participant Worker
    participant DB
    participant Socket

    API->>Queue: add('resolve-attack', { attackId })
    Queue-->>API: Job queued
    
    Note over Queue,Worker: Job scheduled (arrivalTime)
    
    Worker->>Queue: fetch job
    Worker->>DB: Load attack + units
    Worker->>Worker: Simulate combat
    Worker->>DB: Update attack + create report
    Worker->>Socket: Emit notifications
    Socket-->>Client: Real-time update
\`\`\`

---

## Patterns architecturaux

### 1. Repository Pattern

Abstraction de l'accès aux données :

\`\`\`javascript
class CombatRepository {
  async createAttack(attackData) {
    return Attack.create(attackData);
  }
  
  async getAttackById(id, options = {}) {
    return Attack.findByPk(id, {
      include: [{ model: AttackWave }, { model: User }],
      ...options
    });
  }
}
\`\`\`

**Avantages** :
- Changement de DB facile
- Tests unitaires simplifiés
- Cache centralisé possible

### 2. Transaction Provider

Gestion des transactions Sequelize injectée :

\`\`\`javascript
async launchAttack(userId, attackData) {
  return this.transactionProvider(async (transaction) => {
    const city = await this.cityRepository.getCity(id, { transaction });
    const resources = await this.resourceRepository.get(cityId, { 
      transaction, 
      lock: transaction.LOCK.UPDATE 
    });
    
    // Déduction ressources + unités
    await this.resourceRepository.update(resources, { transaction });
    
    // Création attaque
    const attack = await this.combatRepository.create(data, { transaction });
    
    return attack;
  });
}
\`\`\`

**Avantages** :
- ACID garanti
- Rollback automatique en cas d'erreur
- Locks optimistes/pessimistes

### 3. Optimistic Locking

Évite les conditions de course sans locks pessimistes :

\`\`\`javascript
// Modèle avec version
const Building = sequelize.define('Building', {
  level: DataTypes.INTEGER,
  version: DataTypes.INTEGER
});

// Update avec vérification de version
const [affectedRows] = await Building.update(
  { level: 5, version: building.version + 1 },
  { where: { id: building.id, version: building.version } }
);

if (affectedRows === 0) {
  throw new Error('Conflict: building was modified');
}
\`\`\`

### 4. Event-Driven avec Socket.IO

Notifications temps réel découplées :

\`\`\`javascript
// Service émet des événements
class NotificationService {
  sendToUser(userId, eventName, data) {
    const io = getIO();
    io.to(\`user_\${userId}\`).emit(eventName, {
      type: eventName,
      data,
      timestamp: new Date()
    });
  }
}

// Utilisation
notificationService.sendToUser(defenderId, 'attack_incoming', {
  attackId: 123,
  attackerName: 'Player1',
  arrivalTime: '2025-11-29T15:00:00Z'
});
\`\`\`

---

## Architecture frontend

### Structure React

\`\`\`
src/
├── components/        # Composants UI réutilisables
│   ├── WorldMap.js
│   ├── CombatPanel.js
│   └── ui/           # Composants de base (Button, Alert, etc.)
│
├── pages/            # Pages de l'application
│   ├── Home.js
│   └── Dashboard.js
│
├── redux/            # State management
│   ├── store.js
│   ├── authSlice.js
│   └── dashboardSlice.js
│
├── hooks/            # Custom hooks
│   ├── useDashboardData.js
│   └── useAsyncError.js
│
├── api/              # Clients API
│   ├── combat.js
│   ├── world.js
│   └── trade.js
│
├── utils/            # Utilitaires
│   ├── axiosInstance.js  # HTTP client avec cache
│   ├── socket.js         # Socket.IO client
│   └── logger.js         # Logger structuré
│
└── App.js            # Composant racine + routing
\`\`\`

### Redux Toolkit

Gestion d'état centralisée avec Redux Toolkit :

\`\`\`javascript
// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
      });
  }
});

// Thunk async
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  }
);
\`\`\`

### Cache HTTP intelligent

Cache automatique des requêtes GET avec invalidation :

\`\`\`javascript
// GET requests sont mises en cache
const response = await axiosInstance.get('/combat/attacks', {
  useCache: true,
  cacheTtl: 30000 // 30s
});

// POST/PUT/DELETE invalident le cache
await axiosInstance.post('/combat/attack', attackData);
// → Cache GET automatiquement vidé
\`\`\`

---

## Observabilité

### Logging structuré (Pino)

\`\`\`javascript
const logger = getLogger({ module: 'CombatService' });

logger.info({ userId, attackId }, 'Attack launched');
logger.error({ err: error }, 'Database query failed');

// Log includes:
// - timestamp
// - level
// - module
// - traceId (propagé depuis x-trace-id header)
// - userId (si authentifié)
// - message + context
\`\`\`

### Trace propagation

\`\`\`javascript
// Middleware génère/propage traceId
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || generateTraceId();
  res.setHeader('x-trace-id', req.traceId);
  next();
});

// Utilisé dans AsyncLocalStorage pour contexte
runWithContext({ traceId, userId }, async () => {
  logger.info('Processing request'); // Inclut automatiquement traceId
});
\`\`\`

### Métriques Prometheus

\`\`\`javascript
const { Counter, Histogram } = require('prom-client');

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route']
});

// Exposition
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
\`\`\`

---

## Sécurité

### Authentification JWT

\`\`\`javascript
// Génération
const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '2h' });

// Vérification (middleware)
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = await User.findByPk(decoded.id);
  next();
};
\`\`\`

### Rate limiting granulaire

\`\`\`javascript
const { strictLimiter } = require('./middleware/rateLimiters');

// Actions critiques : 5 req/min
router.post('/attack', strictLimiter, protect, controller.launchAttack);

// Lectures : 30 req/min
router.get('/attacks', moderateLimiter, protect, controller.getAttacks);
\`\`\`

### Validation Zod

\`\`\`javascript
const launchAttackSchema = z.object({
  body: z.object({
    fromCityId: z.number().int().positive(),
    toCityId: z.number().int().positive(),
    attackType: z.enum(['raid', 'conquest', 'siege']),
    units: z.array(z.object({
      entityId: z.number().int().positive(),
      quantity: z.number().int().positive()
    })).min(1)
  })
});

router.post('/attack', validate(launchAttackSchema), controller.launchAttack);
\`\`\`

---

## Scalabilité

### Horizontal scaling

- **Backend** : Stateless, peut être déployé en multiple instances derrière load balancer
- **Redis** : Partagé entre instances pour queues + cache
- **PostgreSQL** : Réplication read-only pour queries lourdes
- **Socket.IO** : Redis adapter pour communication inter-instances

### Workers séparés

\`\`\`
Instance 1 (API)      Instance 2 (API)      Workers (dédiés)
       │                    │                      │
       └────────────┬───────┘                      │
                    │                              │
              ┌─────▼─────┐                  ┌─────▼─────┐
              │   Redis   │◄─────────────────┤  BullMQ   │
              │  (Queue)  │                  │  Workers  │
              └───────────┘                  └───────────┘
\`\`\`

---

## Évolutions futures

### Court terme
- Migration TypeScript (types + sécurité)
- Cache Redis côté serveur (queries fréquentes)
- Tests d'intégration API complets

### Moyen terme
- CQRS (séparation Read/Write)
- Event Bus (découplage notifications)
- Monitoring Grafana + Alertmanager

### Long terme
- Microservices (combat, world, trade)
- Kubernetes orchestration
- GraphQL pour flexibilité frontend

---

**Documentation maintenue par l'équipe Terra Dominus**
*Dernière mise à jour : Novembre 2025*
