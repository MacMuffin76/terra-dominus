# Portal Quest System - Technical Implementation

**Date:** November 30, 2024  
**Status:** Backend & Frontend Complete ✅  
**Progress:** 20h / 30h (67%)

---

## Overview

Complete quest system implementation for Terra Dominus with story progression, daily/weekly quests, achievements, and a streak system. This system gates portal tier unlocks behind story quest completion, provides recurring engagement through daily quests, and rewards consistent play with streak bonuses.

---

## Architecture

### Database Schema (5 Tables)

#### 1. `portal_quests` - Master Quest Definitions
```sql
quest_id SERIAL PRIMARY KEY
quest_type ENUM('story', 'daily', 'weekly', 'achievement')
quest_category VARCHAR(50)
title VARCHAR(255)
description TEXT
chapter INTEGER (for story quests)
order_in_chapter INTEGER
prerequisite_quest_id INTEGER FK(self-referential)
objectives JSONB[] - Array of {type, target, description, filters}
rewards JSONB - {gold, experience, units, blueprints, unlocks, titles}
is_active BOOLEAN
required_level INTEGER
required_mastery_tier INTEGER
```

**Indexes:** quest_type, chapter, is_active

#### 2. `user_quests` - Player Progress Tracking
```sql
user_quest_id SERIAL PRIMARY KEY
user_id INTEGER FK
quest_id INTEGER FK
status ENUM('active', 'completed', 'failed', 'abandoned')
progress JSONB[] - Array of {type, target, current, description}
started_at TIMESTAMP
completed_at TIMESTAMP
expires_at TIMESTAMP (for daily/weekly)
rewards_claimed BOOLEAN
UNIQUE(user_id, quest_id)
```

**Indexes:** user_id, quest_id, status, expires_at

#### 3. `user_quest_unlocks` - Content Unlocks
```sql
unlock_id SERIAL PRIMARY KEY
user_id INTEGER FK
unlock_type VARCHAR(50) - 'portal_tier', 'feature', 'blueprint', 'title'
unlock_key VARCHAR(100) - 'portal_tier_green', 'title_s_rank'
unlocked_by_quest_id INTEGER FK
unlocked_at TIMESTAMP
UNIQUE(user_id, unlock_type, unlock_key)
```

**Indexes:** user_id, unlock_type

#### 4. `daily_quest_rotation` - Daily Quest Management
```sql
rotation_id SERIAL PRIMARY KEY
date DATE UNIQUE
quest_ids INTEGER[3] - Array of 3 daily quest IDs
created_at TIMESTAMP
```

**Index:** date

#### 5. `quest_streaks` - Streak Tracking
```sql
user_id INTEGER PRIMARY KEY FK
current_streak INTEGER
longest_streak INTEGER
last_completed_date DATE
```

---

## Backend Implementation

### 1. Sequelize Models (Factory Pattern)

**PortalQuest.js** - 7 Instance Methods
- `isStoryQuest()` - Check if story quest
- `isRepeatable()` - Check if daily/weekly
- `hasPrerequisite()` - Check prerequisite
- `getObjectiveCount()` - Count objectives
- `getTotalRewardGold()` - Extract gold reward
- `getSummary()` - Complete quest object

**UserQuest.js** - 10 Instance Methods
- `isActive()`, `isCompleted()`, `isExpired()`, `canClaimRewards()`
- `getProgressPercent()` - Calculate completion %
- `getAllObjectivesComplete()` - Check all objectives
- `updateProgress(index, increment)` - Increment objective
- `markCompleted()` - Set completed status
- `claimRewards()` - Mark rewards claimed
- `getSummary()` - Complete progress object

**UserQuestUnlock.js** - 5 Instance Methods
- Type checks: `isPortalTierUnlock()`, `isFeatureUnlock()`, `isBlueprintUnlock()`, `isTitleUnlock()`
- `getUnlockDetails()` - Complete unlock object

**DailyQuestRotation.js** - 6 Instance Methods
- `isToday()`, `isExpired()` - Date checks
- `getQuestIds()`, `hasQuestId()` - Quest management
- `getSummary()` - Complete rotation object
- Class methods: `getTodayDate()`, `getYesterdayDate()`

**QuestStreak.js** - 8 Instance Methods
- `getStreakBonus()` - Calculate bonus multiplier (max 50%)
- `getStreakBonusPercent()` - Get bonus percentage
- `incrementStreak()` - Increment daily streak
- `resetStreak()` - Reset to 0
- `shouldResetStreak()` - Check if missed day
- `canIncrementToday()` - Check if already incremented
- `hasCompletedToday()` - Check today's completion
- `getSummary()` - Complete streak object

### 2. Data Access Layer - QuestRepository

**40+ Methods:**

**Quest CRUD:**
- `findQuestById(questId)`
- `findQuestsByType(questType, options)`
- `findStoryQuestsByChapter(chapter)`
- `findAllActiveQuests()`
- `createQuest(questData)`
- `updateQuest(questId, updates)`

**User Quest Lifecycle:**
- `findUserQuestById(userQuestId)`
- `findUserQuest(userId, questId)`
- `findUserQuestsByStatus(userId, status)`
- `findActiveUserQuests(userId)`
- `findExpiredUserQuests(userId)`
- `createUserQuest(userId, questId, expiresAt)`
- `updateUserQuestProgress(userQuestId, progressUpdates)`
- `markUserQuestCompleted(userQuestId)`
- `markUserQuestAbandoned(userQuestId)`
- `markRewardsClaimed(userQuestId)`

**Unlocks:**
- `findUserUnlock(userId, unlockType, unlockKey)`
- `findUserUnlocks(userId, unlockType)`
- `createUnlock(userId, unlockType, unlockKey, questId)`
- `hasUnlock(userId, unlockType, unlockKey)`

**Daily Rotation:**
- `getDailyRotation(date)`
- `getTodayRotation()`
- `createDailyRotation(date, questIds)`

**Streaks:**
- `getStreak(userId)`
- `createStreak(userId)`
- `getOrCreateStreak(userId)`
- `updateStreak(userId, updates)`
- `incrementStreak(userId)`
- `resetStreak(userId)`

**Statistics:**
- `getUserQuestStats(userId)` - {total, active, completed, abandoned}
- `getQuestCompletionRate(questId)` - Completion percentage

### 3. Business Logic Layer - QuestService

**20+ Methods:**

**Quest Discovery:**
- `getAvailableQuests(userId, userLevel, masteryTier)` - Filter by prerequisites, level, mastery
- `getDailyQuests(userId)` - Today's 3 daily quests
- `getStoryProgress(userId)` - Chapter-by-chapter progress

**Quest Lifecycle:**
- `acceptQuest(userId, questId)` - Accept quest with expiration
- `abandonQuest(userId, questId)` - Abandon active quest

**Progress Tracking:**
- `updateQuestProgress(userId, objectiveType, value, metadata)` - Update matching objectives with filters
- `checkQuestCompletion(userQuestId)` - Verify completion

**Rewards:**
- `claimRewards(userId, questId)` - Distribute rewards with streak bonus
  - Calculate streak multiplier (1.0 - 1.5x)
  - Process unlocks
  - Increment daily streak

**Daily/Weekly Rotation:**
- `rotateDailyQuests()` - Select 3 random daily quests
- Middleware check: Prevent duplicate rotations same day

**Unlocks:**
- `getUserUnlocks(userId)` - All unlocks
- `hasUnlock(userId, unlockType, unlockKey)` - Check specific unlock
- `getPortalTierUnlocks(userId)` - Portal tier unlocks only

**Streaks:**
- `getStreak(userId)` - Current streak info

**Story Progression:**
- `getStoryProgress(userId)` - Progress by chapter
- `getCurrentChapter(userId)` - Current chapter number
- `getNextStoryQuest(userId)` - Next incomplete story quest

**Statistics:**
- `getUserQuestStats(userId)` - User quest statistics

### 4. API Layer - 11 Endpoints

**Quest Discovery:**
```
GET /api/v1/portal-quests/available - Available quests filtered by level/mastery/prerequisites
GET /api/v1/portal-quests/daily - Today's 3 daily quests
GET /api/v1/portal-quests/story - Story progress by chapter + next quest
```

**Quest Lifecycle:**
```
POST /api/v1/portal-quests/:questId/accept - Accept quest
POST /api/v1/portal-quests/:questId/abandon - Abandon quest
POST /api/v1/portal-quests/:questId/claim - Claim rewards with streak bonus
```

**User Quest Status:**
```
GET /api/v1/portal-quests/user/active - Active quests with progress
GET /api/v1/portal-quests/user/stats - Quest statistics
```

**Unlocks:**
```
GET /api/v1/portal-quests/unlocks - All user unlocks
GET /api/v1/portal-quests/unlocks/check?unlockType=X&unlockKey=Y - Check specific unlock
```

**Streaks:**
```
GET /api/v1/portal-quests/streak - Current streak + bonus info
```

**Admin:**
```
POST /api/v1/portal-quests/admin/rotate-daily - Manually trigger daily rotation
```

### 5. Dependency Injection

**Container Registrations:**
```javascript
container.register('portalQuestRepository', (c) => {
  return createQuestRepository({ models, logger, traceId });
});

container.register('portalQuestService', (c) => {
  return createQuestService({
    questRepository: c.resolve('portalQuestRepository'),
    logger,
    traceId,
  });
});

container.register('portalQuestController', (c) => {
  return createQuestController({
    questService: c.resolve('portalQuestService'),
  });
});
```

**Route Registration:**
```javascript
router.use('/portal-quests', require('../modules/quests/api/portalQuestRoutes')(container));
```

---

## Frontend Implementation

### 1. API Client - questAPI

**10 Methods:**
```javascript
questAPI.getAvailableQuests()
questAPI.getDailyQuests()
questAPI.getStoryProgress()
questAPI.acceptQuest(questId)
questAPI.abandonQuest(questId)
questAPI.claimRewards(questId)
questAPI.getActiveQuests()
questAPI.getQuestStats()
questAPI.getUserUnlocks()
questAPI.checkUnlock(unlockType, unlockKey)
questAPI.getStreak()
questAPI.rotateDailyQuests() // admin
```

### 2. Custom Hook - useQuests

**State Management:**
```javascript
const {
  activeQuests,        // Array of active quests
  questStats,          // {total, active, completed, abandoned}
  streak,              // {current_streak, longest_streak, bonus_percent}
  notification,        // Current notification object
  loading,             // Loading state
  error,               // Error message
  acceptQuest,         // Accept quest function
  claimRewards,        // Claim rewards function
  updateQuestProgress, // Update progress function (called from game events)
  refresh,             // Reload active quests
  clearNotification,   // Clear notification
} = useQuests();
```

**Features:**
- Automatic 30-second refresh
- Progress notifications
- Completed quest detection
- Error handling

### 3. QuestLogModal Component

**Features:**
- 3 Tabs: Story | Daily | Active
- **Story Tab:**
  - Progress by chapter
  - Quest cards with objective progress bars
  - Accept quest button
  - Completion badges
- **Daily Tab:**
  - Streak info with bonus display
  - Today's 3 quests
  - 24h reset timer
- **Active Tab:**
  - All active quests
  - Real-time progress
  - Claim rewards button for completed quests
  
**Quest Card:**
- Title + quest type badge
- Description
- Objective checklist with progress bars
- Reward chips (gold, XP, unlocks)
- Action buttons (Accept / Active / Claim / Completed)

### 4. QuestTracker Component

**Features:**
- Fixed position overlay (top-right corner)
- Collapsible/expandable
- Shows up to 3 active quests
- Real-time progress bars
- Completion badge with count
- Click header to open full quest log
- Auto-refresh every 30s

**Visual:**
- Semi-transparent dark background
- Blur backdrop effect
- Color-coded progress bars (green when complete)
- Minimalist design

### 5. QuestNotification Component

**Toast Notifications:**
- **Quest Completed:** Success alert with quest title
- **Rewards Claimed:** Success alert with gold/XP chips
- **New Quest Available:** Info alert
- **Progress Update:** Info alert with objective progress

**Configuration:**
- Top-center position
- Auto-dismiss (3-6s depending on type)
- Manual close button
- Severity colors (success/info)

### 6. Dashboard Integration

**Added Components:**
```javascript
<QuestTracker onOpenQuestLog={() => setShowPortalQuestLog(true)} />

<QuestLogModal
  open={showPortalQuestLog}
  onClose={() => setShowPortalQuestLog(false)}
/>

<QuestNotification
  notification={questNotification}
  onClose={clearNotification}
/>
```

**Hook Usage:**
```javascript
const {
  activeQuests: portalQuests,
  notification: questNotification,
  clearNotification,
} = useQuests();
```

---

## Quest System Features

### Story Quests (5 Chapters)

**Chapter 1: Grey Portals → Unlock Green**
- 3 quests introducing portal combat
- Reward: 5,000 gold + green portal tier unlock

**Chapter 2: Green Portals → Unlock Blue**
- 3 quests mastering green portals
- Reward: Advanced Barracks blueprint + blue portal tier unlock

**Chapter 3: Blue Portals + Boss → Unlock Purple**
- 3 quests including first boss battle
- Reward: 25,000 gold + purple portal tier unlock

**Chapter 4: Purple Portals + Titan → Unlock Red**
- 3 quests with Ancient Titan boss
- Reward: Legendary blueprint + red portal tier unlock

**Chapter 5: Red Portals + Void Reaver → Unlock Golden**
- 3 quests with multiple boss battles
- Reward: S-Rank title + golden portal tier unlock

### Daily Quests

**System:**
- 3 quests per day
- Rotated at midnight UTC
- Random selection from pool of 20+ daily quests
- 24h expiration

**Streak Bonus:**
- +10% rewards per consecutive day
- Max 50% bonus (5 days)
- Reset if day missed

**Example Quests:**
- Complete 5 portal battles
- Deal 100,000 damage
- Defeat 3 bosses
- Earn 50,000 gold
- Send 1,000 units

### Weekly Quests

**System:**
- 5 quests per week
- Rotated Monday midnight UTC
- Higher difficulty + better rewards
- 7-day expiration

### Achievement Quests

**Permanent Goals:**
- Multi-tier (Bronze/Silver/Gold/Platinum)
- One-time rewards
- Account-wide progress

---

## Objective Types (15+)

```javascript
const objectiveTypes = {
  portal_attempts: 'Attempt any portal',
  portal_victories: 'Win portal battles',
  portal_tier_victories: 'Win specific tier portals (filter: tier)',
  boss_defeats: 'Defeat any boss',
  boss_type_defeats: 'Defeat specific boss (filter: boss_type)',
  boss_phase_reached: 'Reach boss phase X (filter: phase)',
  raid_completions: 'Complete alliance raids',
  damage_dealt: 'Deal total damage',
  gold_collected: 'Collect gold',
  units_sent: 'Send total units',
  mastery_level: 'Reach mastery level X',
  perfect_victories: 'Win with no unit losses',
  tactic_victories: 'Win with tactic X (filter: tactic)',
  join_alliance: 'Join an alliance',
  leaderboard_rank: 'Reach rank X',
  consecutive_victories: 'Win X battles in a row',
};
```

**Metadata Filters:**
- `portal_tier`: "grey", "green", "blue", etc.
- `boss_type`: "Elite Guardian", "Ancient Titan", etc.
- `phase`: 1, 2, 3
- `tactic`: "defensive", "aggressive", etc.

---

## Reward Types

```javascript
const rewardTypes = {
  gold: 5000,                                    // Currency
  experience: 1000,                              // XP
  units: { infantry: 50, cavalry: 20 },          // Units by type
  blueprints: ["advanced_barracks", "wall_t3"],  // Blueprint IDs
  unlocks: [
    { type: 'portal_tier', key: 'portal_tier_green' },
    { type: 'feature', key: 'alliance_raids' },
    { type: 'title', key: 's_rank_commander' }
  ],
  titles: ["Portal Master"],                     // Title names
  cosmetics: ["gold_frame", "legendary_banner"], // Cosmetic IDs
};
```

---

## Integration Hooks

**Portal Battle Completion:**
```javascript
// In PortalCombatService.simulateBattle()
await questService.updateQuestProgress(userId, 'portal_attempts', 1);

if (victory) {
  await questService.updateQuestProgress(userId, 'portal_victories', 1, {
    portal_tier: portal.tier
  });
}
```

**Boss Battle Completion:**
```javascript
// In PortalBossCombatService.simulateBossBattle()
if (victory) {
  await questService.updateQuestProgress(userId, 'boss_defeats', 1, {
    boss_type: boss.boss_type
  });
}
```

**Damage Dealt:**
```javascript
// After battle
await questService.updateQuestProgress(userId, 'damage_dealt', totalDamage);
```

---

## Cron Jobs (TODO - Phase 5)

**Daily Quest Rotation:**
```javascript
// Runs at midnight UTC
cron.schedule('0 0 * * *', async () => {
  await questService.rotateDailyQuests();
});
```

**Weekly Quest Rotation:**
```javascript
// Runs Monday midnight UTC
cron.schedule('0 0 * * 1', async () => {
  await questService.rotateWeeklyQuests();
});
```

**Expired Quest Cleanup:**
```javascript
// Runs every hour
cron.schedule('0 * * * *', async () => {
  // Mark expired daily/weekly quests as failed
});
```

---

## Testing Strategy (TODO - Phase 5)

### Backend Integration Tests
1. Quest acceptance flow
2. Progress update from battle events
3. Completion detection
4. Reward distribution with streak bonus
5. Daily/weekly rotation
6. Unlock validation
7. Prerequisite checking

### Frontend E2E Tests (Playwright)
1. Navigate to quest log
2. Accept story quest
3. Complete objectives via portal battles
4. Claim rewards
5. Daily quest reset at midnight
6. Achievement unlocking
7. Streak tracking

### Manual Testing Checklist
- [ ] Accept quest → Appears in tracker
- [ ] Complete objective → Progress updates
- [ ] Complete all objectives → Claim button appears
- [ ] Claim rewards → Gold/XP added + notification
- [ ] Daily quest completion → Streak increments
- [ ] Miss a day → Streak resets
- [ ] Story quest completion → Portal tier unlocked
- [ ] Quest tracker overlay → Shows 3 active quests
- [ ] Click tracker → Opens quest log
- [ ] Daily rotation → 3 new quests at midnight

---

## Performance Considerations

**Database Indexes:**
- All FK columns indexed
- Composite indexes on frequent queries (user_id + quest_id)
- Date indexes for rotation queries

**Caching:**
- Daily rotation cached until midnight
- User unlocks cached (invalidate on claim)
- Story progress cached (invalidate on completion)

**API Optimization:**
- Batch quest loading with includes
- JSONB queries for objectives/progress
- Pagination for quest history (future)

---

## Security

**Authorization:**
- All endpoints protected with JWT middleware
- User can only access their own quests
- Admin endpoints require admin role

**Validation:**
- Quest ID validation
- Objective type whitelist
- Reward claim verification (prevent double-claim)

**Race Conditions:**
- Unique constraint on (user_id, quest_id)
- Transaction for reward distribution
- Atomic streak increment

---

## Future Enhancements (Post-MVP)

1. **Quest Chains:** Multi-step quest sequences
2. **Conditional Objectives:** "Kill X OR complete Y"
3. **Time-Limited Events:** Special event quests
4. **Quest Sharing:** Share progress with alliance
5. **Quest Log Filtering:** Search/filter by type/status
6. **Progress Notifications:** Real-time socket updates
7. **Quest Leaderboards:** Fastest completion times
8. **Quest Rewards Preview:** Hover to see rewards
9. **Quest Difficulty Scaling:** Dynamic difficulty based on player level
10. **Quest Tracking Pins:** Pin specific quests to HUD

---

## Files Created/Modified

### Backend
```
backend/migrations/20251130180000-create-portal-quests.js
backend/models/PortalQuest.js
backend/models/UserQuest.js (updated)
backend/models/UserQuestUnlock.js
backend/models/DailyQuestRotation.js
backend/models/QuestStreak.js
backend/models/index.js (updated)
backend/modules/quests/infra/QuestRepository.js
backend/modules/quests/application/QuestService.js
backend/controllers/portalQuestController.js
backend/modules/quests/api/portalQuestRoutes.js
backend/container.js (updated)
backend/api/index.js (updated)
```

### Frontend
```
frontend/src/api/quests.js (updated)
frontend/src/hooks/useQuests.js
frontend/src/components/Quests/QuestLogModal.jsx
frontend/src/components/Quests/QuestTracker.jsx
frontend/src/components/Quests/QuestNotification.jsx
frontend/src/components/Quests/index.js
frontend/src/components/Dashboard.js (updated)
```

### Documentation
```
docs/PORTAL_QUEST_SYSTEM_SPEC.md
docs/PORTAL_QUEST_IMPLEMENTATION.md (this file)
```

---

## Time Tracking

| Phase | Description | Estimated | Actual | Status |
|-------|-------------|-----------|--------|--------|
| 1 | Specification | 2h | 2h | ✅ Complete |
| 2 | Database + Models | 4h | 4h | ✅ Complete |
| 3 | Repository + Service | 4h | 4h | ✅ Complete |
| 4 | API + Controller | 2h | 2h | ✅ Complete |
| 5 | Frontend Components | 8h | 8h | ✅ Complete |
| 6 | Integration Hooks | 5h | - | 📋 TODO |
| 7 | Quest Content Seeding | 2h | - | 📋 TODO |
| 8 | Testing | 3h | - | 📋 TODO |
| **Total** | | **30h** | **20h** | **67%** |

---

## Next Steps

### Priority 1: Integration Hooks (5h)
1. Add `questService.updateQuestProgress()` calls to:
   - `PortalCombatService.simulateBattle()`
   - `PortalBossCombatService.simulateBossBattle()`
   - `PortalRaidRepository.completeRaid()`
2. Add hooks for:
   - Damage dealt
   - Gold collected
   - Units sent
   - Mastery level reached
3. Test quest progress updates from gameplay

### Priority 2: Quest Content Seeding (2h)
1. Create migration with initial quests:
   - 5 chapters × 3 story quests = 15 quests
   - 20+ daily quest pool
   - 10+ weekly quest pool
2. Set up narrative text for story quests
3. Balance rewards

### Priority 3: Cron Jobs (1h)
1. Set up daily quest rotation (midnight UTC)
2. Set up weekly quest rotation (Monday midnight UTC)
3. Test rotation logic

### Priority 4: Testing (3h)
1. Integration tests for all API endpoints
2. E2E tests with Playwright
3. Manual testing checklist

---

## Success Metrics

**Engagement:**
- Daily Active Users (DAU) increase from quest notifications
- Average session time increase from quest grinding
- Daily quest completion rate > 60%

**Retention:**
- Day 7 retention improvement from story progression
- Streak system retention (players returning daily)

**Progression:**
- % of players completing each story chapter
- Average time to unlock golden portals
- Quest completion rate by type

---

## Known Issues / Tech Debt

1. **Old Quest System:** Legacy `Quest` and `UserQuest` models still exist in database (not used by portal quests)
2. **Redis Warnings:** Multiple Redis version warnings (5.0 vs 6.2 recommended)
3. **Migration Naming:** Migration file uses current date, may conflict if multiple migrations on same day
4. **Error Handling:** Some repository methods throw generic errors instead of custom error types
5. **Caching:** No Redis caching for daily rotation or user unlocks yet

---

## Conclusion

The portal quest system backend and frontend are fully implemented with:
- ✅ 5 database tables with proper indexes
- ✅ 5 Sequelize models with 30+ instance methods
- ✅ Repository layer with 40+ data access methods
- ✅ Service layer with 20+ business logic methods
- ✅ 11 REST API endpoints with authentication
- ✅ 3 React components (QuestLogModal, QuestTracker, QuestNotification)
- ✅ Custom React hook (useQuests)
- ✅ Dashboard integration

**Remaining work:** Integration hooks (5h), quest content (2h), testing (3h) = 10h

**Phase 3 Progress:** 129h / 195h (66%) → After quest system completion: 139h / 195h (71%)
