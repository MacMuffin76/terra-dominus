# Upkeep System Documentation

## Overview

The Upkeep System is a crucial economic balance mechanic for Terra Dominus PvP. It prevents infinite army accumulation by requiring hourly maintenance costs for all units.

## Purpose

- **Economic Balance**: Large armies must be sustainable through resource production
- **Anti-Snowball**: Dominant players can't maintain overwhelming forces without economic investment
- **Strategic Depth**: Players must balance military spending with economic growth
- **Resource Sink**: Creates constant demand for gold, metal, and fuel

## How It Works

### 1. Upkeep Costs

Each unit type has an hourly maintenance cost:

| Unit | Tier | Gold/h | Metal/h | Fuel/h | Total Cost (100 units) |
|------|------|--------|---------|--------|------------------------|
| Militia | 1 | 1 | 0 | 0 | 100g/h |
| Infantry | 1 | 1 | 0 | 0 | 100g/h |
| Archer | 1 | 1 | 0 | 0 | 100g/h |
| Cavalry | 2 | 2 | 1 | 1 | 200g + 100m + 100f/h |
| Spearmen | 2 | 2 | 0 | 0 | 200g/h |
| Artillery | 2 | 3 | 2 | 2 | 300g + 200m + 200f/h |
| Engineer | 2 | 2 | 1 | 0 | 200g + 100m/h |
| Tanks | 3 | 5 | 3 | 3 | 500g + 300m + 300f/h |
| Anti-Tank | 3 | 4 | 2 | 2 | 400g + 200m + 200f/h |
| Aircraft | 3 | 8 | 5 | 5 | 800g + 500m + 500f/h |
| Anti-Air | 3 | 6 | 4 | 3 | 600g + 400m + 300f/h |
| Mech | 4 | 15 | 10 | 10 | 1500g + 1000m + 1000f/h |
| Stealth Bomber | 4 | 20 | 12 | 15 | 2000g + 1200m + 1500f/h |
| Spy | 2 | 3 | 0 | 1 | 300g + 100f/h |

### 2. Hourly Processing

Every hour (at minute 0), the upkeep job runs:

```javascript
// Cron schedule: '0 * * * *' (every hour at :00)
```

**Process**:
1. Calculate total upkeep for each city with units
2. Check if city has sufficient resources
3. **If sufficient**: Deduct upkeep from resources
4. **If insufficient**: Disband 10% of all units, send notification

### 3. Disbanding Mechanism

When a city cannot pay upkeep:
- **10% of each unit type** is disbanded (rounded up)
- Player receives notification about disbanded units
- Resources are NOT deducted (no negative balance)
- Process repeats next hour if still insufficient

**Example**:
- City has: 100 Cavalry, 50 Tanks
- Cannot pay upkeep
- **Result**: 10 Cavalry + 5 Tanks disbanded
- **Remaining**: 90 Cavalry + 45 Tanks

### 4. Database Schema

**Tables**:

```sql
-- Unit upkeep costs
CREATE TABLE unit_upkeep (
  unit_id INTEGER PRIMARY KEY,
  gold_per_hour INTEGER NOT NULL DEFAULT 0,
  metal_per_hour INTEGER NOT NULL DEFAULT 0,
  fuel_per_hour INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (unit_id) REFERENCES entities(entity_id)
);

-- Unit extended stats (includes counter system)
CREATE TABLE unit_stats (
  unit_id INTEGER PRIMARY KEY,
  unit_key VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  tier INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL,
  attack INTEGER NOT NULL DEFAULT 1,
  defense INTEGER NOT NULL DEFAULT 1,
  health INTEGER NOT NULL DEFAULT 10,
  initiative INTEGER NOT NULL DEFAULT 10,
  speed DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  carry_capacity INTEGER NOT NULL DEFAULT 0,
  train_time_seconds INTEGER NOT NULL DEFAULT 60,
  counters JSON NOT NULL DEFAULT '[]',
  weak_to JSON NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (unit_id) REFERENCES entities(entity_id)
);
```

## API Endpoints

### GET /api/v1/upkeep/report
Get player's full upkeep report.

**Response**:
```json
{
  "success": true,
  "data": {
    "upkeep": {
      "gold": 1250,
      "metal": 680,
      "fuel": 540
    },
    "hourlyIncome": {
      "gold": 2000,
      "metal": 1000,
      "fuel": 800
    },
    "netIncome": {
      "gold": 750,
      "metal": 320,
      "fuel": 260
    },
    "upkeepPercentage": {
      "gold": 62.5,
      "metal": 68.0,
      "fuel": 67.5
    },
    "isAffordable": true,
    "warning": false
  }
}
```

### GET /api/v1/upkeep/city/:cityId
Get detailed upkeep for a specific city.

**Response**:
```json
{
  "success": true,
  "data": {
    "gold": 450,
    "metal": 280,
    "fuel": 240,
    "units": [
      {
        "unitId": 1040,
        "unitName": "Cavalry",
        "quantity": 100,
        "goldPerHour": 200,
        "metalPerHour": 100,
        "fuelPerHour": 100
      },
      {
        "unitId": 1044,
        "unitName": "Tanks",
        "quantity": 50,
        "goldPerHour": 250,
        "metalPerHour": 150,
        "fuelPerHour": 150
      }
    ]
  }
}
```

### POST /api/v1/upkeep/process (Admin Only)
Manually trigger upkeep processing.

**Response**:
```json
{
  "success": true,
  "data": {
    "processed": 145,
    "warnings": [
      {
        "cityId": 23,
        "cityName": "Player City",
        "userId": 5,
        "upkeepNeeded": { "gold": 500, "metal": 200, "fuel": 150 },
        "resourcesAvailable": { "gold": 300, "metal": 100, "fuel": 50 },
        "shortfall": { "gold": 200, "metal": 100, "fuel": 100 }
      }
    ],
    "disbanded": [
      {
        "cityId": 23,
        "cityName": "Player City",
        "userId": 5,
        "unitsDisbanded": [
          { "unitId": 1040, "unitName": "Cavalry", "quantityLost": 10, "quantityRemaining": 90 }
        ]
      }
    ]
  }
}
```

## Code Architecture

### Service Layer

**`UpkeepService`** (`backend/modules/combat/application/UpkeepService.js`):
- `calculateCityUpkeep(cityId)` - Calculate upkeep for one city
- `calculateUserUpkeep(userId)` - Calculate upkeep for all user's cities
- `processHourlyUpkeep()` - Main cron job logic
- `disbandUnitsForNonPayment(cityId, percentage, transaction)` - Disband units
- `getUpkeepReport(userId)` - Generate dashboard report

### Cron Job

**`upkeepJob`** (`backend/jobs/upkeepJob.js`):
- Runs every hour at minute 0
- Calls `upkeepService.processHourlyUpkeep()`
- Sends notifications via NotificationService
- Logs results

### Models

- **`UnitUpkeep`** (`backend/models/UnitUpkeep.js`) - Upkeep costs per unit
- **`UnitStats`** (`backend/models/UnitStats.js`) - Extended unit attributes + counters
- **Associations**: Entity hasOne UnitUpkeep, Entity hasOne UnitStats

## Balance Targets

### Upkeep Percentage
- **Ideal**: 10-15% of production for large armies
- **Warning threshold**: 80%+ of production
- **Sustainable army size**: 200-300 mixed units per city at mid-game

### Economic Impact
- **Early game** (Tier 1 units): 100-200 gold/hour (easily sustainable)
- **Mid game** (Tier 2-3 mix): 500-800 gold/hour (requires investment)
- **Late game** (Tier 3-4): 1500-3000 gold/hour (major commitment)

### Strategic Implications
1. **Quality vs Quantity**: Expensive units have higher upkeep, must provide value
2. **Economic Investment**: Players must build production to sustain armies
3. **Raid Value**: Successful raids must yield 2-3x upkeep cost to be profitable
4. **Defense Efficiency**: Defenders pay upkeep, attackers raid for profit

## Testing

### Manual Test
```bash
node backend/scripts/testUpkeep.js
```

### Test Coverage
```javascript
describe('UpkeepService', () => {
  it('should calculate city upkeep correctly');
  it('should calculate user upkeep across all cities');
  it('should deduct resources when affordable');
  it('should disband 10% of units when not affordable');
  it('should send notifications for warnings');
  it('should handle multiple cities with mixed unit types');
});
```

## Integration

### With Combat System
- Counter bonuses calculated in `combatRules.calculateArmyStrengthWithCounters()`
- Loot rebalanced to 20%/40%/10% (raid/conquest/siege)
- Successful attacks must overcome upkeep costs to be profitable

### With Dashboard
- Display hourly upkeep in resources panel
- Show "Net Income" (production - upkeep)
- Warning indicator when upkeep > 80% of production
- Detailed breakdown per city

### With Notifications
- **upkeep_warning**: Resources insufficient
- **units_disbanded**: Units lost due to non-payment

## Future Enhancements

1. **Upkeep Reduction Technologies**: Research to reduce upkeep by 10-20%
2. **Alliance Support**: Alliance members can contribute resources for upkeep
3. **Veteran Bonus**: Long-serving units cost 5% less upkeep
4. **Grace Period**: 2-hour grace period before first disbanding
5. **Partial Disbanding Priority**: Disband weakest/oldest units first

## Configuration

Edit upkeep costs in migration:
```javascript
// backend/migrations/20251130200000-seed-balanced-units.js
upkeepCosts.push({
  unit_id: entityId,
  gold_per_hour: unit.upkeepPerHour.gold || 0,
  metal_per_hour: unit.upkeepPerHour.metal || 0,
  fuel_per_hour: unit.upkeepPerHour.fuel || 0,
  created_at: now,
  updated_at: now
});
```

Edit disbanding percentage:
```javascript
// backend/modules/combat/application/UpkeepService.js
const disbandResult = await this.disbandUnitsForNonPayment(
  city.id,
  0.10, // 10% per hour - adjust here
  transaction
);
```

## Summary

The Upkeep System creates a sustainable economic cycle:
1. Players build armies (one-time cost)
2. Armies require hourly upkeep (ongoing cost)
3. Players must maintain economic infrastructure
4. Raids must be profitable vs upkeep costs
5. Failed payment = gradual unit loss

This prevents army hoarding while maintaining strategic flexibility. Players can maintain large forces, but only if economically justified.
