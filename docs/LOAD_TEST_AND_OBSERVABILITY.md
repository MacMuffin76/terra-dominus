# Plan de tests de charge & observabilité

Ce plan décrit comment exécuter les scénarios k6, quelles gardes-fous d'infra activer (rate-limit, autoscaling, résilience Node.js) et quels tableaux de bord utiliser pour suivre les SLO.

## 1. Scénarios k6
- Scripts : `backend/scripts/k6` (raids massifs, marché/convoys, websockets, jobs BullMQ).
- SLO cible : p95 < 300 ms pour l'API sous 500 utilisateurs concurrents.
- Export : `k6 run ... --out json=results.json` puis `k6 report --summary-trend-stats="avg,p(95),max" results.json`.
- Traces complémentaires : récupérer `/metrics` et les logs de workers BullMQ pendant les runs pour isoler DB/Redis/CPU.

## 2. Limiteur de débit & edge
- **Nginx (bare-metal/VM) :**
  ```nginx
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=600r/m;
  server {
    location /api/ {
      limit_req zone=api_limit burst=100 nodelay;
      proxy_read_timeout 15s;
      proxy_connect_timeout 5s;
    }
  }
  ```
- **Ingress Kubernetes :** annotations type NGINX ingress
  ```yaml
  nginx.ingress.kubernetes.io/limit-rps: "10"
  nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"
  nginx.ingress.kubernetes.io/proxy-connect-timeout: "5s"
  nginx.ingress.kubernetes.io/proxy-read-timeout: "15s"
  ```
- Activer `TRUST_PROXY=1` côté backend (déjà supporté) pour que l'IP client soit bien prise en compte par `express-rate-limit`.

## 3. Autoscaling & capacité
- **API / workers BullMQ** : HPA basé sur CPU (70%) et backlog Redis
  ```yaml
  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  spec:
    scaleTargetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: terra-api
    minReplicas: 2
    maxReplicas: 10
    metrics:
      - type: Resource
        resource:
          name: cpu
          target:
            type: Utilization
            averageUtilization: 70
      - type: Pods
        pods:
          metric:
            name: queue_jobs_total
          target:
            type: AverageValue
            averageValue: 200
  ```
- **Redis** : activer le sentinel ou au minimum un pod anti-affinité + métriques `redis_connected_clients`/`commands_processed_total` pour détecter le saturation.
- **Postgres** : surveiller `pg_stat_activity_count` et activer `max_connections` cohérent avec `Sequelize pool (max=20)`.

## 4. Résilience Node.js
- **Timeouts HTTP** (prévenir les sockets pendants) :
  - `HEADERS_TIMEOUT_MS` / `REQUEST_TIMEOUT_MS` (15000 ms par défaut) appliqués dans `backend/server.js`.
  - Client sortants : forcer `timeout: 8000` sur les clients HTTP/axios utilisés pour les services externes.
- **Circuit breakers** (exemple avec BullMQ/Redis) :
  - Retenter 3 fois avec backoff exponentiel (déjà configuré dans `jobs/queueConfig.js`).
  - Dégrader la fonctionnalité en renvoyant un 503 si Redis n'est pas atteignable (middleware à placer autour des routes de file pour éviter des temps d'attente infinis).
- **Budgets d'erreur** : alerter dès que `http_requests_errors_total` dépasse 1% sur 5 minutes pour enclencher la protection (p. ex. limiter le nombre d'attaques par minute en cas d'incident Redis/DB).

## 5. Observabilité Grafana
- Dashboards JSON prêts à importer :
  - `backend/observability/grafana/infra-overview.json` : CPU/Mémoire, Redis, Postgres, p95 HTTP.
  - `backend/observability/grafana/queues-and-app.json` : files BullMQ, sockets actives, p95 ticks production, erreurs HTTP et suivi du SLO 300ms.
- Datasources attendues : `Prometheus` (scrape `/metrics`, node-exporter, redis-exporter, postgres-exporter).
- Alerting rapide :
  - Alerte p95 HTTP > 300 ms (5 min, crit) et > 250 ms (warn).
  - Alerte `queue_jobs_total{state="waiting"}` > 500 pour `attack` ou `trade` (5 min).
  - Alerte `redis_connected_clients` > 0.8 * `maxclients` (5 min) et `pg_stat_activity_count{state="active"}` > 0.8 * pool.

## 6. Rapport & goulots d'étranglement
- Collecter :
  - p50/p95/p99 HTTP + throughput par route.
  - Saturation DB (connections, locks) et Redis (clients, cmd/s) pendant les scénarios 500 et 1000 utilisateurs.
  - Temps de traitement `production_tick_duration_seconds` pour détecter un CPU bottleneck sur les workers.
- Remédiations typiques :
  - DB : ajouter des index manquants, augmenter `work_mem`/`shared_buffers`, activer le pooling externe (PgBouncer).
  - Redis : sharder les clés BullMQ (préfixes par queue), augmenter `maxmemory` et surveiller l'éviction.
  - CPU/API : augmenter les réplicas API, activer la compression gzip côté ingress seulement pour les routes lourdes, et vérifier les payloads d'attaque (taille des listes d'unités).