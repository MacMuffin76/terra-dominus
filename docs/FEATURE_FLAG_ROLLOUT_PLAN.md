# Feature Flags & Config Rollout Plan

This plan introduces a production-ready feature flag and tunable-config stack for Terra Dominus. It prioritizes safe rollouts, live configurability for combat/economy coefficients, and clear observability across the backend and frontend.

## Deployment: Unleash (self-hosted)
- **Stack**: Unleash server with Postgres (stateful storage) and Redis (optional edge cache + socket keep-alives). Deploy as a dedicated service (Docker Compose / Helm) with health checks and rolling restarts.
- **Admin authentication**: Enable Unleash admin UI with OIDC (preferred) or long-lived admin tokens stored in the secrets manager. Restrict network access to VPN/admin subnet; rotate secrets quarterly.
- **Runtime clients**: Backend services use the official Node client pointed at the Unleash API URL. Client bootstrap includes environment, appName, instanceId, and secret. Configure resilient polling (30s), offline cache, and graceful fail-closed defaults.
- **Equivalent alternative**: If Unleash cannot be deployed, use open-source Flagd/Flipt with equivalent Postgres + Redis backing. Keep the client interface compatible via a thin adapter so the rest of the codebase is unchanged.

## Backend configuration layer for combat/economy coefficients
- **Config source of truth**: Postgres table `tunable_configs` with columns `(id uuid, domain text, version int, data jsonb, created_at timestamptz, created_by, supersedes_version int, is_active bool)`. Only one active version per `(domain, environment)`.
- **Cache strategy**: Store hydrated configs in Redis under `config:{env}:{domain}:v{version}` with TTL (e.g., 10m) and a shadow key for the active version pointer `config:{env}:{domain}:active`. Include ETag-style checksum in Redis payload to detect drifts.
- **Hot reads without redeploy**: The config module exposes `getConfig(domain)` which (1) checks in-memory LRU, (2) Redis, (3) Postgres. It subscribes to Redis pub/sub channel `config:invalidate` to drop local cache when a new version is activated. No process restart required.
- **Versioning**: All writes create a new row with `supersedes_version` reference; activation flips `is_active`. Migrations add an audit trigger writing to `tunable_configs_log` for traceability.
- **Strong defaults**: Embed static defaults in the module to allow read even if DB/Redis are unreachable. Defaults are namespaced per domain (combat, economy) and include schema validation with Zod.

## Integration guardrails
- **API layer**: Add an Express middleware `featureGate(featureKey, fallbackBehavior)` that (a) resolves Unleash flag with a user context, (b) logs the decision, and (c) enforces safe fallback (reject, default response, or degraded mode). Apply to sensitive routes (combat simulation endpoints, quest rewards, economy transactions).
- **Domain services**:
  - **Combat**: Wrap coefficient retrieval via `configService.getConfig('combat')`. If unavailable, clamp multipliers to conservative defaults and surface a warning event; prevent overpowered damage spikes.
  - **Economy**: Use `configService.getConfig('economy')` for construction costs, upkeep, and crafting bonuses. On failure, fall back to baseline costs and disable discounts (fail-secure).
  - **Quest**: Gate risky quest reward experiments behind flags (e.g., `quest.tutorial.reward_v2`). Default to existing reward tables when disabled.
- **Frontend exposure**: Add `/feature-flags` endpoint returning evaluated flags + key config snippets safe for client use (read-only, cached for 5m). Frontend gates UI toggles and displays consistent reward expectations.
- **Service unavailability**: If Unleash API times out, the middleware uses local cached state; if both cache and API fail, it returns fallback behaviors while emitting a `feature_flag_fallback` metric and structured log.

## A/B tests & rollout
- **Examples**:
  - *Tutorial rewards*: Flag `tutorial.reward_bundle_v2` with variants `control`, `boosted`, `double_xp`. Metrics: retention after day 1, quest completion time, churn.
  - *Construction cost*: Flag `economy.construction_cost_v2` with percentage rollouts per environment. Metrics: time-to-first-base-upgrade, soft-currency burn rate.
- **Percentage rollout**: Use Unleash gradual rollout strategy keyed by `userId` or `allianceId`. Start at 5%, ramp to 25%, 50%, then 100% after success criteria met.
- **Change management**: Require experiment docs with hypothesis, guardrails, and rollback checklist. Activation/deactivation flows through the `tunable_configs` admin API with role-based access and audit trails.

## Observability
- **Logs**: Structured pino logs on every flag resolution `{ featureKey, enabled, variant, source: cache|network|default, userId, reason }`. Log cache invalidations and forced fallbacks.
- **Metrics** (Prometheus):
  - `feature_flag_resolutions_total{feature, source, outcome}`
  - `feature_flag_fallback_total{feature, reason}`
  - `config_cache_hits_total{layer}` and `config_cache_misses_total{layer}` for memory/Redis/DB.
  - Latency histograms for config fetch and Unleash client polling.
- **Dashboards/alerts**: Alert on fallback spikes, cache miss surges, and polling failures; dashboard panels for rollout coverage and experiment KPIs.

## Testing strategy
- **Unit tests**: Validate domain defaults, override application, and Zod schema validation for combat/economy configs. Mock Redis/DB outages to confirm fail-secure behavior and cache invalidation handling.
- **Integration tests**: End-to-end flows for (a) feature disabled vs enabled on combat/economy endpoints, (b) quest reward experiment variants, (c) `/feature-flags` endpoint caching and content safety, and (d) percentage rollout consistency (sticky bucketing by userId).
- **Load/smoke**: Run short soak tests during rollout to watch for latency regressions from flag resolution and cache misses.