# 🚀 Guide d'Activation des Améliorations

## Vue d'ensemble

Ce guide vous accompagne pas à pas pour activer toutes les améliorations implémentées dans Terra Dominus.

---

## ✅ Checklist Complète

### Phase 1 : Installation des dépendances (15 min)

#### Backend

```powershell
cd backend

# Installer les dépendances manquantes
npm install ioredis swagger-ui-express swagger-jsdoc --save

# Installer les dépendances de dev
npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin supertest --save-dev
```

#### Frontend

```powershell
cd frontend

# Pas de dépendances manquantes requises
# Les hooks et logger utilisent uniquement React et des APIs natives
```

---

### Phase 2 : Configuration des variables d'environnement (10 min)

#### Backend

```powershell
cd backend

# Si .env n'existe pas encore
cp .env.example .env

# Éditer .env et vérifier ces variables critiques:
# - DATABASE_URL (PostgreSQL)
# - JWT_SECRET (générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - REDIS_URL (pour TokenService et BullMQ)
```

#### Frontend

```powershell
cd frontend

# Si .env n'existe pas encore
cp .env.example .env

# Les valeurs par défaut devraient fonctionner en développement local
```

---

### Phase 3 : Activer TokenService avec Blacklist (20 min)

#### 1. Vérifier que Redis est démarré

```powershell
# Tester la connexion Redis
redis-cli ping
# Devrait retourner: PONG
```

#### 2. Modifier authMiddleware.js

**Fichier** : `backend/middleware/authMiddleware.js`

```javascript
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { getLogger } = require('../utils/logger');
const { getJwtSecret } = require('../config/jwtConfig');
const { getTokenService } = require('../services/TokenService'); // AJOUTER

const logger = getLogger({ module: 'AuthMiddleware' });
const JWT_SECRET = getJwtSecret();
const tokenService = getTokenService(); // AJOUTER

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // AJOUTER: Vérifier blacklist
      if (await tokenService.isTokenBlacklisted(token)) {
        return res.status(401).json({ message: 'Token révoqué' });
      }
      
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findByPk(decoded.id);

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      // AJOUTER: Vérifier révocation globale utilisateur
      if (!(await tokenService.isTokenValidForUser(decoded))) {
        return res.status(401).json({ message: 'Token invalidé par révocation globale' });
      }

      next();
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'JWT validation failed');
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
});

module.exports = { protect };
```

#### 3. Ajouter endpoint de logout

**Fichier** : `backend/modules/auth/api/authRoutes.js` (ou similaire)

```javascript
const { getTokenService } = require('../../../services/TokenService');

// Ajouter cette route
router.post('/logout', protect, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const tokenService = getTokenService();
    
    await tokenService.revokeToken(token);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Logout failed');
    res.status(500).json({ message: 'Logout failed' });
  }
});
```

#### 4. Tester

```powershell
# Démarrer le backend
cd backend
npm start

# Dans un autre terminal, tester
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Phase 4 : Activer Rate Limiting Granulaire (30 min)

#### Appliquer aux routes critiques

**Exemple : Combat Routes**

**Fichier** : `backend/modules/combat/api/combatRoutes.js`

```javascript
const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const { strictLimiter, moderateLimiter } = require('../../../middleware/rateLimiters'); // AJOUTER

function createCombatRouter(container) {
  const router = Router();
  const controller = container.resolve('combatController');

  // Actions critiques → strictLimiter (5 req/min)
  router.post('/attack', strictLimiter, protect, controller.launchAttack);
  router.post('/spy', strictLimiter, protect, controller.launchSpyMission);
  router.post('/attack/:id/cancel', strictLimiter, protect, controller.cancelAttack);

  // Lectures → moderateLimiter (30 req/min)
  router.get('/attacks', moderateLimiter, protect, controller.getAttacks);
  router.get('/spy-missions', moderateLimiter, protect, controller.getSpyMissions);
  router.get('/report/:attackId', moderateLimiter, protect, controller.getReport);

  return router;
}

module.exports = createCombatRouter;
```

**À répéter pour** :
- `backend/modules/colonization/api/colonizationRoutes.js` → strictLimiter sur `/start`
- `backend/modules/trade/api/tradeRoutes.js` → strictLimiter sur `/routes` POST
- `backend/modules/auth/api/authRoutes.js` → authLimiter sur `/login` et `/register`
- `backend/modules/buildings/api/buildingRoutes.js` → flexibleLimiter sur `/upgrade`

---

### Phase 5 : Activer Validation Zod (20 min)

#### 1. Vérifier le middleware validate

**Fichier** : `backend/middleware/validate.js`

Si absent, créer :

```javascript
const { z } = require('zod');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'Validation' });

/**
 * Middleware de validation Zod
 */
function validate(schema) {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn({ errors: error.errors, path: req.path }, 'Validation failed');
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Données invalides',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

module.exports = { validate };
```

#### 2. Appliquer aux routes

**Exemple : Combat**

```javascript
const { validate } = require('../../../middleware/validate');
const { 
  launchAttackSchema, 
  cancelAttackSchema,
  getAttacksSchema 
} = require('../../../validation/combatSchemas');

router.post('/attack', 
  validate(launchAttackSchema),
  strictLimiter, 
  protect, 
  controller.launchAttack
);

router.get('/attacks',
  validate(getAttacksSchema),
  moderateLimiter,
  protect,
  controller.getAttacks
);
```

---

### Phase 6 : Activer Swagger UI (15 min)

#### 1. Monter Swagger dans app.js

**Fichier** : `backend/app.js`

```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');

const createApp = (container) => {
  const app = express();

  // ... middlewares existants

  // AJOUTER après les middlewares de base
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Terra Dominus API'
  }));

  // ... routes API
  
  return app;
};
```

#### 2. Accéder à la documentation

```
http://localhost:5000/api-docs
```

#### 3. Ajouter des annotations (optionnel mais recommandé)

**Exemple : Combat Controller**

```javascript
/**
 * @openapi
 * /combat/attack:
 *   post:
 *     summary: Lancer une attaque territoriale
 *     tags: [Combat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromCityId
 *               - toCityId
 *               - attackType
 *               - units
 *             properties:
 *               fromCityId:
 *                 type: integer
 *                 example: 1
 *               toCityId:
 *                 type: integer
 *                 example: 2
 *               attackType:
 *                 type: string
 *                 enum: [raid, conquest, siege]
 *                 example: raid
 *               units:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     entityId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Attaque lancée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attack'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
async launchAttack(req, res) {
  // ...
}
```

---

### Phase 7 : Migrer Frontend vers Nouveaux Utilitaires (30 min)

#### 1. Remplacer console.* dans les composants

**Avant** :
```javascript
console.error('Error loading data:', error);
```

**Après** :
```javascript
import { getLogger } from '../utils/logger';
const logger = getLogger('WorldMap');

logger.error('Error loading data', error);
```

#### 2. Utiliser useAsyncError dans les composants

**Exemple : WorldMap.js**

```javascript
import { useAsyncError } from '../hooks/useAsyncError';
import { getVisibleWorld } from '../api/world';

function WorldMap() {
  const { error, loading, catchError, clearError } = useAsyncError('WorldMap');
  const [worldData, setWorldData] = useState(null);

  const loadWorldData = async () => {
    const data = await catchError(
      () => getVisibleWorld(),
      { toast: true, logError: true }
    );
    
    if (data) {
      setWorldData(data);
    }
  };

  useEffect(() => {
    loadWorldData();
  }, []);

  return (
    <div>
      {loading && <Spinner />}
      {error && <Alert message={error} onClose={clearError} />}
      {worldData && <Canvas data={worldData} />}
    </div>
  );
}
```

---

### Phase 8 : Lancer les Tests (10 min)

```powershell
# Backend - Tests unitaires
cd backend
npm test

# Si erreurs, installer les dépendances manquantes
npm install --save-dev @types/jest

# Frontend - Tests
cd frontend
npm run test:unit

# Tests e2e (si Playwright configuré)
npx playwright install --with-deps
npm run test:e2e
```

---

### Phase 9 : Vérification Finale (15 min)

#### Checklist de vérification

```powershell
# 1. Backend démarre sans erreur
cd backend
npm start
# Vérifier logs : "Server running on port 5000"

# 2. Worker démarre sans erreur
cd backend
npm run worker
# Vérifier logs : "[ColonizationWorker] Worker démarré"

# 3. Redis est connecté
# Vérifier logs backend : "Redis connected for TokenService"

# 4. Swagger accessible
# Ouvrir : http://localhost:5000/api-docs

# 5. Frontend démarre
cd frontend
npm start
# Ouvrir : http://localhost:3000

# 6. Tests passent
cd backend
npm test
cd ../frontend
npm run test:unit
```

---

## 🎯 Résumé des Bénéfices Activés

### ✅ Sécurité
- [x] Révocation de tokens JWT (TokenService + Redis)
- [x] Rate limiting granulaire (5 niveaux)
- [x] Validation stricte des entrées (Zod)

### ✅ Développement
- [x] Logging structuré (backend + frontend)
- [x] Documentation API interactive (Swagger)
- [x] Tests unitaires (CombatService)
- [x] Guide de contribution (CONTRIBUTING.md)

### ✅ Production
- [x] Gestion d'erreur cohérente (useAsyncError)
- [x] Variables d'environnement documentées
- [x] Architecture documentée (ARCHITECTURE.md)

---

## 🚨 Troubleshooting

### Redis ne se connecte pas
```powershell
# Vérifier que Redis est installé et démarré
redis-cli ping

# Si pas installé sous Windows:
# Option 1: WSL2 + Redis
wsl -d Ubuntu
sudo service redis-server start

# Option 2: Redis Windows (Memurai)
# Télécharger depuis https://www.memurai.com/
```

### Swagger ne s'affiche pas
```powershell
# Vérifier que les dépendances sont installées
npm list swagger-ui-express swagger-jsdoc

# Vérifier les logs backend au démarrage
# Si erreur "Cannot find module", réinstaller :
npm install swagger-ui-express swagger-jsdoc --save
```

### Tests échouent
```powershell
# Backend : vérifier que les mocks sont corrects
cd backend
npm test -- --verbose

# Frontend : vérifier que les dépendances de test sont installées
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Rate limit trop strict en développement
```javascript
// backend/middleware/rateLimiters.js
// Augmenter temporairement les limites en dev

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // 100 en dev
  // ...
});
```

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (si existant)
2. Vérifiez les [Issues GitHub](https://github.com/MacMuffin76/terra-dominus/issues)
3. Créez une nouvelle issue avec :
   - Version Node.js (`node -v`)
   - Version PostgreSQL (`psql --version`)
   - Logs d'erreur complets
   - Steps pour reproduire

---

## ✅ Validation Complète

Une fois toutes les phases complétées, vous devriez avoir :

1. ✅ Backend démarré sur http://localhost:5000
2. ✅ Worker en cours d'exécution
3. ✅ Frontend accessible sur http://localhost:3000
4. ✅ Swagger UI sur http://localhost:5000/api-docs
5. ✅ Tests passant (backend + frontend)
6. ✅ Rate limiting actif sur les routes critiques
7. ✅ Validation Zod sur tous les endpoints
8. ✅ TokenService avec blacklist Redis fonctionnel
9. ✅ Logging structuré sans console.*
10. ✅ Documentation complète accessible

**Félicitations ! Toutes les améliorations sont maintenant actives. 🎉**

---

*Guide d'activation créé le 29 novembre 2025*
*Temps estimé d'activation complète : 2-3 heures*
