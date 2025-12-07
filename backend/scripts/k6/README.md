# Tests de charge k6

Ce dossier contient des scénarios k6 prêts à l'emploi pour charger Terra Dominus avec différents profils (raids massifs, marché, websockets et stress BullMQ).

## Prérequis
- `k6` installé en local.
- URL de l'API exposée (par défaut `http://localhost:5000/api/v1`).
- Jetons JWT valides pour les utilisateurs de test (variable `AUTH_TOKENS` ou `AUTH_TOKEN`).

## Variables d'environnement communes
- `BASE_URL`: racine HTTP de l'API (ex: `http://api.terra.local/api/v1`).
- `AUTH_TOKENS`: liste de tokens séparés par des virgules pour répartir la charge.
- `AUTH_TOKEN`: token unique si `AUTH_TOKENS` n'est pas fourni.
- `CITY_IDS`: identifiants de villes source (séparés par des virgules) utilisés par les scénarios raids/marché.
- `TARGET_CITY_IDS`: identifiants de villes cibles pour les attaques.
- `UNIT_ENTITY_ID`: identifiant d'unité utilisé pour les raids (par défaut `1`).
- `MARKET_RESOURCE`: ressource échangée dans le marché (par défaut `wood`).
- `WS_BASE_URL`: URL websocket (ex: `ws://api.terra.local`).

## Scripts disponibles

### 1. Raids massifs (`raid-scenarios.js`)
- Trois scénarios parallèles : 100, 500 et 1000 utilisateurs virtuels.
- Envoie des attaques de type `raid` sur `/combat/attack` et lit les attaques en cours via `/combat/attacks` pour générer de la latence réaliste.
- Seuils par défaut : `p(95) < 300ms` et taux de succès > 95%.

Exécution :
```bash
k6 run backend/scripts/k6/raid-scenarios.js \
  -e BASE_URL=http://localhost:5000/api/v1 \
  -e AUTH_TOKENS="token1,token2" \
  -e CITY_IDS="101,102" -e TARGET_CITY_IDS="201,202" -e UNIT_ENTITY_ID=7
```

### 2. Marché & échanges (`market-trades.js`)
- Charge mixte lecture/écriture sur `/market/orders` (création, exécution, listing) et `/trade/convoys`.
- Permet de faire varier les ratios lecture/écriture via `WRITE_PERCENT` (0-100).

Exécution :
```bash
k6 run backend/scripts/k6/market-trades.js -e BASE_URL=http://localhost:5000/api/v1 \
  -e AUTH_TOKENS="token1,token2" -e CITY_IDS="101" -e MARKET_RESOURCE=stone -e WRITE_PERCENT=40
```

### 3. WebSockets combat & rooms (`socket-combat.js`)
- Connexion Socket.IO (transport websocket) avec auth bearer.
- Joins la room utilisateur, déclenche `user_connected` puis écoute/émet des updates de combat/ressources.
- Paramètres : `WS_BASE_URL`, `ROOM_SUFFIX` (facultatif pour cibler une room de combat spécifique), `PING_INTERVAL_MS` pour maintenir la connexion.

Exécution :
```bash
k6 run backend/scripts/k6/socket-combat.js \
  -e WS_BASE_URL=ws://localhost:5000 -e AUTH_TOKEN="token" -e ROOM_SUFFIX=combat_42
```

### 4. Charge BullMQ (`queues-bullmq.js`)
- Génère des jobs via les endpoints `/combat/attack`, `/trade/convoys` et `/market/orders` pour remplir les files `attack`, `trade` et `production`.
- Suit la métrique `queue_jobs_total` exposée par `/metrics` pour valider la capacité des workers.

Exécution :
```bash
k6 run backend/scripts/k6/queues-bullmq.js \
  -e BASE_URL=http://localhost:5000/api/v1 -e AUTH_TOKENS="token1,token2" \
  -e CITY_IDS="101,102" -e TARGET_CITY_IDS="201" -e METRICS_URL=http://localhost:5000/metrics
```

## SLO et exploitation
- Objectif SLO : p95 < 300ms sur les requêtes API sous 500 utilisateurs concurrents.
- Exporter les résultats avec `k6 run --out json=results.json` puis charger le fichier dans Grafana k6 ou via `k6 report --summary-trend-stats="avg,p(95),max"`.
- Enregistrer systématiquement les métriques Prometheus (`/metrics`) et les logs workers BullMQ pour identifier les goulots (DB, Redis, CPU).