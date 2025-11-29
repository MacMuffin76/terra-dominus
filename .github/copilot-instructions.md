## Quick orientation — Terra Dominus

This repository is a full-stack Node/React app. Backend is in `backend/` (Node + Express + Sequelize + Socket.IO). Frontend is in `frontend/` (Create React App, Redux Toolkit, axios, Playwright e2e).

Key dev entry points and commands:
- Backend: cd backend && npm install && npm run start (server runs on port 5000 by default)
- Frontend: cd frontend && npm install && npm run start (CRA dev server runs on 3000 and proxies /api to http://localhost:5000)
- Database initialization: run the SQL script at project root `init_terra_dominus.sql` against your Postgres instance (README.txt contains examples).

CI/test commands (match `.github/workflows/ci.yml`):
- Frontend accessibility lint: `npm run lint:a11y` (frontend)
- Frontend unit tests: `npm run test:unit` (frontend — CI=true used in workflows)
- Frontend e2e: `npm run test:e2e` (Playwright; CI installs browsers with `npx playwright install --with-deps`)
- Backend tests: `npm test` (backend — Jest)

Architecture and patterns a helpful AI should know
1. Dependency injection container (backend): `backend/container.js` wires services/controllers. Many controllers/services are factory functions and expect dependencies to be passed through this container — modify registrations there if you add or replace implementations.
   - Example: `buildingController` created as `require('./controllers/buildingController')({ buildingService: c.resolve('buildingService') })`.

2. Clean separation: controllers -> services -> repositories
   - Controllers (e.g., `backend/controllers/*`) are thin wrappers that call service methods and handle request/response + logging.
   - Business logic lives in `modules/*/application/*` and persistence is implemented in `modules/*/infra/SequelizeRepositories`.

3. Observability & tracing
   - Uses `utils/logger` + `runWithContext` and a `x-trace-id` trace propagation pattern (see `server.js` and `socket` usage). Keep traceId handling consistent when adding instrumentation.

4. Socket.IO + auth
   - Backend auth middleware protects routes and sockets (see `middleware/authMiddleware.js` and `server.js` socket handling). Sockets expect an authenticated user and use `user_connected` events; keep the same handshake and validation behavior when adding socket events.

Frontend-specific patterns
- State: Redux Toolkit slices live under `frontend/src/redux` (see `authSlice.js`, `dashboardSlice.js`). Use the same slice + thunk patterns for async calls.
- API: `frontend/src/utils/axiosInstance.js` configures `baseURL` (defaults to `REACT_APP_API_URL || /api/v1`), JWT propagation (safeStorage), and an HTTP GET response cache — non-GET requests clear the cache. Reuse the axios instance for added API calls and respect `useCache` / `cacheTtl` options.
- Sockets: `frontend/src/utils/socket.js` and `hooks/useDashboardData.js` show socket connection settings — note the `path: '/socket.io'` (important for reverse proxies) and automatic reconnection/hooks. Use the same events (`resources`, `notification`, `user_connected`) and error-handling approach.

Files worth checking for examples
- `repo/.github/workflows/ci.yml` — CI command set and Node version used (node 18)
- `backend/container.js`, `server.js`, `socket.js` — DI + server/socket setup
- `backend/controllers/*`, `services/*`, `modules/*` — service/controller patterns
- `frontend/src/utils/axiosInstance.js`, `frontend/src/utils/socket.js`, `frontend/src/redux/*` — API/caching, sockets, Redux patterns
- `init_terra_dominus.sql`, `README.txt` — DB initialization & developer start steps

Security / repo hygiene
- There is a `backend/.env` file present — **do not commit secrets**; prefer using local environment variables or a secrets manager.

Conventions / style choices to follow
- Follow the existing DI pattern — register new services in `container.js` rather than requiring them ad-hoc throughout the app.
- Controllers generally do error handling and `res.status(...).json({ message })`; reuse the same pattern for consistent error propagation.
- Use `safeStorage` and `jwtToken` conventions on the frontend for authentication flows so JWT handling remains consistent.

When making changes an AI should check (recommended checklist)
1. Update `container.js` if you introduce new service wiring on the backend.
2. Respect JWT auth middleware and verify the `protect` middleware for protected endpoints & sockets.
3. Update e2e and unit tests — CI runs both Playwright and Jest for frontend + backend.
4. If changing socket events or paths, update `frontend/src/hooks/useDashboardData.js`, the low-level `utils/socket.js`, and backend socket handlers.

If anything in these notes looks wrong or you want me to expand particular sections (DB, jobs, observability, or tests), tell me which area and I’ll refine the guidance with concrete examples and commands. ✅
