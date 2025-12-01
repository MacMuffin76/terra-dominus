# 🌍 Terra Dominus

Un jeu de stratégie en temps réel (RTS) inspiré d'Ogame, se déroulant sur Terre avec des mécaniques de colonisation, combat territorial et commerce inter-villes.

[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation rapide](#-installation-rapide)
- [Documentation](#-documentation)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Fonctionnalités

### 🏙️ Multi-villes & Colonisation
- Carte du monde 100×100 avec exploration progressive (Fog of War)
- Système de colonisation avec missions de voyage
- Gestion de multiples villes (jusqu'à 20 selon technologies)
- Spécialisation des villes par terrain (bonus ressources)

### ⚔️ Combat Territorial
- 3 types d'attaques : Raid, Conquête, Siège
- Calcul de combat avec simulation sur 10 rounds max
- Système d'espionnage (reconnaissance, intel militaire, sabotage)
- Rapports de combat détaillés avec logs

### 🚢 Commerce Inter-villes
- Routes commerciales internes (entre vos villes)
- Routes externes (avec autres joueurs)
- Convois escortés avec possibilité d'interception
- Transferts automatiques programmables

### 🔬 Technologies & Progression
- Arbre technologique de colonisation (1 → 20 villes)
- Technologies de combat et défense
- Améliorations de vision et cartographie
- Spécialisations économiques et militaires

### 🔔 Notifications Temps Réel
- Socket.IO pour mises à jour instantanées
- Notifications prioritaires (attaques, espionnage détecté)
- Événements : colonisation, combat, commerce, arrivée missions

---

## 🛠️ Prérequis

- **Node.js** v18+ et npm
- **PostgreSQL** 12+
- **Redis** 6+ (pour workers et cache)
- **Git**

---

## 🚀 Installation rapide

### 1. Cloner le repository

```powershell
git clone https://github.com/MacMuffin76/terra-dominus.git
cd terra-dominus
```

### 2. Backend setup

```powershell
cd backend
npm install

# Copier le fichier d'exemple et remplir les variables
cp .env.example .env
# Éditer .env avec vos credentials (DATABASE_URL, JWT_SECRET, REDIS_URL)

# Initialiser la base de données
psql -U postgres -c "CREATE DATABASE terra_dominus_dev;"
psql -U postgres -d terra_dominus_dev -f ../init_terra_dominus.sql

# Optionnel : Générer la carte du monde
npm run init-world
```

### 3. Frontend setup

```powershell
cd ../frontend
npm install

# Copier le fichier d'exemple
cp .env.example .env
# Éditer si nécessaire (valeurs par défaut OK pour dev local)
```

### 4. Démarrer l'application

**Option A : 3 terminaux séparés (recommandé pour dev)**

```powershell
# Terminal 1 : Backend API
cd backend
npm start

# Terminal 2 : Workers (jobs asynchrones)
cd backend
npm run worker

# Terminal 3 : Frontend React
cd frontend
npm start
```

**Option B : Script de démarrage combiné** (à créer)

L'application sera accessible à http://localhost:3000

---

## 📚 Documentation

### Pour les utilisateurs
- **[README.txt](README.txt)** - Guide d'installation original
- **[WORLD_SYSTEM_README.md](WORLD_SYSTEM_README.md)** - Système de carte et colonisation
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Fonctionnalités du système monde
- **[NEW_FEATURES_SUMMARY.md](NEW_FEATURES_SUMMARY.md)** - Combat, commerce et espionnage

### Pour les développeurs
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide de contribution complet
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture technique détaillée
- **[IMPROVEMENTS_SUMMARY.md](IMPROVEMENTS_SUMMARY.md)** - Dernières améliorations implémentées
- **[API Documentation](http://localhost:5000/api-docs)** - Swagger UI (après démarrage backend)

### Configuration
- **[backend/.env.example](backend/.env.example)** - Variables d'environnement backend
- **[frontend/.env.example](frontend/.env.example)** - Variables d'environnement frontend

---

## 🏗️ Architecture

Terra Dominus utilise une architecture modulaire basée sur Domain-Driven Design (DDD) :

```
Terra Dominus
├── Backend (Node.js + Express)
│   ├── Modules (DDD)
│   │   ├── domain/      # Règles métier pures
│   │   ├── application/ # Services (use cases)
│   │   ├── infra/       # Repositories (data access)
│   │   └── api/         # Controllers + Routes
│   ├── Jobs (BullMQ)    # Workers asynchrones
│   ├── Models (Sequelize) # ORM PostgreSQL
│   └── Middleware       # Auth, rate limiting, validation
│
└── Frontend (React + Redux Toolkit)
    ├── Components       # UI réutilisables
    ├── Redux            # State management
    ├── Hooks            # Custom hooks
    └── API              # Clients HTTP + WebSocket
```

**Patterns utilisés** :
- **DDD** : Séparation domaine/application/infra
- **Dependency Injection** : Container centralisé
- **Repository Pattern** : Abstraction accès données
- **Optimistic Locking** : Gestion concurrence
- **Event-Driven** : Socket.IO pour temps réel
- **CQRS** : Séparation lecture/écriture (partiel)

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour plus de détails.

---

## 🧪 Tests

```powershell
# Backend - Tests unitaires
cd backend
npm test                    # Tous les tests
npm run test:watch          # Mode watch
npm run test:coverage       # Avec couverture

# Frontend - Tests unitaires
cd frontend
npm run test:unit           # Jest
npm run test:e2e            # Playwright (end-to-end)
npm run lint:a11y           # Linting accessibilité
```

---

## 🔐 Sécurité

- **Authentification** : JWT avec refresh tokens et blacklist Redis
- **Rate Limiting** : Granulaire par type d'endpoint (5 à 100 req/min)
- **Validation** : Schémas Zod sur toutes les entrées utilisateur
- **Logging structuré** : Pino avec trace propagation
- **CORS** : Configurable via `CORS_ORIGINS`
- **SQL Injection** : Protégé par Sequelize ORM

---

## 🚀 Déploiement

### Production checklist

- [ ] Variables d'environnement sécurisées (pas de .env committé)
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` fort et aléatoire (64+ caractères)
- [ ] Redis sécurisé (mot de passe, SSL)
- [ ] PostgreSQL optimisé (indexes, connection pooling)
- [ ] Rate limiting activé sur tous les endpoints
- [ ] Reverse proxy (Nginx) configuré
- [ ] HTTPS activé (Let's Encrypt)
- [ ] Logs centralisés (fichiers ou service externe)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Backups automatiques DB

### Scripts utiles

```powershell
# Backend
npm start                   # Démarrer serveur
npm run worker              # Démarrer workers
npm run migrate             # Exécuter migrations DB
npm run migrate:undo        # Rollback migration
npm run init-world          # Générer carte du monde

# Frontend
npm run build               # Build production
npm run start:prod          # Servir le build
```

---

## 🤝 Contributing

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour :
- Setup environnement de développement
- Standards de code (JavaScript/React)
- Workflow Git (branches, commits, PR)
- Guide de tests
- Template pour ajouter un module

**Quick start contribuer** :
1. Fork le repo
2. Créer une branche : `git checkout -b feature/ma-feature`
3. Commit : `git commit -m 'feat(module): description'`
4. Push : `git push origin feature/ma-feature`
5. Ouvrir une Pull Request

---

## 📊 Roadmap

### ✅ Implémenté
- [x] Système multi-villes et colonisation
- [x] Combat territorial (raid, conquête, siège)
- [x] Espionnage (3 types de missions)
- [x] Commerce inter-villes (routes et convois)
- [x] Notifications temps réel (Socket.IO)
- [x] Carte du monde 100×100 avec exploration
- [x] Technologies de progression
- [x] Rate limiting granulaire
- [x] Token blacklist (révocation JWT)
- [x] Tests unitaires (Combat, Building)
- [x] Documentation complète

### 🚧 En cours
- [ ] Tests d'intégration API (supertest)
- [ ] Tests e2e complets (Playwright)
- [ ] Documentation API Swagger complète
- [ ] Migration TypeScript

### 📅 Planifié
- [ ] Système d'alliances
- [ ] Classements/leaderboards
- [ ] Chat temps réel
- [ ] Replay d'attaques
- [ ] Événements mondiaux
- [ ] Carte 3D (Three.js)
- [ ] Notifications email/push
- [ ] Mobile app (React Native)

---

## 📄 License

ISC License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

Merci à tous les contributeurs qui ont participé à ce projet !

- Architecture DDD inspirée par [Domain-Driven Design](https://domainlanguage.com/ddd/)
- Système de combat inspiré par [Ogame](https://ogame.org/)
- Stack technique moderne (Node.js, React, PostgreSQL, Redis)

---

## 📞 Contact & Support

- **Issues** : [GitHub Issues](https://github.com/MacMuffin76/terra-dominus/issues)
- **Discussions** : [GitHub Discussions](https://github.com/MacMuffin76/terra-dominus/discussions)
- **Email** : [MacMuffin76](https://github.com/MacMuffin76)

---

<div align="center">

**Développé avec ❤️ pour les fans de jeux de stratégie**

⭐ N'oubliez pas de star le repo si vous aimez le projet !

</div>
