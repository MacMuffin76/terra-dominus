 # Terra Dominus — guide de démarrage

Ce dépôt contient une application full‑stack pour Terra Dominus :

- backend/ — Node.js + Express + Sequelize + Socket.IO
- frontend/ — React (Create React App) + Redux Toolkit + axios + Playwright (e2e)

Ce README remplace le README.txt existant et centralise les informations importantes pour démarrer, tester et contribuer.

## Prérequis
- Node.js v16+ et npm
- PostgreSQL accessible (local ou distant) avec un compte pouvant créer des bases et exécuter des scripts SQL
- Ports réseau : backend par défaut 5000, frontend 3000

## Initialisation de la base de données
Le projet fournit un script SQL d'initialisation : `init_terra_dominus.sql`.
Exécutez-le depuis la racine du projet (ou via un client SQL) :

```powershell
$env:DATABASE_URL = "postgres://user:pass@localhost:5432/dbname"
psql "$env:DATABASE_URL" -f init_terra_dominus.sql
```

## Variables d'environnement importantes
Base de données (un de ces choix) :
- `DATABASE_URL` : URL Postgres complète, ou
- `DB_USER`, `DB_PASSWORD`, `DB_HOST` (defaults to localhost), `DB_PORT` (5432), `DB_NAME`

Options SQL :
- `DB_SSL` (true/false)
- `DB_LOGGING` (true pour log SQL)

Backend :
- `PORT` (defaut 5000)
- `JWT_SECRET` (obligatoire pour auth)
- `CORS_ORIGINS` (liste séparée par virgules)

Frontend :
- `REACT_APP_API_URL` (par défaut `/api/v1`, la dev server proxy vers http://localhost:5000)
- `REACT_APP_SOCKET_URL` (URL du serveur Socket.IO; par défaut http://localhost:5000 ou origine)

## Démarrage local (dev)
Backend (depuis la racine) :

```powershell
cd backend
npm install
npm run start    # démarrer le serveur Express (port 5000)
```

Processus utiles :
- `npm run dev` (alias start dans ce projet)
- `npm run worker` démarre les workers de jobs (BullMQ)

Frontend :

```powershell
cd frontend
npm install
npm run start    # CRA dev server sur 3000 (proxy vers http://localhost:5000)
```

## Tests et CI
- Backend tests : `cd backend && npm test` (Jest)
- Frontend unit tests : `cd frontend && npm run test:unit` (CI utilise `CI=true`)
- Frontend e2e : `cd frontend && npm run test:e2e` (Playwright — CI doit installer les navigateurs avec `npx playwright install --with-deps`)
- Lint accessibilité : `npm run lint:a11y` (frontend)

## Architecture & principes importants pour contributeurs
- Pattern DI (Dependency Injection) : `backend/container.js` enregistre et résout les services, controllers et repositories. Pour ajouter/remplacer une implémentation, modifiez les registrations ici.
- Séparation claire : controllers → services → repositories. La logique métier est dans `modules/*/application` et la persistance dans `modules/*/infra/SequelizeRepositories`.
- Observabilité : utils/logger + traceId (`x-trace-id`) utilisé en propagation et contexte (voir `server.js` et `utils/logger`).
- Socket.IO : le serveur attend des connexions autorisées et utilise des events `user_connected`, `resources`, `notification` — respectez la validation côté serveur (`validation/socketValidation.js`) si vous modifiez les events ou payloads.
- Frontend : utilisez `frontend/src/utils/axiosInstance.js` (gère JWT via `safeStorage`, cache d'GETs, et invalidation). Respectez `useCache`/`cacheTtl` si nécessaire.

## Fichiers clés à consulter
- `.github/workflows/ci.yml` — définition des checks CI
- `backend/container.js`, `backend/server.js`, `backend/socket.js` — démarrage, DI & socket
- `backend/controllers/*`, `backend/modules/*` — exemples de controller/service patterns
- `frontend/src/utils/axiosInstance.js`, `frontend/src/utils/socket.js`, `frontend/src/redux/*` — patterns front-end

## Sécurité / secrets
Il existe un fichier `backend/.env` dans ce dépôt. Si ce fichier contient des valeurs sensibles :
- Remplacez-le par un `.env.example` sans secrets
- Ajoutez des secrets via CI Settings ou un gestionnaire de secrets

## Contribuer / PR checklist rapide
1. Si vous ajoutez un nouveau service backend, enregistrez-le dans `container.js` et fournissez un test/mocking strategy.
2. Ajoutez/mettre à jour tests unitaires (backend + frontend) et e2e si l'API change.
3. Si vous modifiez des events socket, mettez à jour `frontend/src/hooks/useDashboardData.js` et `frontend/src/utils/socket.js`.

---
Si vous voulez que je pousse ces changements sur la branche principale et/ou ouvre une PR, dites-le moi.
