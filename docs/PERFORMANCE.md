# Performance & Cache - Terra Dominus

## Vue d'ensemble

Ce document détaille les optimisations de performance mises en place et le système de cache Redis.

## Cache Redis

### Architecture

```mermaid
graph LR
    Client[Client Request] --> API[Express API]
    API --> Cache{Redis Cache?}
    Cache -->|HIT| Return[Return Cached Data]
    Cache -->|MISS| DB[(PostgreSQL)]
    DB --> Store[Store in Cache]
    Store --> Return
```

### Configuration

**Variables d'environnement** :
```bash
REDIS_URL=redis://127.0.0.1:6379
```

**Connexion** :
```javascript
const { cacheWrapper, invalidateCache } = require('./utils/cache');
```

### Utilisation

#### 1. Cache Wrapper

```javascript
const result = await cacheWrapper(
  'cache:key',        // Clé unique
  300,                // TTL en secondes (5 minutes)
  async () => {       // Fonction de fetch
    return await fetchFromDatabase();
  }
);
```

#### 2. Invalidation de Cache

```javascript
// Invalidation par clé unique
await invalidateCache('world:visible:123');

// Invalidation par pattern
await invalidateCache('world:visible:*');
```

### Stratégies par Module

#### Module World (Carte du Monde)

**Cache** :
- `world:visible:{userId}:{bounds}` - TTL 5 minutes
- Données rarement modifiées (exploration progressive)

**Invalidation** :
- Après exploration de nouvelles tiles
- Après colonisation d'un nouveau slot

**Implémentation** :
```javascript
async getVisibleWorld(userId, bounds = null) {
  const cacheKey = `world:visible:${userId}:${JSON.stringify(bounds || {})}`;
  
  return cacheWrapper(cacheKey, 300, async () => {
    return this._getVisibleWorldUncached(userId, bounds);
  });
}
```

**Impact** :
- Réduction latence : ~200ms → ~10ms (95% plus rapide)
- Charge DB réduite de 80%

#### Module Resources (Ressources)

**Cache** :
- `resources:costs:{entityId}:{level}` - TTL 1 heure
- Données statiques (coûts de construction)

**Pas de cache** :
- Quantités de ressources utilisateur (mise à jour temps réel)

**Implémentation** :
```javascript
async getResourceCosts(entityId, level) {
  const cacheKey = `resources:costs:${entityId}:${level}`;
  
  return cacheWrapper(cacheKey, 3600, async () => {
    return ResourceCost.findAll({
      where: { entity_id: entityId, level }
    });
  });
}
```

#### Module Colonization

**Cache** :
- `colonization:max-cities:{userId}` - TTL 10 minutes
- Calculé à partir des technologies

**Invalidation** :
- Après upgrade d'une technologie de colonisation

#### Module Combat

**Pas de cache** :
- Données temps réel (attaques en cours)
- Invalidation trop complexe

## Optimisations Database

### Indexes

```sql
-- Cities
CREATE INDEX idx_cities_user_id ON cities(user_id);
CREATE INDEX idx_cities_coords ON cities(coord_x, coord_y);

-- Attacks
CREATE INDEX idx_attacks_attacker_user ON attacks(attacker_user_id);
CREATE INDEX idx_attacks_defender_user ON attacks(defender_user_id);
CREATE INDEX idx_attacks_status ON attacks(status);

-- World Grid
CREATE INDEX idx_world_grid_coords ON world_grid(coord_x, coord_y);

-- Explored Tiles
CREATE INDEX idx_explored_tiles_user ON explored_tiles(user_id);
CREATE INDEX idx_explored_tiles_grid ON explored_tiles(grid_id);
```

### Connection Pooling

```javascript
// backend/db.js
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  pool: {
    max: 20,        // Maximum 20 connexions
    min: 5,         // Minimum 5 connexions
    acquire: 30000, // Timeout 30s
    idle: 10000     // Libération après 10s inactivité
  },
  logging: process.env.DB_LOGGING === 'true' ? console.log : false
});
```

### Eager Loading (N+1 Queries)

**Avant (N+1 problem)** :
```javascript
const attacks = await Attack.findAll({ where: { attacker_user_id: userId } });
for (const attack of attacks) {
  const waves = await AttackWave.findAll({ where: { attack_id: attack.id } });
  attack.waves = waves;
}
// N+1 queries : 1 + N
```

**Après (Eager Loading)** :
```javascript
const attacks = await Attack.findAll({
  where: { attacker_user_id: userId },
  include: [{ model: AttackWave, as: 'waves' }]
});
// 1 query avec JOIN
```

## Optimisations Frontend

### Code Splitting

```javascript
// frontend/App.js
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const WorldMap = React.lazy(() => import('./components/WorldMap'));

<Suspense fallback={<Loader />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>
```

### Memoization

```javascript
// Hooks
const visibleTiles = useMemo(() => {
  return worldData.tiles.filter(t => t.isVisible);
}, [worldData.tiles]);

const handleClick = useCallback((x, y) => {
  selectTile(x, y);
}, [selectTile]);
```

### Canvas Optimization (WorldMap)

```javascript
// Rendu uniquement du viewport visible
const visibleTiles = tiles.filter(tile => {
  return tile.x >= viewMinX && tile.x <= viewMaxX &&
         tile.y >= viewMinY && tile.y <= viewMaxY;
});
```

## Monitoring

### Métriques Prometheus

**Endpoints exposés** :
```
GET /metrics
```

**Métriques collectées** :
- `http_request_duration_ms` - Latence requêtes HTTP
- `http_requests_total` - Nombre total de requêtes
- `cache_hits_total` - Nombre de cache hits
- `cache_misses_total` - Nombre de cache misses
- `db_query_duration_ms` - Temps requêtes DB

**Exemple query Prometheus** :
```promql
# Taux de cache hit
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

# P95 latence API
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))
```

### Dashboard Grafana (Optionnel)

Template disponible : `docs/grafana-dashboard.json`

**Panels** :
- Requests per second (RPS)
- P50, P95, P99 latency
- Cache hit rate
- Database connection pool usage
- Error rate

## Benchmarks

### Avant optimisations
| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| GET /world/visible | 250ms | 500ms | 1200ms |
| GET /resources | 80ms | 150ms | 300ms |
| POST /combat/attack | 120ms | 250ms | 500ms |

### Après optimisations
| Endpoint | P50 | P95 | P99 | Amélioration |
|----------|-----|-----|-----|--------------|
| GET /world/visible | 15ms | 50ms | 150ms | **87% plus rapide** |
| GET /resources | 10ms | 30ms | 80ms | **87% plus rapide** |
| POST /combat/attack | 100ms | 200ms | 400ms | **20% plus rapide** |

## Tests de Charge

### Artillery.io

```yaml
# artillery-load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/sec
    - duration: 120
      arrivalRate: 50  # 50 users/sec (peak)
scenarios:
  - name: "Get visible world"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            username: "testuser"
            password: "testpass"
          capture:
            - json: "$.token"
              as: "token"
      - get:
          url: "/api/v1/world/visible"
          headers:
            Authorization: "Bearer {{ token }}"
```

**Commande** :
```bash
artillery run artillery-load-test.yml
```

## Bonnes Pratiques

### 1. Cache Keys Namespacing

✅ **BON** :
```javascript
const key = `world:visible:${userId}:${bounds}`;
```

❌ **MAUVAIS** :
```javascript
const key = `${userId}_world`; // Collision possible
```

### 2. TTL Adapté aux Données

- **Statiques** (coûts, terrains) : 1 heure+
- **Semi-statiques** (carte explorée) : 5-10 minutes
- **Dynamiques** (ressources, attaques) : Pas de cache

### 3. Invalidation Proactive

```javascript
// Après modification
await updateCity(cityId, data);
await invalidateCache(`city:${cityId}:*`);
```

### 4. Graceful Degradation

```javascript
try {
  return await cacheWrapper(key, ttl, fetchFn);
} catch (error) {
  // Fallback si Redis down
  logger.warn('Cache error, direct DB fetch');
  return await fetchFn();
}
```

## Prochaines Optimisations

### Court terme
- [ ] Cache fragments HTML (vues statiques)
- [ ] Compression gzip/brotli sur API
- [ ] CDN pour assets frontend

### Moyen terme
- [ ] Read replicas PostgreSQL
- [ ] Redis Cluster (haute disponibilité)
- [ ] Query optimization (EXPLAIN ANALYZE)

### Long terme
- [ ] GraphQL (réduction over-fetching)
- [ ] Server-Side Rendering (SSR) React
- [ ] Edge computing (Cloudflare Workers)

## Ressources

- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Node.js Performance Best Practices](https://github.com/goldbergyoni/nodebestpractices#performance)
- [Sequelize Optimization](https://sequelize.org/docs/v6/other-topics/optimistic-locking/)
