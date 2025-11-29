# 🤝 Guide de contribution - Terra Dominus

Merci de votre intérêt pour contribuer à Terra Dominus ! Ce guide vous aidera à comprendre notre workflow de développement et nos standards.

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Setup environnement local](#setup-environnement-local)
- [Architecture du projet](#architecture-du-projet)
- [Standards de code](#standards-de-code)
- [Process de Pull Request](#process-de-pull-request)
- [Tests](#tests)
- [Documentation](#documentation)

---

## 🤝 Code de conduite

Nous nous engageons à créer un environnement accueillant et inclusif. Soyez respectueux, constructif et professionnel dans toutes vos interactions.

---

## 💡 Comment contribuer

### Types de contributions recherchées

- 🐛 **Bug fixes** : Correction de bugs identifiés dans les issues
- ✨ **Features** : Nouvelles fonctionnalités gameplay ou techniques
- 📚 **Documentation** : Amélioration de la documentation existante
- 🧪 **Tests** : Ajout ou amélioration de la couverture de tests
- ⚡ **Performance** : Optimisations et améliorations de performance
- ♿ **Accessibilité** : Améliorations d'accessibilité frontend

### Avant de commencer

1. **Vérifiez les issues existantes** : Cherchez si quelqu'un travaille déjà dessus
2. **Créez une issue** : Si votre contribution est significative, créez d'abord une issue pour discussion
3. **Demandez l'assignation** : Commentez l'issue pour signaler que vous travaillez dessus

---

## 🛠️ Setup environnement local

### Prérequis

- **Node.js** v18+ et npm
- **PostgreSQL** 12+
- **Redis** 6+ (pour les workers et TokenService)
- **Git**

### Installation

```powershell
# 1. Fork et clone le repo
git clone https://github.com/VOTRE_USERNAME/terra-dominus.git
cd terra-dominus

# 2. Backend setup
cd backend
npm install
cp .env.example .env  # Créer ce fichier si absent
# Éditer .env avec vos credentials

# 3. Database initialization
psql -U postgres -c "CREATE DATABASE terra_dominus_dev;"
psql -U postgres -d terra_dominus_dev -f ../init_terra_dominus.sql

# 4. Frontend setup
cd ../frontend
npm install

# 5. Démarrer l'environnement de dev
# Terminal 1 : Backend
cd backend
npm run start

# Terminal 2 : Worker
cd backend
npm run worker

# Terminal 3 : Frontend
cd frontend
npm run start
```

### Variables d'environnement essentielles

**Backend (.env)**
```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/terra_dominus_dev

# JWT
JWT_SECRET=votre_secret_dev_long_et_securise

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Ports
PORT=5000

# Logging
LOG_LEVEL=debug
DB_LOGGING=true
```

**Frontend (.env)**
```env
REACT_APP_API_URL=/api/v1
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_LOG_LEVEL=debug
```

---

## 🏗️ Architecture du projet

### Structure backend

```
backend/
├── modules/              # Modules fonctionnels (DDD)
│   ├── combat/
│   │   ├── domain/      # Règles métier pures
│   │   ├── application/ # Services (logique applicative)
│   │   ├── infra/       # Repositories (accès données)
│   │   └── api/         # Controllers & Routes
│   ├── colonization/
│   ├── trade/
│   └── world/
├── models/              # Modèles Sequelize
├── services/            # Services transverses (TokenService, etc.)
├── middleware/          # Middlewares Express
├── utils/               # Utilitaires (logger, etc.)
├── jobs/                # Workers BullMQ
├── validation/          # Schémas de validation Zod
└── container.js         # Dependency Injection
```

### Structure frontend

```
frontend/src/
├── components/          # Composants React
├── hooks/               # Custom hooks
├── redux/               # State management (Redux Toolkit)
├── api/                 # Clients API
├── utils/               # Utilitaires (logger, axiosInstance, etc.)
├── pages/               # Pages de l'application
└── App.js               # Composant racine
```

### Patterns utilisés

- **Backend** : Domain-Driven Design (DDD), Repository Pattern, Dependency Injection
- **Frontend** : Component-based architecture, Redux Toolkit, Custom Hooks
- **Communication** : REST API + WebSocket (Socket.IO)
- **Async Jobs** : BullMQ + Redis

---

## 📏 Standards de code

### Conventions générales

#### Commits : Conventional Commits

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (pas de changement de logique)
- `refactor`: Refactorisation
- `test`: Ajout/modification de tests
- `chore`: Tâches de maintenance (deps, config, etc.)

**Exemples** :
```
feat(combat): add spy mission sabotage type
fix(colonization): correct travel time calculation
docs(readme): update installation steps
test(combat): add unit tests for CombatService
```

#### Branches

- `main` : Branche de production
- `develop` : Branche de développement (si utilisée)
- `feature/nom-feature` : Nouvelles fonctionnalités
- `bugfix/nom-bug` : Corrections de bugs
- `hotfix/nom-fix` : Fixes urgents en production

### JavaScript / Node.js

#### Code Style

```javascript
// ✅ BON
async function calculateDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// ❌ MAUVAIS
function calculateDistance(x1,y1,x2,y2){
  return Math.abs(x1-x2)+Math.abs(y1-y2)
}
```

#### Naming

- **Fichiers** : camelCase pour les fichiers de service, PascalCase pour les classes/composants
- **Variables/Fonctions** : camelCase
- **Classes** : PascalCase
- **Constantes** : SCREAMING_SNAKE_CASE
- **Privé** : Préfixer avec `_` (convention)

```javascript
// Classes et constructeurs
class CombatService { }
const MyComponent = () => { };

// Fonctions et variables
const calculateLoot = () => { };
const userId = 123;

// Constantes
const MAX_CITIES = 20;
const DEFAULT_VISION_RANGE = 5;
```

#### Async/Await

Toujours utiliser `async/await` plutôt que `.then()/.catch()`

```javascript
// ✅ BON
async function getUserCities(userId) {
  try {
    const cities = await City.findAll({ where: { userId } });
    return cities;
  } catch (error) {
    logger.error({ err: error }, 'Error fetching cities');
    throw error;
  }
}

// ❌ MAUVAIS
function getUserCities(userId) {
  return City.findAll({ where: { userId } })
    .then(cities => cities)
    .catch(error => {
      console.error('Error:', error);
      throw error;
    });
}
```

#### Logging

**JAMAIS de console.log/console.error** : Utiliser le logger structuré

```javascript
// Backend
const { getLogger } = require('./utils/logger');
const logger = getLogger({ module: 'MonService' });

logger.info('User logged in', { userId: 123 });
logger.error({ err: error }, 'Database query failed');

// Frontend
import { getLogger } from './utils/logger';
const logger = getLogger('MonComposant');

logger.info('Component mounted');
logger.error('API call failed', error);
```

#### JSDoc

Tous les services et fonctions publiques doivent avoir une JSDoc

```javascript
/**
 * Lance une attaque entre deux villes
 * @param {number} userId - ID de l'utilisateur attaquant
 * @param {Object} attackData - Données de l'attaque
 * @param {number} attackData.fromCityId - ID ville d'origine
 * @param {number} attackData.toCityId - ID ville cible
 * @param {string} attackData.attackType - Type: 'raid', 'conquest', 'siege'
 * @param {Array<Object>} attackData.units - Unités à envoyer
 * @returns {Promise<Attack>} L'attaque créée
 * @throws {Error} Si ressources/unités insuffisantes (status 400)
 */
async launchAttack(userId, attackData) {
  // ...
}
```

### React / Frontend

#### Composants fonctionnels

Toujours utiliser des composants fonctionnels avec hooks

```javascript
// ✅ BON
import React, { useState, useEffect } from 'react';

function MyComponent({ userId }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    loadData();
  }, [userId]);
  
  return <div>{data}</div>;
}

export default MyComponent;
```

#### Custom Hooks

Préfixer les hooks personnalisés avec `use`

```javascript
// hooks/useCombatData.js
export function useCombatData(userId) {
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ...
  
  return { attacks, loading, refetch };
}
```

#### Gestion d'erreur

Utiliser le hook `useAsyncError` pour une gestion cohérente

```javascript
import { useAsyncError } from '../hooks/useAsyncError';

function MyComponent() {
  const { error, loading, catchError, clearError } = useAsyncError('MyComponent');
  
  const handleSubmit = async () => {
    await catchError(
      () => api.submitData(data),
      { toast: true, redirect: true }
    );
  };
  
  return (
    <>
      {error && <Alert message={error} onClose={clearError} />}
      {loading && <Spinner />}
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

---

## 🔄 Process de Pull Request

### Checklist avant de soumettre

- [ ] Code compilé sans erreur
- [ ] Tests passent (`npm test` backend ET frontend)
- [ ] Linting OK (`npm run lint` si disponible)
- [ ] Pas de `console.log` dans le code
- [ ] JSDoc ajoutée sur les nouvelles fonctions publiques
- [ ] Migration DB créée si nécessaire
- [ ] Validation Zod ajoutée sur nouveaux endpoints
- [ ] README/docs mis à jour si feature visible utilisateur
- [ ] Commit messages suivent Conventional Commits

### Créer une Pull Request

1. **Poussez votre branche** :
```powershell
git push origin feature/ma-feature
```

2. **Ouvrez une PR sur GitHub** avec :
   - Titre clair décrivant le changement
   - Description détaillée :
     - Contexte et motivation
     - Changements effectués
     - Screenshots si UI
     - Breaking changes (si applicable)
   - Référence l'issue liée (`Fixes #123`)

3. **Attendez la review** :
   - Répondez aux commentaires
   - Effectuez les modifications demandées
   - Demandez une re-review si nécessaire

### Template de PR

```markdown
## Description
Brève description du changement

Fixes #(issue)

## Type de changement
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Tests effectués
Décrivez les tests que vous avez réalisés

## Checklist
- [ ] Tests passent
- [ ] Documentation mise à jour
- [ ] Pas de console.log
- [ ] JSDoc ajoutée
- [ ] Migration DB créée (si applicable)
```

---

## 🧪 Tests

### Philosophy

- **Couverture minimale** : 70% sur les services critiques
- **Tests unitaires** : Services, repositories, règles métier
- **Tests d'intégration** : Endpoints API
- **Tests e2e** : Flows utilisateur critiques

### Backend - Tests unitaires

```javascript
// backend/modules/combat/application/__tests__/CombatService.test.js
describe('CombatService', () => {
  let combatService;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      createAttack: jest.fn(),
      getAttackById: jest.fn()
    };
    
    combatService = new CombatService({ 
      combatRepository: mockRepository 
    });
  });

  describe('launchAttack', () => {
    it('should reject if insufficient units', async () => {
      // Setup mocks
      mockRepository.getAttackById.mockResolvedValue(null);
      
      // Test
      await expect(
        combatService.launchAttack(1, { units: [] })
      ).rejects.toThrow('Unités insuffisantes');
    });
  });
});
```

### Backend - Tests d'intégration

```javascript
// backend/__tests__/integration/combat.api.test.js
const request = require('supertest');
const app = require('../app');

describe('Combat API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Setup DB de test + authentification
    authToken = await getTestAuthToken();
  });

  describe('POST /api/v1/combat/attack', () => {
    it('should create attack', async () => {
      const res = await request(app)
        .post('/api/v1/combat/attack')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromCityId: 1,
          toCityId: 2,
          attackType: 'raid',
          units: [{ entityId: 1, quantity: 10 }]
        });
      
      expect(res.status).toBe(201);
      expect(res.body.attack).toHaveProperty('id');
    });
  });
});
```

### Frontend - Tests unitaires

```javascript
// frontend/src/components/__tests__/CombatPanel.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import CombatPanel from '../CombatPanel';

describe('CombatPanel', () => {
  it('should display attacks list', () => {
    const attacks = [{ id: 1, status: 'traveling' }];
    
    render(<CombatPanel attacks={attacks} />);
    
    expect(screen.getByText(/traveling/i)).toBeInTheDocument();
  });
});
```

### Frontend - Tests e2e (Playwright)

```javascript
// frontend/e2e/combat.spec.js
import { test, expect } from '@playwright/test';

test.describe('Combat Flow', () => {
  test('complete attack launch', async ({ page }) => {
    await page.goto('/login');
    await loginAsTestUser(page);
    
    await page.goto('/combat');
    await page.click('button[data-test="new-attack"]');
    
    await page.selectOption('[name="attackType"]', 'raid');
    await page.fill('[name="targetCityId"]', '123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.toast')).toContainText('Attaque lancée');
  });
});
```

### Lancer les tests

```powershell
# Backend
cd backend
npm test                    # Tous les tests
npm test CombatService      # Test spécifique

# Frontend
cd frontend
npm run test:unit           # Tests unitaires
npm run test:e2e            # Tests Playwright
```

---

## 📚 Documentation

### README

Mettez à jour le README si :
- Vous ajoutez une nouvelle feature visible utilisateur
- Vous changez le process d'installation
- Vous ajoutez des dépendances système

### API Documentation

Pour chaque nouvel endpoint, ajouter une annotation Swagger :

```javascript
/**
 * @openapi
 * /combat/attack:
 *   post:
 *     summary: Lancer une attaque
 *     tags: [Combat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromCityId:
 *                 type: integer
 *               toCityId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Attaque créée
 */
router.post('/attack', protect, combatController.launchAttack);
```

### Code Comments

- Commentaires pour expliquer le **pourquoi**, pas le **quoi**
- Commentaires en français OK
- JSDoc en anglais préféré pour l'interopérabilité

```javascript
// ✅ BON : Explique la logique métier
// On calcule le bonus de défense basé sur le niveau des murs
// Formule : +5% par niveau, max 50% à niveau 10
const wallsBonus = Math.min(wallsLevel * 0.05, 0.5);

// ❌ MAUVAIS : Répète le code
// Multiplier par 0.05
const wallsBonus = wallsLevel * 0.05;
```

---

## 🎯 Ajouter un nouveau module

### Template complet

Exemple pour ajouter un module "diplomacy" :

```
backend/modules/diplomacy/
├── domain/
│   └── diplomacyRules.js        # Règles métier pures
├── application/
│   ├── DiplomacyService.js      # Logique applicative
│   └── __tests__/
│       └── DiplomacyService.test.js
├── infra/
│   └── DiplomacyRepository.js   # Accès données
└── api/
    ├── diplomacyController.js   # Controller HTTP
    └── diplomacyRoutes.js       # Routes Express
```

### Étapes

1. **Créer les modèles Sequelize**
```javascript
// backend/models/Alliance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Alliance = sequelize.define('Alliance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  leaderId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Alliance;
```

2. **Créer le Repository**
```javascript
// backend/modules/diplomacy/infra/DiplomacyRepository.js
class DiplomacyRepository {
  async createAlliance(data) {
    return Alliance.create(data);
  }
  
  async getAllianceById(id) {
    return Alliance.findByPk(id);
  }
}

module.exports = DiplomacyRepository;
```

3. **Créer le Service**
```javascript
// backend/modules/diplomacy/application/DiplomacyService.js
const { getLogger } = require('../../../utils/logger');
const logger = getLogger({ module: 'DiplomacyService' });

class DiplomacyService {
  constructor({ diplomacyRepository }) {
    this.diplomacyRepository = diplomacyRepository;
  }
  
  async createAlliance(userId, allianceData) {
    logger.info({ userId }, 'Creating alliance');
    return this.diplomacyRepository.createAlliance(allianceData);
  }
}

module.exports = DiplomacyService;
```

4. **Créer le Controller**
```javascript
// backend/modules/diplomacy/api/diplomacyController.js
const asyncHandler = require('express-async-handler');

function createDiplomacyController({ diplomacyService }) {
  const createAlliance = asyncHandler(async (req, res) => {
    const alliance = await diplomacyService.createAlliance(
      req.user.id,
      req.body
    );
    res.status(201).json({ alliance });
  });
  
  return { createAlliance };
}

module.exports = createDiplomacyController;
```

5. **Créer les Routes**
```javascript
// backend/modules/diplomacy/api/diplomacyRoutes.js
const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const { strictLimiter } = require('../../../middleware/rateLimiters');

function createDiplomacyRouter(container) {
  const router = Router();
  const controller = container.resolve('diplomacyController');
  
  router.post('/alliances', protect, strictLimiter, controller.createAlliance);
  
  return router;
}

module.exports = createDiplomacyRouter;
```

6. **Enregistrer dans le Container**
```javascript
// backend/container.js
container.register('diplomacyRepository', () => {
  const DiplomacyRepository = require('./modules/diplomacy/infra/DiplomacyRepository');
  return new DiplomacyRepository();
});

container.register('diplomacyService', (c) => {
  const DiplomacyService = require('./modules/diplomacy/application/DiplomacyService');
  return new DiplomacyService({
    diplomacyRepository: c.resolve('diplomacyRepository')
  });
});

container.register('diplomacyController', (c) => {
  const createDiplomacyController = require('./modules/diplomacy/api/diplomacyController');
  return createDiplomacyController({
    diplomacyService: c.resolve('diplomacyService')
  });
});
```

7. **Monter les Routes**
```javascript
// backend/api/index.js
const createDiplomacyRouter = require('../modules/diplomacy/api/diplomacyRoutes');

const createApiRouter = (container) => {
  const router = Router();
  
  // ... autres routes
  router.use('/diplomacy', createDiplomacyRouter(container));
  
  return router;
};
```

8. **Créer les Tests**
```javascript
// backend/modules/diplomacy/application/__tests__/DiplomacyService.test.js
describe('DiplomacyService', () => {
  it('should create alliance', async () => {
    // ... tests
  });
});
```

9. **Créer la Validation Zod**
```javascript
// backend/validation/diplomacySchemas.js
const { z } = require('zod');

const createAllianceSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50),
    description: z.string().optional()
  })
});

module.exports = { createAllianceSchema };
```

---

## ❓ Questions ?

- **Issues GitHub** : Pour les bugs et features requests
- **Discussions GitHub** : Pour les questions générales
- **Code Review** : N'hésitez pas à demander des clarifications

---

## 🙏 Remerciements

Merci de contribuer à Terra Dominus et d'aider à construire un jeu RTS de qualité !

**Bon code ! 🚀**
