# Observabilité et alerting

## Exposition Prometheus
- **Endpoint :** `/metrics`
- **Métriques clés :**
  - `http_request_duration_seconds` (histogramme par méthode/route/code)
  - `http_requests_errors_total` (compteur des erreurs HTTP)
  - `queue_jobs_total` (jobs BullMQ par état et par queue)
  - `production_tick_duration_seconds` (durée de traitement du tick de production)
  - `socket_active_connections` (sockets Socket.IO actives)

## Probes Kubernetes
- **Liveness :** `/healthz` retourne `status: ok` et l’`uptime`.
- **Readiness :** `/readyz` vérifie :
  - Authentification Sequelize à la base
  - `PING` Redis
  - Comptage des jobs par queue BullMQ
  - Retourne `503` si un check échoue

## Dashboard Grafana de base
1. **Vue API**
   - Panel "HTTP p95" : `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))`
   - Panel "Taux d’erreurs" : `sum(rate(http_requests_errors_total[5m])) by (route)`
2. **Queues BullMQ**
   - Panel en tableau ou barres empilées sur `queue_jobs_total` groupé par `state`
   - Panel "Jobs en erreur" : `sum(rate(queue_jobs_total{state="failed"}[5m])) by (queue)`
3. **Tick de production**
   - Panel "Durée moyenne" : `rate(production_tick_duration_seconds_sum[5m]) / rate(production_tick_duration_seconds_count[5m])`
   - Panel "p99 tick" : `histogram_quantile(0.99, sum(rate(production_tick_duration_seconds_bucket[5m])) by (le))`
4. **Sockets**
   - Stat panel "Connexions actives" : `socket_active_connections`
   - Graph "Variations" : `max_over_time(socket_active_connections[1h])`

## Alertes essentielles
- **Erreur HTTP** : `sum(rate(http_requests_errors_total[5m])) > 5` (niveau warning) et `> 20` (critique)
- **Saturation queue** : `queue_jobs_total{state="waiting"} > 500` ou `rate(queue_jobs_total{state="failed"}[5m]) > 5`
- **Latence API** : `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1`
- **Tick lent** : `histogram_quantile(0.95, sum(rate(production_tick_duration_seconds_bucket[10m])) by (le)) > 2`
- **Sockets anormales** : `socket_active_connections < 1` (perte globale) ou `socket_active_connections > 5000` (signe de fuite)