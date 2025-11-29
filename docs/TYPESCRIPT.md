# TypeScript Configuration - Terra Dominus

Ce document guide la migration progressive vers TypeScript.

## Stratégie de Migration

### Phase 1 : Configuration (✅ Complété)

Installation des dépendances :
```bash
cd backend
npm install --save-dev typescript @types/node @types/express @types/sequelize
npx tsc --init
```

### Phase 2 : Domain Layer (Prioritaire)

Les règles métier sont les premiers fichiers à migrer car :
- Peu de dépendances externes
- Bénéfice immédiat (types explicites)
- Base solide pour les couches supérieures

**Fichiers à migrer** :
1. `modules/combat/domain/combatRules.js` → `combatRules.ts`
2. `modules/world/domain/worldRules.js` → `worldRules.ts`
3. `modules/trade/domain/tradeRules.js` → `tradeRules.ts`
4. `modules/colonization/domain/colonizationRules.js` → `colonizationRules.ts`

### Phase 3 : Application Layer

Migration des services après les domaines.

### Phase 4 : Infrastructure & API

Dernières couches (repositories, controllers).

## Configuration tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "removeComments": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "modules/**/*.ts",
    "services/**/*.ts",
    "controllers/**/*.ts",
    "utils/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "**/__tests__/**",
    "dist"
  ]
}
```

## Types Communs

### Backend Types (`types/index.ts`)

```typescript
// User & Auth
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthPayload {
  userId: number;
  username: string;
}

// Cities
export interface City {
  id: number;
  user_id: number;
  name: string;
  is_capital: boolean;
  coord_x: number | null;
  coord_y: number | null;
  vision_range: number;
  founded_at: Date;
}

// Resources
export interface Resources {
  gold: number;
  metal: number;
  fuel: number;
  energy: number;
}

export type ResourceType = keyof Resources;

// Combat
export type AttackType = 'raid' | 'conquest' | 'siege';
export type AttackStatus = 'traveling' | 'arrived' | 'completed' | 'returning';

export interface AttackData {
  attackerCityId: number;
  defenderCityId: number;
  attackType: AttackType;
  units: UnitQuantity[];
}

export interface UnitQuantity {
  entityId: number;
  quantity: number;
}

// Trade
export type TradeRouteType = 'internal' | 'external';
export type TradeRouteStatus = 'active' | 'inactive' | 'suspended';

export interface TradeRoute {
  id: number;
  owner_user_id: number;
  origin_city_id: number;
  destination_city_id: number;
  route_type: TradeRouteType;
  status: TradeRouteStatus;
  distance: number;
  auto_transfer_enabled: boolean;
}

// Colonization
export type MissionStatus = 'traveling' | 'completed' | 'cancelled';
export type SlotStatus = 'free' | 'reserved' | 'occupied';

export interface ColonizationMission {
  id: number;
  user_id: number;
  departure_city_id: number;
  target_slot_id: number;
  status: MissionStatus;
  departure_time: Date;
  arrival_time: Date;
}

// World
export type TerrainType = 'plains' | 'forest' | 'mountain' | 'hills' | 'desert' | 'water';

export interface WorldTile {
  id: number;
  coord_x: number;
  coord_y: number;
  terrain_type: TerrainType;
  has_city_slot: boolean;
}

export interface TerrainBonus {
  production: Resources;
  description: string;
}

// Service Responses
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Exemple de Migration : combatRules.ts

**Avant (combatRules.js)** :
```javascript
function calculateDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function calculateTravelTime(distance) {
  const TRAVEL_SPEED = 30; // minutes per tile
  return distance * TRAVEL_SPEED * 60 * 1000; // milliseconds
}

module.exports = {
  calculateDistance,
  calculateTravelTime
};
```

**Après (combatRules.ts)** :
```typescript
/**
 * Calculate Manhattan distance between two coordinates
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Calculate travel time based on distance
 * @param distance - Distance in tiles
 * @returns Travel time in milliseconds
 */
export function calculateTravelTime(distance: number): number {
  const TRAVEL_SPEED = 30; // minutes per tile
  return distance * TRAVEL_SPEED * 60 * 1000; // milliseconds
}

/**
 * Calculate combat outcome
 */
export interface CombatOutcome {
  winner: 'attacker' | 'defender';
  attackerLosses: number;
  defenderLosses: number;
  rounds: number;
}

export function calculateCombatOutcome(
  attackerPower: number,
  defenderPower: number
): CombatOutcome {
  const ratio = attackerPower / defenderPower;
  
  if (ratio > 1.5) {
    return {
      winner: 'attacker',
      attackerLosses: Math.floor(attackerPower * 0.1),
      defenderLosses: defenderPower,
      rounds: 2
    };
  } else if (ratio < 0.67) {
    return {
      winner: 'defender',
      attackerLosses: attackerPower,
      defenderLosses: Math.floor(defenderPower * 0.1),
      rounds: 2
    };
  } else {
    return {
      winner: attackerPower > defenderPower ? 'attacker' : 'defender',
      attackerLosses: Math.floor(attackerPower * 0.4),
      defenderLosses: Math.floor(defenderPower * 0.4),
      rounds: 5
    };
  }
}
```

## Scripts package.json

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit"
  }
}
```

## Interopérabilité JS/TS

Pendant la migration, les fichiers JS et TS coexistent :

```javascript
// Dans un fichier .js
const { calculateDistance } = require('./domain/combatRules'); // .ts compilé

// Dans un fichier .ts
import { calculateDistance } from './domain/combatRules';
```

## Bénéfices Attendus

### Court terme
- ✅ Autocomplétion IDE améliorée
- ✅ Détection d'erreurs à la compilation
- ✅ Documentation inline (types)

### Moyen terme
- ✅ Refactoring plus sûr
- ✅ Onboarding facilité (types explicites)
- ✅ Moins de bugs en production

### Long terme
- ✅ Migration complète vers TS
- ✅ Frontend également en TS
- ✅ Types partagés (monorepo)

## Calendrier

| Phase | Fichiers | Durée | Status |
|-------|----------|-------|--------|
| Setup | tsconfig.json, types/ | 1 jour | ✅ |
| Domain | 10 fichiers rules | 1 semaine | 🔄 |
| Services | 15 services | 2 semaines | ⏳ |
| Repositories | 12 repositories | 1 semaine | ⏳ |
| Controllers | 10 controllers | 1 semaine | ⏳ |

## Ressources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node.js + TypeScript Best Practices](https://github.com/goldbergyoni/nodebestpractices#typescript)
- [Sequelize TypeScript](https://sequelize.org/docs/v6/other-topics/typescript/)
