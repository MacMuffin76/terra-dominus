# Documentation - Terra Dominus

Index principal de la documentation du projet.

## 🚀 Getting Started

- [README.md](../README.md) - Vue d'ensemble et installation rapide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Guide de contribution complet

## 📚 Documentation Technique

### Architecture
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture globale, patterns, stack
- [PERFORMANCE.md](./PERFORMANCE.md) - Optimisations et cache Redis
- [TYPESCRIPT.md](./TYPESCRIPT.md) - Migration progressive vers TypeScript

### Modules Métier
- [modules/combat.md](./modules/combat.md) - Système de combat et attaques
- [modules/world.md](./modules/world.md) - Carte du monde et exploration (TODO)
- [modules/colonization.md](./modules/colonization.md) - Colonisation et multi-villes (TODO)
- [modules/trade.md](./modules/trade.md) - Commerce inter-villes (TODO)

## 🧪 Tests

### Backend
```bash
cd backend
npm test                    # Tous les tests
npm run test:coverage       # Avec coverage (cible 70%)
npm test CombatService      # Test spécifique
```

**Tests disponibles** :
- `modules/combat/application/__tests__/CombatService.test.js`
- `modules/trade/application/__tests__/TradeService.test.js`
- `modules/colonization/application/__tests__/ColonizationService.test.js`
- `modules/world/application/__tests__/WorldService.test.js`
- `utils/__tests__/cache.test.js`

### Frontend
```bash
cd frontend
npm run test:unit           # Tests unitaires
npm run test:e2e            # Tests Playwright
npm run lint:a11y           # Accessibilité
```

## 🔧 Development

### Backend
```bash
cd backend
npm install
cp .env.example .env        # Configurer variables
npm run migrate             # Migrations DB
npm run start               # Serveur API (port 5000)
npm run worker              # BullMQ workers
```

### Frontend
```bash
cd frontend
npm install
npm run start               # Dev server (port 3000)
```

### TypeScript
```bash
cd backend
npm run build               # Compiler TS → JS
npm run type-check          # Vérification types sans compilation
npm run build:watch         # Watch mode
```

## 📊 Monitoring

### Health Checks
```bash
curl http://localhost:5000/health
```

### Metrics (Prometheus)
```bash
curl http://localhost:5000/metrics
```

### Logs
```bash
# Backend logs (Pino JSON)
tail -f backend/logs/app.log | pino-pretty

# Filtrer par niveau
tail -f backend/logs/app.log | pino-pretty --level error
```

## 🔒 Sécurité

### Secrets
**Ne jamais commiter** :
- `backend/.env` (utiliser `.env.example`)
- Tokens JWT de test
- Credentials PostgreSQL/Redis

### Audit Dépendances
```bash
cd backend && npm audit
cd frontend && npm audit
```

## 📦 Déploiement

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) (TODO)

**Production checklist** :
- [ ] Variables d'environnement configurées
- [ ] Migrations DB exécutées
- [ ] Frontend buildé (`npm run build`)
- [ ] Redis et PostgreSQL opérationnels
- [ ] Nginx configuré (reverse proxy)
- [ ] PM2 ou Docker configuré
- [ ] Monitoring activé (Sentry, Prometheus)

## 🐛 Troubleshooting

### Backend ne démarre pas
```bash
# Vérifier PostgreSQL
psql -U postgres -c "SELECT version();"

# Vérifier Redis
redis-cli ping
# Attendu : PONG

# Vérifier logs
tail -f backend/logs/app.log
```

### Frontend CORS errors
Vérifier `backend/.env` :
```bash
CORS_ORIGIN=http://localhost:3000
```

### Tests échouent
```bash
# Reset test database
cd backend
NODE_ENV=test npm run migrate:undo:all
NODE_ENV=test npm run migrate
```

## 🎓 Ressources Externes

### Node.js
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### React
- [React Hooks](https://react.dev/reference/react)
- [Redux Toolkit](https://redux-toolkit.js.org/)

### Sequelize
- [Sequelize Docs](https://sequelize.org/docs/v6/)
- [Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)

### Testing
- [Jest](https://jestjs.io/docs/getting-started)
- [Playwright](https://playwright.dev/docs/intro)

## 📞 Support

**Questions** : Ouvrir une issue GitHub

**Bugs** : Créer un bug report avec :
- Version Node.js (`node -v`)
- Logs pertinents
- Steps to reproduce

## 🗺️ Roadmap

Voir [ROADMAP.md](./ROADMAP.md) (TODO)

**Prochaines features** :
- Système d'alliances
- Chat en jeu
- Marketplace de ressources
- Événements mondiaux
- Achievements/succès

---

**Dernière mise à jour** : 29 novembre 2025
