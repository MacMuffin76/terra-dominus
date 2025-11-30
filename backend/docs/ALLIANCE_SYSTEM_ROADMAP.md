# Alliance System Complete - Implementation Roadmap

## 🎯 Overview

The Alliance System Complete feature (Phase 2, Task 2/6) adds three major subsystems to the existing alliance infrastructure:

1. **Treasury System** - Pooled resource management
2. **Territory System** - Map control and bonuses
3. **War System** - Alliance vs alliance conflicts

## 📊 Current Status

### Existing Features (Already Implemented)
- ✅ Alliance CRUD (create, read, update, disband)
- ✅ Member management (invite, join, kick, promote, roles)
- ✅ Role system (leader, officer, member) with permission checks
- ✅ Diplomacy (ally, NAP, war declarations, peace proposals)
- ✅ Search and rankings
- ✅ Join requests system

**Service**: `AllianceService.js` (600+ lines)
**Models**: Alliance, AllianceMember, AllianceInvitation, AllianceJoinRequest, AllianceDiplomacy

### NEW Subsystems Progress

| Subsystem | Database | Models | Repository | Service | Controller | Routes | Tests | Socket.IO | Docs | **Overall** |
|-----------|----------|--------|------------|---------|------------|--------|-------|-----------|------|-------------|
| **Treasury** | ✅ 100% | ✅ 100% | ✅ 100% | ⚠️ 80% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | ⚠️ 20% | **40%** |
| **Territories** | ✅ 100% | ✅ 100% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | **25%** |
| **Wars** | ⚠️ 90% | ✅ 100% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | **25%** |

**Total Alliance System Complete Progress**: ~30% (foundation laid, implementation needed)

---

## 1. Treasury System 💰

### Purpose
Enable alliances to pool resources for:
- War campaigns (funding offensive operations)
- Territory upgrades (defense, garrisons)
- Member support (helping weaker members)
- Alliance upgrades (capacity, bonuses)

### Database Schema

**alliances table** (extended):
```sql
treasury_gold BIGINT DEFAULT 0
treasury_metal BIGINT DEFAULT 0
treasury_fuel BIGINT DEFAULT 0
treasury_energy BIGINT DEFAULT 0
```

**alliance_treasury_logs table**:
```sql
id SERIAL PRIMARY KEY
alliance_id INTEGER REFERENCES alliances(id)
user_id INTEGER REFERENCES users(id) (nullable for system transactions)
transaction_type ENUM('deposit', 'withdraw', 'tax', 'war_loot', 'territory_income', 'upgrade_cost')
resource_type ENUM('gold', 'metal', 'fuel', 'energy')
amount BIGINT (positive for deposits, negative for withdrawals)
balance_before BIGINT
balance_after BIGINT
reason TEXT
metadata JSONB (flexible additional data)
created_at TIMESTAMP
```

**Migration**: `20251130000003-add-alliance-treasury.js` ✅ Succeeded

### Models
- **AllianceTreasuryLog.js** ✅ Complete (70+ lines)
- **Alliance.js** ✅ Extended with 4 treasury fields

### Repository Layer ✅ Complete
**File**: `modules/alliances/infra/AllianceTreasuryRepository.js` (180+ lines)

Methods:
- `getTreasuryBalances(allianceId)` - Fetch current balances
- `updateTreasuryBalance(allianceId, resourceType, amount, transactionType, userId, reason, metadata)` - Atomic update with logging
- `getTransactionHistory(allianceId, filters)` - Paginated transaction logs
- `getMemberContributions(allianceId)` - Aggregated deposits per member

Features:
- Sequelize transactions for atomicity
- Balance validation (prevents negative balances)
- Audit trail (every change logged)
- Aggregation support (SUM GROUP BY for contributions)

### Service Layer ⚠️ 80% Complete
**File**: `modules/alliances/application/AllianceTreasuryService.js` (200+ lines)

Methods implemented:
- `depositResources(allianceId, userId, resources)` - Multi-resource atomic deposits
- `withdrawResources(allianceId, userId, recipientUserId, resources, reason)` - Officer/leader only
- `getTreasuryBalances(allianceId)` - Get current balances
- `getTransactionHistory(allianceId, filters)` - Get logs with filters
- `getMemberContributions(allianceId)` - Contribution leaderboard
- `collectTax(allianceId, taxRate)` - TODO: Automated tax

**⚠️ BLOCKER**: Service uses incorrect Resource model (assumes direct userId link). Actual architecture is User → City → Resource. **Must refactor to use ResourceService** before production.

### API Layer ❌ Not Started
**File**: `controllers/allianceTreasuryController.js` (NOT CREATED)

Required endpoints:
```javascript
GET    /api/v1/alliances/:id/treasury           // Get balances
POST   /api/v1/alliances/:id/treasury/deposit   // Deposit resources
POST   /api/v1/alliances/:id/treasury/withdraw  // Withdraw (officer/leader)
GET    /api/v1/alliances/:id/treasury/history   // Transaction logs
GET    /api/v1/alliances/:id/treasury/contributions  // Member leaderboard
```

Estimated: 120-150 lines, 3-4 hours

### Tests ❌ Not Started
**File**: `__tests__/allianceTreasury.test.js` (NOT CREATED)

Test suites needed:
1. Deposit flow (valid, insufficient funds, non-member)
2. Withdraw flow (permissions, insufficient treasury)
3. Transaction history pagination/filtering
4. Member contributions aggregation
5. Concurrent operations (race conditions)
6. Tax collection (when implemented)

Estimated: 200-300 lines, 4-5 hours

### Socket.IO ❌ Not Started
Events to add:
- `alliance:treasury:updated` - Balances changed
- `alliance:treasury:transaction` - New transaction logged

Estimated: 30-40 lines, 2-3 hours

### Documentation ⚠️ 20% Complete
- ✅ ALLIANCE_TREASURY_STATUS.md (implementation status)
- ❌ ALLIANCE_TREASURY.md (user guide)
- ❌ Swagger/OpenAPI specs

Estimated: 2-3 hours

### Treasury Remaining Work
| Task | Effort | Priority |
|------|--------|----------|
| Fix ResourceService integration | 4-6h | 🔴 CRITICAL |
| Create controller + routes | 3-4h | 🔴 HIGH |
| Write comprehensive tests | 4-5h | 🔴 HIGH |
| Socket.IO events | 2-3h | 🟡 MEDIUM |
| Documentation | 2-3h | 🟡 MEDIUM |
| Advanced features (tax, limits) | 8-10h | 🟢 LOW |

**Total**: 23-31 hours remaining (11-15h for production-ready MVP)

---

## 2. Territory System 🗺️

### Purpose
Enable alliances to capture and control strategic locations on the map for:
- Resource production bonuses
- Strategic positioning (vision, spawn points)
- Defensive strongholds
- Economic hubs (trade bonuses)

### Database Schema

**alliances table** (extended):
```sql
territories_controlled INTEGER DEFAULT 0
```

**alliance_territories table**:
```sql
id SERIAL PRIMARY KEY
alliance_id INTEGER REFERENCES alliances(id) ON DELETE CASCADE
name VARCHAR(255) NOT NULL
territory_type ENUM('strategic_point', 'resource_node', 'defensive_outpost', 'trade_hub')
coord_x INTEGER NOT NULL
coord_y INTEGER NOT NULL
radius INTEGER DEFAULT 5 (area of influence)
control_points INTEGER DEFAULT 100 (maintenance cost/capture progress)
bonuses JSONB (flexible: { gold_production: 1.2, vision_range: 10, ... })
captured_at TIMESTAMP NOT NULL DEFAULT NOW()
last_attack TIMESTAMP (last time contested)
defense_level INTEGER DEFAULT 1 (1-10, upgradeable)
garrison_strength INTEGER DEFAULT 0 (military power defending)
created_at TIMESTAMP
updated_at TIMESTAMP

UNIQUE CONSTRAINT (coord_x, coord_y) -- One territory per location
```

**Migration**: `20251130000004-create-alliance-territories.js` ✅ Succeeded

### Models
- **AllianceTerritory.js** ✅ Complete (90+ lines)

### Territory Types & Bonuses

1. **strategic_point** - Vision and positioning
   - Bonuses: `{ vision_range: 15, spawn_radius: 10, defense_bonus: 1.1 }`
   - Use case: Map control, early warning, teleport anchors

2. **resource_node** - Production multipliers
   - Bonuses: `{ gold_production: 1.3, metal_production: 1.3 }`
   - Use case: Economic advantage, faster growth

3. **defensive_outpost** - Military strongholds
   - Bonuses: `{ garrison_capacity: 500, defense_bonus: 1.5, repair_speed: 1.2 }`
   - Use case: Border defense, war frontlines

4. **trade_hub** - Economic centers
   - Bonuses: `{ trade_tax_reduction: 0.8, market_fee_reduction: 0.9, gold_production: 1.2 }`
   - Use case: Alliance economy, trade routes

### Capture Mechanics (TO IMPLEMENT)

**Requirements for Capture**:
1. Alliance must not be at war with territory owner
2. Must have military units in capture radius
3. Capture progress = (Attacker Strength / Defense Strength) × Time
4. Control points decrease from 100 → 0 over time
5. When control_points = 0, territory changes ownership

**Defense Mechanics**:
- Defense = (defense_level × 10) + garrison_strength
- Garrison can be reinforced by alliance members
- Defense level upgrades cost treasury resources

**Bonuses Application**:
- Bonuses apply to all alliance members' cities within radius
- Production bonuses stack additively (max 2x)
- Vision bonuses apply immediately

### Repository Layer ❌ Not Started
**File**: `modules/alliances/infra/AllianceTerritoryRepository.js` (NOT CREATED)

Methods needed:
- `getAllianceTerritories(allianceId)` - Fetch all controlled territories
- `getTerritoryByCoords(x, y)` - Find territory at location
- `getTerritoryById(id)` - Get single territory with details
- `claimTerritory(allianceId, name, type, x, y)` - Capture new territory
- `upgradeTerritoryDefense(territoryId, newLevel)` - Upgrade defense
- `updateGarrison(territoryId, strength)` - Set garrison strength
- `releaseTerritory(territoryId)` - Abandon/lose territory
- `getTerritoriesInRange(x, y, range)` - Spatial query for nearby territories

Estimated: 150-200 lines, 3-4 hours

### Service Layer ❌ Not Started
**File**: `modules/alliances/application/AllianceTerritoryService.js` (NOT CREATED)

Methods needed:
- `getAllianceTerritories(allianceId)` - Get all territories
- `captureTerritoryStart(allianceId, x, y, territoryType, name)` - Initiate capture
- `captureTerritoryProgress(territoryId, attackStrength)` - Update capture progress
- `captureTerritoryComplete(territoryId, allianceId)` - Finalize capture
- `upgradeTerritoryDefense(allianceId, territoryId, userId)` - Upgrade (costs treasury)
- `reinforceGarrison(allianceId, territoryId, userId, units)` - Add garrison
- `withdrawGarrison(allianceId, territoryId, userId, units)` - Remove garrison
- `abandonTerritory(allianceId, territoryId, userId)` - Release territory
- `getTerritoryBonuses(userId)` - Calculate bonuses for user based on location
- `applyTerritoryBonuses(userId, baseProduction)` - Apply multipliers

Features to implement:
- Capture cooldown (can't recapture immediately after losing)
- Garrison unit types (defenders, turrets, walls)
- Territory maintenance cost (daily fuel/energy drain)
- Territory contest alerts (notify alliance when under attack)
- Integration with ResourceService for bonus application

Estimated: 250-300 lines, 6-8 hours

### API Layer ❌ Not Started
**File**: `controllers/allianceTerritoryController.js` (NOT CREATED)

Required endpoints:
```javascript
GET    /api/v1/alliances/:id/territories               // List territories
GET    /api/v1/alliances/:id/territories/:territoryId  // Territory details
POST   /api/v1/alliances/:id/territories               // Initiate capture
PATCH  /api/v1/alliances/:id/territories/:territoryId/defense  // Upgrade defense
POST   /api/v1/alliances/:id/territories/:territoryId/garrison // Reinforce
DELETE /api/v1/alliances/:id/territories/:territoryId  // Abandon

GET    /api/v1/map/territories                         // All territories (map view)
GET    /api/v1/map/territories/range?x=10&y=20&r=50    // Nearby territories
```

Estimated: 150-200 lines, 4-5 hours

### Tests ❌ Not Started
**File**: `__tests__/allianceTerritory.test.js` (NOT CREATED)

Test suites:
1. Capture mechanics (start, progress, complete)
2. Defense upgrades (cost, treasury deduction)
3. Garrison management (add, remove, unit types)
4. Territory abandon (voluntary release)
5. Bonus calculations (production multipliers)
6. Spatial queries (territories in range)
7. Conflict resolution (two alliances capturing same spot)

Estimated: 250-300 lines, 5-6 hours

### Integration Requirements
- **Map System**: Display territories on world map with alliance colors
- **Combat System**: Link garrison to battle outcomes
- **Resource Production**: Apply territory bonuses to getUserResources()
- **Socket.IO**: Real-time territory capture updates

### Territory Remaining Work
| Task | Effort | Priority |
|------|--------|----------|
| Repository layer | 3-4h | 🔴 HIGH |
| Service layer (capture mechanics) | 6-8h | 🔴 HIGH |
| Service layer (bonuses) | 3-4h | 🔴 HIGH |
| Controller + routes | 4-5h | 🔴 HIGH |
| Tests | 5-6h | 🔴 HIGH |
| Map integration | 3-4h | 🟡 MEDIUM |
| Socket.IO events | 2-3h | 🟡 MEDIUM |
| Documentation | 2-3h | 🟡 MEDIUM |

**Total**: 28-37 hours

---

## 3. War System ⚔️

### Purpose
Enable alliances to engage in formal wars with:
- War declarations and goals
- Score tracking (victory points)
- Battle logging and territory contests
- Winner determination and rewards

### Database Schema

**alliances table** (extended):
```sql
wars_won INTEGER DEFAULT 0
wars_lost INTEGER DEFAULT 0
```

**alliance_wars table**:
```sql
id SERIAL PRIMARY KEY
attacker_alliance_id INTEGER REFERENCES alliances(id) ON DELETE CASCADE
defender_alliance_id INTEGER REFERENCES alliances(id) ON DELETE CASCADE
declared_by INTEGER REFERENCES users(id) (user who declared)
status ENUM('active', 'ceasefire', 'ended')
war_goal TEXT (reason for war)
attacker_score INTEGER DEFAULT 0
defender_score INTEGER DEFAULT 0
attacker_casualties JSONB (e.g., { tanks: 50, infantry: 200 })
defender_casualties JSONB
territories_contested JSONB (array of territory IDs)
war_terms JSONB (peace treaty terms, reparations)
started_at TIMESTAMP NOT NULL DEFAULT NOW()
ended_at TIMESTAMP
winner_alliance_id INTEGER REFERENCES alliances(id)
created_at TIMESTAMP
updated_at TIMESTAMP
```

**alliance_war_battles table**:
```sql
id SERIAL PRIMARY KEY
war_id INTEGER REFERENCES alliance_wars(id) ON DELETE CASCADE
battle_report_id INTEGER (optional link to combat reports)
attacker_user_id INTEGER REFERENCES users(id)
defender_user_id INTEGER REFERENCES users(id)
outcome ENUM('attacker_victory', 'defender_victory', 'draw')
points_awarded INTEGER (added to war score)
resources_pillaged JSONB (resources stolen: { gold: 1000, ... })
territory_captured INTEGER REFERENCES alliance_territories(id) (nullable)
occurred_at TIMESTAMP NOT NULL
```

**Migration**: `20251130000005-create-alliance-wars.js` ⚠️ Partial success (tables created, index errors)

### Models
- **AllianceWar.js** ✅ Complete (110+ lines)
- **AllianceWarBattle.js** ✅ Complete (70+ lines)

### War Mechanics (TO IMPLEMENT)

**War Declaration**:
1. Leader/officer can declare war on another alliance
2. Must provide war_goal (reason)
3. Can only have 1 active war at a time per alliance pair
4. War status = 'active'

**Score System**:
- Victory points awarded for:
  - Winning battles: +10 points per victory
  - Destroying units: +1 point per 100 combat power destroyed
  - Pillaging resources: +1 point per 10,000 resources stolen
  - Capturing territories: +50 points per territory
- First to reach score threshold (e.g., 1000 points) can demand peace
- If defender reaches 0 territories, attacker auto-wins

**Battle Integration**:
- Existing combat system generates battle reports
- When combatants are in different alliances with active war:
  - Create AllianceWarBattle entry
  - Award points based on outcome
  - Update war scores
  - Check for winner conditions

**Ceasefire & Peace**:
- Either side can propose ceasefire (pauses point accumulation)
- Peace terms can include:
  - Resource reparations (loser pays winner treasury)
  - Territory transfers
  - NAP duration (forced peace period)
- Both sides must accept peace terms to end war

**Winner Determination**:
- War ends when:
  - Score threshold reached + peace accepted
  - One alliance disbanded
  - Mutual peace agreement
- Winner receives:
  - +1 wars_won statistic
  - Reparation resources
  - Contested territories
- Loser receives:
  - +1 wars_lost statistic

### Repository Layer ❌ Not Started
**File**: `modules/alliances/infra/AllianceWarRepository.js` (NOT CREATED)

Methods needed:
- `createWar(attackerId, defenderId, declaredBy, warGoal)` - Start new war
- `getActiveWars(allianceId)` - Get all active wars for alliance
- `getWarById(warId)` - Get war details
- `updateWarScore(warId, attackerDelta, defenderDelta)` - Update scores
- `addCasualties(warId, side, casualties)` - Increment casualty counts
- `recordBattle(warId, battleData)` - Create AllianceWarBattle entry
- `proposeTerms(warId, proposedBy, terms)` - Suggest peace terms
- `acceptTerms(warId, acceptedBy)` - Accept peace terms
- `endWar(warId, winnerId, terms)` - Finalize war
- `getWarHistory(allianceId, limit)` - Past wars

Estimated: 200-250 lines, 4-5 hours

### Service Layer ❌ Not Started
**File**: `modules/alliances/application/AllianceWarService.js` (NOT CREATED)

Methods needed:
- `declareWar(attackerAllianceId, defenderAllianceId, declaredBy, warGoal)` - Start war
- `getActiveWars(allianceId)` - Get current wars
- `getWarDetails(warId)` - Full war info with battles
- `recordBattleOutcome(warId, battleData)` - Log battle result
  - Called by CombatService when battle involves war participants
  - Award points based on outcome
  - Update casualties
  - Check territory capture
  - Check winner conditions
- `proposePeace(warId, proposedBy, terms)` - Offer peace terms
- `acceptPeace(warId, acceptedBy)` - Accept peace
- `rejectPeace(warId, rejectedBy)` - Reject peace
- `calculateWarScore(battleOutcome)` - Points algorithm
- `checkWinnerConditions(warId)` - Determine if war should end
- `finalizeWar(warId, winnerId)` - Execute war end (transfer resources, territories)

Features to implement:
- War cooldown (can't declare war on same alliance for X days after peace)
- War cost (initial treasury cost to declare)
- War exhaustion (penalties for prolonged wars)
- War rewards (bonus to winner treasury from loser)
- Notifications (war declared, battle logged, peace offered, war ended)

Estimated: 300-350 lines, 8-10 hours

### API Layer ❌ Not Started
**File**: `controllers/allianceWarController.js` (NOT CREATED)

Required endpoints:
```javascript
POST   /api/v1/alliances/:id/wars                  // Declare war
GET    /api/v1/alliances/:id/wars                  // List active wars
GET    /api/v1/alliances/:id/wars/:warId           // War details
GET    /api/v1/alliances/:id/wars/:warId/battles   // Battle history

POST   /api/v1/alliances/:id/wars/:warId/peace     // Propose peace terms
POST   /api/v1/alliances/:id/wars/:warId/accept    // Accept peace
POST   /api/v1/alliances/:id/wars/:warId/reject    // Reject peace

GET    /api/v1/alliances/:id/wars/history          // Past wars
```

Estimated: 150-200 lines, 4-5 hours

### Tests ❌ Not Started
**File**: `__tests__/allianceWar.test.js` (NOT CREATED)

Test suites:
1. War declaration (permissions, restrictions)
2. Battle outcome recording (score updates, casualties)
3. Peace proposal and acceptance (terms execution)
4. Winner determination (score threshold, conditions)
5. War rewards (resource transfers, territory transfers)
6. Multiple concurrent wars
7. War cooldown enforcement

Estimated: 250-300 lines, 5-6 hours

### Integration Requirements
- **Combat System**: Hook into CombatService to detect alliance war battles
- **Alliance Diplomacy**: Wars affect diplomatic relations (auto-set to 'war' status)
- **Territory System**: Territory captures during wars award points
- **Treasury System**: War costs and reparations deducted/added to treasuries
- **Socket.IO**: Real-time war updates (battles, scores, peace offers)

### War Remaining Work
| Task | Effort | Priority |
|------|--------|----------|
| Fix migration (remove index duplicates) | 1h | 🔴 CRITICAL |
| Repository layer | 4-5h | 🔴 HIGH |
| Service layer (war mechanics) | 8-10h | 🔴 HIGH |
| Combat integration | 4-5h | 🔴 HIGH |
| Controller + routes | 4-5h | 🔴 HIGH |
| Tests | 5-6h | 🔴 HIGH |
| Socket.IO events | 3-4h | 🟡 MEDIUM |
| Documentation | 2-3h | 🟡 MEDIUM |

**Total**: 31-43 hours

---

## 📅 Implementation Timeline

### Phase A: Treasury Production-Ready (11-15 hours)
**Goal**: Complete and deploy treasury system

1. **Fix Resource Integration** (4-6h) 🔴 CRITICAL
   - Refactor AllianceTreasuryService to use ResourceService
   - Test with User → City → Resource architecture
   - Verify deposits and withdrawals work correctly

2. **API Layer** (3-4h) 🔴 HIGH
   - Create AllianceTreasuryController
   - Add routes to allianceRoutes.js
   - Manual API testing

3. **Tests** (4-5h) 🔴 HIGH
   - Unit tests for service methods
   - Integration tests for deposit/withdraw flows
   - Permission and validation tests

**Deliverable**: Fully functional treasury system, production-ready

---

### Phase B: Territory System (28-37 hours)
**Goal**: Complete territory capture and control system

1. **Repository + Service** (12-16h) 🔴 HIGH
   - AllianceTerritoryRepository (3-4h)
   - AllianceTerritoryService - capture mechanics (6-8h)
   - AllianceTerritoryService - bonuses (3-4h)

2. **API Layer** (4-5h) 🔴 HIGH
   - AllianceTerritoryController
   - Routes and validation

3. **Tests** (5-6h) 🔴 HIGH
   - Capture flow tests
   - Bonus calculation tests
   - Spatial query tests

4. **Integrations** (7-10h) 🟡 MEDIUM
   - Map system integration (3-4h)
   - Resource production bonuses (2-3h)
   - Socket.IO events (2-3h)

**Deliverable**: Territory control system with bonuses

---

### Phase C: War System (31-43 hours)
**Goal**: Complete alliance war mechanics

1. **Fix Migration** (1h) 🔴 CRITICAL
   - Resolve duplicate index errors
   - Verify tables are correct

2. **Repository + Service** (16-20h) 🔴 HIGH
   - AllianceWarRepository (4-5h)
   - AllianceWarService - war mechanics (8-10h)
   - Combat system integration (4-5h)

3. **API Layer** (4-5h) 🔴 HIGH
   - AllianceWarController
   - Routes and validation

4. **Tests** (5-6h) 🔴 HIGH
   - War declaration tests
   - Battle recording tests
   - Peace terms tests

5. **Integrations** (5-7h) 🟡 MEDIUM
   - Territory capture during wars (2-3h)
   - Socket.IO events (3-4h)

**Deliverable**: Full war system with battle tracking and victory conditions

---

### Phase D: Polish & Documentation (10-15 hours)
**Goal**: Production-ready documentation and advanced features

1. **Documentation** (6-9h) 🟡 MEDIUM
   - ALLIANCE_TREASURY.md user guide (2-3h)
   - ALLIANCE_TERRITORY.md user guide (2-3h)
   - ALLIANCE_WAR.md user guide (2-3h)

2. **Advanced Features** (4-6h) 🟢 LOW
   - Treasury tax collection
   - Territory maintenance costs
   - War exhaustion penalties

**Deliverable**: Complete documentation and advanced features

---

## 🎯 Total Effort Estimate

| Subsystem | Effort | Status |
|-----------|--------|--------|
| Treasury | 11-15h (MVP) | ⚠️ 40% complete |
| Territories | 28-37h | ⚠️ 25% complete |
| Wars | 31-43h | ⚠️ 25% complete |
| Polish & Docs | 10-15h | ❌ 0% complete |
| **TOTAL** | **80-110 hours** | **~30% complete** |

**Critical Path**: Treasury (fix) → Treasury (API) → Territories → Wars

**Estimated Time to Completion**: 50-80 hours remaining work

---

## ✅ Definition of Done

Alliance System Complete will be considered **DONE** when:

1. **Treasury System**:
   - ✅ All CRUD operations functional (deposit, withdraw, balances)
   - ✅ Transaction logging and auditing
   - ✅ Permission checks (officer/leader for withdrawals)
   - ✅ API endpoints tested and documented
   - ✅ Socket.IO real-time updates
   - ✅ Unit and integration tests passing

2. **Territory System**:
   - ✅ Territory capture mechanics functional
   - ✅ Defense upgrades and garrison management
   - ✅ Bonus calculations and application
   - ✅ Map integration (visual display)
   - ✅ API endpoints tested and documented
   - ✅ Tests passing

3. **War System**:
   - ✅ War declarations and tracking
   - ✅ Battle integration with combat system
   - ✅ Score tracking and winner determination
   - ✅ Peace terms and war rewards
   - ✅ API endpoints tested and documented
   - ✅ Tests passing

4. **Documentation**:
   - ✅ User guides for all three subsystems
   - ✅ API documentation (Swagger)
   - ✅ Developer setup instructions

5. **Production Readiness**:
   - ✅ All tests passing (100% pass rate)
   - ✅ No critical bugs
   - ✅ Performance tested (large alliances, many wars)
   - ✅ Database migrations verified

---

## 🚀 Next Actions

### IMMEDIATE (This Week)
1. **Fix Treasury ResourceService integration** (4-6h) 🔴
2. **Create Treasury API endpoints** (3-4h) 🔴
3. **Write Treasury tests** (4-5h) 🔴

### SHORT TERM (Next 2 Weeks)
4. **Implement Territory repository & service** (12-16h)
5. **Create Territory API** (4-5h)
6. **Test Territory system** (5-6h)

### MEDIUM TERM (Next Month)
7. **Fix War migration** (1h)
8. **Implement War repository & service** (16-20h)
9. **Create War API** (4-5h)
10. **Test War system** (5-6h)

### LONG TERM (After 1 Month)
11. **Integrate with Map system** (3-4h)
12. **Integrate with Combat system** (4-5h)
13. **Write complete documentation** (6-9h)
14. **Performance testing** (3-4h)

---

**Document Status**: Living document, updated as implementation progresses
**Last Updated**: Phase 2 Task 2 (Alliance System Complete) - Initial roadmap
**Next Update**: After Treasury system is production-ready
