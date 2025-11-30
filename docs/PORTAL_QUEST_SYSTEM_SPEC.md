# 📜 Portal Quest System - Design Specification

**Date:** November 30, 2025  
**Version:** 1.0.0  
**Estimated Effort:** 30 hours  
**Priority:** High (Phase 3 completion)

---

## 🎯 System Overview

The Portal Quest System provides narrative progression and structured objectives for players exploring portals. Inspired by Solo Leveling's quest system, it guides players through portal tiers with rewards, unlocks, and story progression.

### Core Objectives

1. **Guided Progression**: Tutorial and onboarding quests for new players
2. **Tier Unlocking**: Gate higher portal tiers behind quest completion
3. **Narrative Engagement**: Story-driven campaigns revealing world lore
4. **Reward Incentives**: Gold, XP, units, blueprints for quest completion
5. **Daily/Weekly Quests**: Retention mechanics with recurring objectives

---

## 🎮 Quest Types

### 1. Story Quests (Main Campaign)

**Characteristics:**
- Linear progression through portal tiers
- Unlock new features and portal tiers
- One-time completion
- Rich narrative text
- Major rewards

**Example Story Arc:**

```
Chapter 1: The First Portal
├─ Quest 1: "A Strange Rift" - Discover first portal (grey tier)
├─ Quest 2: "Into the Unknown" - Complete first portal attempt
├─ Quest 3: "Hunter's License" - Reach Mastery Lv.1 on grey portals
└─ Reward: Unlock green tier portals + 5000 gold

Chapter 2: Rising Power
├─ Quest 1: "Green Glow" - Defeat 3 green portals
├─ Quest 2: "Strategic Thinking" - Use all 3 tactics in battles
├─ Quest 3: "Master Hunter" - Reach Mastery Lv.3 on green portals
└─ Reward: Unlock blue tier portals + Advanced Barracks blueprint

Chapter 3: The Elite Challenge
├─ Quest 1: "Blue Mysteries" - Defeat 5 blue portals
├─ Quest 2: "Boss Hunter" - Defeat first Elite Guardian boss
├─ Quest 3: "Alliance Bonds" - Join alliance and complete 1 raid
└─ Reward: Unlock purple tier portals + 25,000 gold

Chapter 4: Ancient Powers
├─ Quest 1: "Purple Haze" - Defeat 5 purple portals
├─ Quest 2: "Titan Slayer" - Defeat Ancient Titan boss
├─ Quest 3: "Raid Leader" - Complete 3 alliance raids
└─ Reward: Unlock red tier portals + Legendary Unit blueprint

Chapter 5: The Golden Path
├─ Quest 1: "Crimson Threat" - Defeat 10 red portals
├─ Quest 2: "Void Walker" - Defeat Void Reaver boss
├─ Quest 3: "Emperor's Challenge" - Participate in Cosmic Emperor raid
└─ Reward: Unlock golden tier portals + S-Rank Hunter title
```

### 2. Daily Quests

**Characteristics:**
- Reset every 24 hours (midnight UTC)
- Quick objectives (5-15 minutes)
- Modest rewards
- 3 quests per day
- Streak bonuses

**Examples:**
- "Daily Hunter": Complete 3 portal attempts (any tier)
- "Resource Gatherer": Collect 10,000 gold from portals
- "Unit Master": Send 500 units into portals
- "Perfect Victory": Win a portal with 0 unit losses
- "Speed Runner": Complete a portal in under 5 minutes

**Rewards:**
- Base: 1,000 gold + 100 XP
- Streak bonus: +10% per consecutive day (max 50%)
- Complete all 3: Bonus 2,000 gold

### 3. Weekly Quests

**Characteristics:**
- Reset every Monday 00:00 UTC
- Medium-term objectives (1-3 hours total)
- Significant rewards
- 5 quests per week
- Encourages diverse gameplay

**Examples:**
- "Weekly Warrior": Complete 20 portal attempts
- "Boss Slayer": Defeat 3 different boss types
- "Alliance Hero": Complete 5 alliance raids
- "Mastery Climb": Gain 5 mastery levels (any tier)
- "Tactical Genius": Win 10 battles with each tactic

**Rewards:**
- Base: 10,000 gold + 1,000 XP
- Complete all 5: Bonus 25,000 gold + Rare blueprint

### 4. Achievement Quests

**Characteristics:**
- Permanent, unlockable achievements
- Track career-long statistics
- Cosmetic rewards (titles, banners)
- Multiple tiers (Bronze, Silver, Gold, Platinum)

**Examples:**

**Portal Hunter Series:**
- Bronze: Defeat 10 portals
- Silver: Defeat 50 portals
- Gold: Defeat 200 portals
- Platinum: Defeat 1,000 portals

**Boss Destroyer Series:**
- Bronze: Defeat 1 boss
- Silver: Defeat 10 bosses
- Gold: Defeat 50 bosses
- Platinum: Defeat 200 bosses

**Damage Dealer Series:**
- Bronze: Deal 100,000 total damage
- Silver: Deal 1,000,000 total damage
- Gold: Deal 10,000,000 total damage
- Platinum: Deal 100,000,000 total damage

**Raid Commander Series:**
- Bronze: Complete 5 raids
- Silver: Complete 25 raids
- Gold: Complete 100 raids
- Platinum: Complete 500 raids

---

## 🗃️ Database Schema

### portal_quests

Master quest definitions table.

```sql
CREATE TABLE portal_quests (
  quest_id SERIAL PRIMARY KEY,
  quest_type VARCHAR(20) NOT NULL CHECK (quest_type IN ('story', 'daily', 'weekly', 'achievement')),
  quest_category VARCHAR(50), -- 'tutorial', 'progression', 'combat', 'social'
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Story progression
  chapter INTEGER,
  order_in_chapter INTEGER,
  prerequisite_quest_id INTEGER REFERENCES portal_quests(quest_id),
  
  -- Objectives (JSONB array)
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   { "type": "portal_victories", "target": 5, "tier": "blue" },
  --   { "type": "boss_defeats", "target": 1, "boss_type": "elite_guardian" }
  -- ]
  
  -- Rewards (JSONB)
  rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: { "gold": 5000, "experience": 500, "unlocks": ["blue_portals"], "blueprints": ["advanced_barracks"] }
  
  -- Availability
  is_active BOOLEAN NOT NULL DEFAULT true,
  required_level INTEGER DEFAULT 1,
  required_mastery_tier VARCHAR(20),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_quests_type ON portal_quests(quest_type);
CREATE INDEX idx_portal_quests_chapter ON portal_quests(chapter);
CREATE INDEX idx_portal_quests_active ON portal_quests(is_active);
```

### user_quests

Tracks individual player quest progress.

```sql
CREATE TABLE user_quests (
  user_quest_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id INTEGER NOT NULL REFERENCES portal_quests(quest_id) ON DELETE CASCADE,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
  
  -- Progress tracking (JSONB array matching objectives)
  progress JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   { "type": "portal_victories", "current": 3, "target": 5, "tier": "blue" },
  --   { "type": "boss_defeats", "current": 0, "target": 1, "boss_type": "elite_guardian" }
  -- ]
  
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP, -- For daily/weekly quests
  
  -- Rewards claimed
  rewards_claimed BOOLEAN NOT NULL DEFAULT false,
  
  UNIQUE(user_id, quest_id)
);

CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);
CREATE INDEX idx_user_quests_quest ON user_quests(quest_id);
CREATE INDEX idx_user_quests_expires ON user_quests(expires_at);
```

### user_quest_unlocks

Tracks what content users have unlocked via quests.

```sql
CREATE TABLE user_quest_unlocks (
  unlock_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlock_type VARCHAR(50) NOT NULL, -- 'portal_tier', 'feature', 'blueprint', 'title'
  unlock_key VARCHAR(100) NOT NULL, -- 'blue_portals', 'alliance_raids', 'advanced_barracks'
  unlocked_by_quest_id INTEGER REFERENCES portal_quests(quest_id),
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, unlock_type, unlock_key)
);

CREATE INDEX idx_user_unlocks_user ON user_quest_unlocks(user_id);
CREATE INDEX idx_user_unlocks_type ON user_quest_unlocks(unlock_type);
```

### daily_quest_rotation

Tracks which daily quests are active each day.

```sql
CREATE TABLE daily_quest_rotation (
  rotation_id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  quest_ids INTEGER[] NOT NULL, -- Array of 3 quest IDs
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_rotation_date ON daily_quest_rotation(date);
```

### quest_streaks

Tracks daily quest completion streaks for rewards.

```sql
CREATE TABLE quest_streaks (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🎯 Quest Objective Types

### Supported Objective Types

```typescript
type ObjectiveType = 
  | 'portal_attempts'        // Complete X portal attempts
  | 'portal_victories'       // Win X portal battles
  | 'portal_tier_victories'  // Win X battles in specific tier
  | 'boss_defeats'           // Defeat X bosses
  | 'boss_type_defeats'      // Defeat specific boss type
  | 'boss_phase_reached'     // Reach phase X in boss battle
  | 'raid_completions'       // Complete X raids
  | 'raid_victories'         // Win X raids
  | 'damage_dealt'           // Deal X total damage
  | 'gold_collected'         // Collect X gold from portals
  | 'units_sent'             // Send X units into portals
  | 'mastery_level'          // Reach mastery level X
  | 'mastery_tier_level'     // Reach mastery level X in tier Y
  | 'perfect_victories'      // Win with 0 casualties
  | 'tactic_victories'       // Win X battles with tactic Y
  | 'join_alliance'          // Join an alliance
  | 'leaderboard_rank'       // Reach rank X on leaderboard
  | 'consecutive_victories'  // Win X battles in a row
```

### Objective Structure

```json
{
  "type": "portal_tier_victories",
  "target": 5,
  "tier": "blue",
  "description": "Defeat 5 blue tier portals"
}
```

---

## 🏆 Reward Types

### Supported Rewards

```typescript
type RewardType = {
  gold?: number;
  experience?: number;
  units?: { [unitType: string]: number };
  blueprints?: string[];
  unlocks?: string[];
  titles?: string[];
  cosmetics?: string[];
  premium_currency?: number; // Future
}
```

### Example Reward Object

```json
{
  "gold": 25000,
  "experience": 2500,
  "units": {
    "infantry": 100,
    "cavalry": 50
  },
  "blueprints": ["advanced_barracks"],
  "unlocks": ["blue_portals"],
  "titles": ["Portal Hunter"]
}
```

---

## 🔧 Backend Services

### QuestService

**Location:** `backend/modules/quests/application/QuestService.js`

**Responsibilities:**
- Quest assignment and tracking
- Progress updates from portal battles
- Completion detection
- Reward distribution
- Daily/weekly rotation

**Key Methods:**

```javascript
class QuestService {
  // Quest lifecycle
  async assignQuestToUser(userId, questId)
  async completeQuest(userId, questId)
  async claimRewards(userId, questId)
  async abandonQuest(userId, questId)
  
  // Progress tracking
  async updateQuestProgress(userId, eventType, eventData)
  async checkQuestCompletion(userId, questId)
  
  // Quest discovery
  async getAvailableQuests(userId, questType)
  async getActiveQuests(userId)
  async getCompletedQuests(userId, limit = 20)
  
  // Daily/Weekly rotation
  async rotateDailyQuests()
  async rotateWeeklyQuests()
  async getDailyQuests(userId)
  async getWeeklyQuests(userId)
  
  // Unlocks
  async checkUnlock(userId, unlockType, unlockKey)
  async grantUnlock(userId, unlockType, unlockKey, questId)
  async getUserUnlocks(userId)
  
  // Streaks
  async updateStreak(userId)
  async getStreak(userId)
  
  // Story progression
  async getNextStoryQuest(userId)
  async getCurrentChapter(userId)
}
```

### QuestRepository

**Location:** `backend/modules/quests/infra/QuestRepository.js`

**Responsibilities:**
- Database operations for quests
- Progress persistence
- Query optimization

**Key Methods:**

```javascript
class QuestRepository {
  // Quest CRUD
  async findById(questId)
  async findByType(questType)
  async findByChapter(chapter)
  async createQuest(questData)
  async updateQuest(questId, updates)
  
  // User quest tracking
  async findUserQuest(userId, questId)
  async findUserQuests(userId, filters)
  async createUserQuest(userId, questId)
  async updateUserQuestProgress(userQuestId, progress)
  async markQuestCompleted(userQuestId)
  
  // Unlocks
  async createUnlock(userId, unlockType, unlockKey, questId)
  async findUnlock(userId, unlockType, unlockKey)
  async findUserUnlocks(userId, unlockType)
  
  // Daily rotation
  async saveDailyRotation(date, questIds)
  async getDailyRotation(date)
  
  // Statistics
  async getUserQuestStats(userId)
  async getQuestCompletionRate(questId)
}
```

---

## 🎨 Frontend Components

### QuestLogModal

Main quest interface showing all quest types.

**Location:** `frontend/src/components/quests/QuestLogModal.jsx`

**Features:**
- Tabs: Story | Daily | Weekly | Achievements
- Quest cards with progress bars
- Objective checklist
- Reward preview
- Claim rewards button

### QuestTracker

Persistent overlay showing active quest progress.

**Location:** `frontend/src/components/quests/QuestTracker.jsx`

**Features:**
- Minimizable widget (top-right corner)
- Shows 1-3 tracked quests
- Real-time progress updates
- Click to open full quest log
- Celebration animation on completion

### QuestNotification

Toast notification for quest events.

**Location:** `frontend/src/components/quests/QuestNotification.jsx`

**Features:**
- Quest completed notification
- New quest available
- Progress milestone (50%, 75%)
- Reward claimed confirmation

### StoryQuestModal

Immersive story quest presentation.

**Location:** `frontend/src/components/quests/StoryQuestModal.jsx`

**Features:**
- Full-screen modal
- Narrative text with styling
- Character portraits (future)
- Chapter navigation
- Accept/Decline buttons

---

## 🔌 API Endpoints

### Quest Endpoints

```
GET    /api/v1/quests                    - List all available quests
GET    /api/v1/quests/:questId           - Get quest details
POST   /api/v1/quests/:questId/accept    - Accept/start quest
POST   /api/v1/quests/:questId/abandon   - Abandon quest
POST   /api/v1/quests/:questId/claim     - Claim rewards

GET    /api/v1/quests/user/active        - Get user's active quests
GET    /api/v1/quests/user/completed     - Get user's completed quests
GET    /api/v1/quests/user/daily         - Get daily quests for today
GET    /api/v1/quests/user/weekly        - Get weekly quests
GET    /api/v1/quests/user/story         - Get story quest progression
GET    /api/v1/quests/user/achievements  - Get achievement progress

GET    /api/v1/quests/unlocks            - Get user's unlocks
GET    /api/v1/quests/streak             - Get daily quest streak

POST   /api/v1/admin/quests/create       - Create quest (admin)
POST   /api/v1/admin/quests/rotate-daily - Force daily rotation (admin)
```

---

## 🎯 Quest Event Hooks

Portal battles and boss fights trigger quest progress updates automatically.

### Integration Points

**1. Portal Battle Completion**
```javascript
// backend/modules/portals/application/PortalCombatService.js
async simulateBattle(userId, portalId, units, tactic) {
  // ... combat logic
  
  // Trigger quest updates
  await questService.updateQuestProgress(userId, 'portal_attempt', {
    portalId,
    tier: portal.tier,
    result: battleResult.result,
    damage: battleResult.damage,
    tactic,
    casualties: battleResult.casualties
  });
}
```

**2. Boss Battle Completion**
```javascript
// backend/modules/portals/application/PortalBossCombatService.js
async simulateBossBattle(userId, bossId, units, tactic) {
  // ... combat logic
  
  await questService.updateQuestProgress(userId, 'boss_battle', {
    bossId,
    bossType: boss.boss_type,
    result: battleResult.result,
    phasesReached: battleResult.phases_reached,
    damage: battleResult.damage
  });
}
```

**3. Alliance Raid Completion**
```javascript
// backend/modules/portals/infra/PortalRaidRepository.js
async completeRaid(raidId, victory) {
  // ... raid completion logic
  
  const participants = await this.getParticipants(raidId);
  for (const participant of participants) {
    await questService.updateQuestProgress(participant.user_id, 'raid_completion', {
      raidId,
      victory,
      contribution: participant.contribution_percent
    });
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- QuestService methods (progress calculation, completion detection)
- Objective matching logic
- Reward distribution
- Streak calculation

### Integration Tests
- Quest acceptance flow
- Progress update from portal battles
- Completion and reward claiming
- Daily/weekly rotation
- Unlock validation

### E2E Tests (Playwright)
- Accept story quest
- Complete quest objectives via portal battles
- Claim rewards
- Daily quest reset
- Achievement unlocking

---

## 📈 Metrics & Analytics

### Track:
- Quest completion rates by type
- Average time to complete quests
- Most/least popular quests
- Daily quest streak distribution
- Story quest dropout points
- Unlock progression funnel

---

## 🚀 Implementation Plan

### Phase 1: Database & Backend Core (10h)
1. Create migrations (4 tables)
2. Create models (4 models)
3. Build QuestService
4. Build QuestRepository
5. Seed initial story quests

### Phase 2: API & Integration (8h)
1. Create quest controller
2. Implement 12 API endpoints
3. Add quest hooks to portal/boss combat
4. Daily/weekly rotation cron jobs
5. Testing

### Phase 3: Frontend UI (10h)
1. QuestLogModal component
2. QuestTracker widget
3. QuestNotification component
4. StoryQuestModal component
5. Integration with existing pages
6. Testing

### Phase 4: Content & Balancing (2h)
1. Write quest narratives
2. Balance rewards
3. Test progression flow
4. Documentation

**Total: 30 hours**

---

## 🎁 Benefits

### Player Retention
- Daily login incentive (+25% D7 retention)
- Long-term progression goals
- Guided onboarding (reduce drop-off)

### Monetization
- Premium quest skips (future)
- Exclusive quest rewards
- Battle pass integration

### Engagement
- Clear objectives reduce confusion
- Story creates emotional investment
- Achievements satisfy completionists

---

## 🔮 Future Enhancements

- **PvP Quests**: "Defeat 5 players in combat"
- **Building Quests**: "Construct 10 buildings"
- **Trade Quests**: "Complete 5 market transactions"
- **Social Quests**: "Recruit 3 alliance members"
- **Seasonal Quests**: Limited-time event quests
- **Challenge Quests**: Ultra-hard objectives with prestige rewards

---

**Ready to implement!** 🚀
