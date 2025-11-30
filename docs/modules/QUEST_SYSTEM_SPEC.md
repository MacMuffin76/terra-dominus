# 📜 Quest System & Portal Campaign — Spécification Technique

**Date:** 30 novembre 2025  
**Estimation:** 30h développement  
**Priority:** P1 (Phase 3 — Contenu PvE)  
**Status:** 📋 Spécification

---

## 🎯 Objectifs

Créer un système de quêtes complet qui:
1. **Guide les nouveaux joueurs** via tutorial interactif
2. **Fournit une progression narrative** avec storyline portails
3. **Récompense l'exploration** et la maîtrise des mécaniques
4. **Offre du contenu rejouable** avec quêtes quotidiennes/hebdomadaires

---

## 📚 1. QUEST SYSTEM ARCHITECTURE (15h)

### 1.1 Types de Quêtes

| Type | Description | Repeatable | Rewards | Example |
|------|-------------|------------|---------|---------|
| **Tutorial** | Quêtes guidées pour débutants | ❌ | Units, Gold, XP | "Construire première mine" |
| **Story** | Campagne narrative principale | ❌ | Premium, Cosmetics | "Fermer la Première Brèche" |
| **Daily** | Objectifs quotidiens simples | ✅ (24h) | Gold, Resources | "Vaincre 3 portails gris" |
| **Weekly** | Défis hebdomadaires difficiles | ✅ (7j) | Premium, Rare Items | "Atteindre Phase 4 d'un boss" |
| **Achievement** | Milestones long-terme | ❌ | Titles, Cosmetics | "Vaincre 100 portails totaux" |
| **Side Quest** | Optionnels, lore secondaire | ❌ | Lore Items, XP | "L'Histoire du Gardien Perdu" |

### 1.2 Database Schema

**Table: `quests`**
```sql
CREATE TABLE quests (
  quest_id SERIAL PRIMARY KEY,
  quest_type VARCHAR(20) NOT NULL, -- tutorial, story, daily, weekly, achievement, side
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  story_text TEXT, -- Optional narrative content
  quest_chain_id INTEGER, -- For sequential quests
  sequence_order INTEGER DEFAULT 0, -- Order in chain
  
  -- Requirements
  level_required INTEGER DEFAULT 1,
  prerequisite_quests INTEGER[], -- Array of quest_ids
  faction_required VARCHAR(50), -- Optional faction lock
  
  -- Objectives (JSONB for flexibility)
  objectives JSONB NOT NULL,
  /* Example objectives:
  [
    { "type": "build", "target": "gold_mine", "count": 1 },
    { "type": "defeat_portal", "tier": "grey", "count": 3 },
    { "type": "reach_level", "level": 5 }
  ]
  */
  
  -- Rewards
  rewards JSONB NOT NULL,
  /* Example rewards:
  {
    "gold": 500,
    "xp": 100,
    "units": { "infantry": 50 },
    "items": ["beginner_shield"],
    "cosmetics": ["portal_hunter_badge"]
  }
  */
  
  -- Repeat config
  is_repeatable BOOLEAN DEFAULT FALSE,
  reset_interval VARCHAR(20), -- 'daily', 'weekly', null
  reset_time TIME, -- Time of day for reset (e.g., '00:00:00')
  
  -- Display
  icon VARCHAR(50),
  difficulty INTEGER DEFAULT 1, -- 1-5 stars
  estimated_time INTEGER, -- Minutes to complete
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP,
  end_date TIMESTAMP, -- For limited-time events
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quests_type ON quests(quest_type);
CREATE INDEX idx_quests_chain ON quests(quest_chain_id);
CREATE INDEX idx_quests_active ON quests(is_active);
```

**Table: `user_quests`**
```sql
CREATE TABLE user_quests (
  user_quest_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  quest_id INTEGER REFERENCES quests(quest_id) ON DELETE CASCADE,
  
  -- Progress tracking
  status VARCHAR(20) DEFAULT 'active', -- active, completed, failed, abandoned
  progress JSONB DEFAULT '{}',
  /* Example progress:
  {
    "build_gold_mine": { "current": 1, "required": 1 },
    "defeat_portal_grey": { "current": 2, "required": 3 }
  }
  */
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  last_progress_at TIMESTAMP DEFAULT NOW(),
  
  -- Reset tracking (for repeatable quests)
  reset_count INTEGER DEFAULT 0,
  next_reset_at TIMESTAMP,
  
  UNIQUE(user_id, quest_id)
);

CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);
CREATE INDEX idx_user_quests_quest ON user_quests(quest_id);
```

**Table: `quest_chains`**
```sql
CREATE TABLE quest_chains (
  chain_id SERIAL PRIMARY KEY,
  chain_name VARCHAR(255) NOT NULL,
  chain_type VARCHAR(50) NOT NULL, -- tutorial, story, side
  description TEXT,
  total_quests INTEGER DEFAULT 0,
  rewards_on_completion JSONB, -- Bonus for completing entire chain
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.3 Quest Service

**Fichier:** `backend/modules/quests/application/QuestService.js`

```javascript
class QuestService {
  constructor({ 
    questRepository, 
    userQuestRepository, 
    userRepository,
    eventEmitter 
  }) {
    this.questRepo = questRepository;
    this.userQuestRepo = userQuestRepository;
    this.userRepo = userRepository;
    this.eventEmitter = eventEmitter;
    
    // Listen to game events for quest progress
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Building completed
    this.eventEmitter.on('building.completed', async (data) => {
      await this.updateQuestProgress(data.userId, 'build', {
        target: data.buildingType,
        count: 1
      });
    });
    
    // Portal defeated
    this.eventEmitter.on('portal.defeated', async (data) => {
      await this.updateQuestProgress(data.userId, 'defeat_portal', {
        tier: data.portalTier,
        count: 1
      });
    });
    
    // Level up
    this.eventEmitter.on('user.levelup', async (data) => {
      await this.updateQuestProgress(data.userId, 'reach_level', {
        level: data.newLevel
      });
    });
    
    // Research completed
    this.eventEmitter.on('research.completed', async (data) => {
      await this.updateQuestProgress(data.userId, 'research', {
        target: data.researchType,
        count: 1
      });
    });
    
    // Units trained
    this.eventEmitter.on('units.trained', async (data) => {
      await this.updateQuestProgress(data.userId, 'train_units', {
        type: data.unitType,
        count: data.quantity
      });
    });
  }

  /**
   * Get available quests for user
   */
  async getAvailableQuests(userId) {
    const user = await this.userRepo.findById(userId);
    const activeUserQuests = await this.userQuestRepo.findByUser(userId, 'active');
    
    // Get all quests user is eligible for
    const allQuests = await this.questRepo.findActive();
    
    const available = [];
    for (const quest of allQuests) {
      // Check if already active or completed (non-repeatable)
      const existing = await this.userQuestRepo.find(userId, quest.quest_id);
      if (existing && !quest.is_repeatable) {
        if (existing.status === 'completed') continue;
      }
      
      // Check level requirement
      if (quest.level_required > user.level) continue;
      
      // Check prerequisites
      if (quest.prerequisite_quests && quest.prerequisite_quests.length > 0) {
        const prerequisitesComplete = await this.checkPrerequisites(
          userId, 
          quest.prerequisite_quests
        );
        if (!prerequisitesComplete) continue;
      }
      
      // Check faction requirement
      if (quest.faction_required && quest.faction_required !== user.faction) {
        continue;
      }
      
      available.push(quest);
    }
    
    return available;
  }

  /**
   * Start/accept a quest
   */
  async startQuest(userId, questId) {
    const quest = await this.questRepo.findById(questId);
    if (!quest) throw new Error('Quest not found');
    
    // Check if repeatable and on cooldown
    if (quest.is_repeatable) {
      const existing = await this.userQuestRepo.find(userId, questId);
      if (existing && existing.next_reset_at > new Date()) {
        throw new Error('Quest on cooldown');
      }
    }
    
    // Initialize progress
    const initialProgress = {};
    for (const objective of quest.objectives) {
      const key = `${objective.type}_${objective.target || ''}`;
      initialProgress[key] = {
        current: 0,
        required: objective.count
      };
    }
    
    // Create user quest record
    await this.userQuestRepo.create({
      user_id: userId,
      quest_id: questId,
      status: 'active',
      progress: initialProgress,
      started_at: new Date()
    });
    
    return { message: 'Quest started', quest };
  }

  /**
   * Update quest progress
   */
  async updateQuestProgress(userId, objectiveType, data) {
    // Get all active quests for user with this objective type
    const activeQuests = await this.userQuestRepo.findActiveByObjective(
      userId, 
      objectiveType
    );
    
    for (const userQuest of activeQuests) {
      const quest = await this.questRepo.findById(userQuest.quest_id);
      let progressUpdated = false;
      
      // Update progress for matching objectives
      for (const objective of quest.objectives) {
        if (objective.type !== objectiveType) continue;
        
        // Check if objective target matches (if specified)
        if (objective.target && objective.target !== data.target) continue;
        
        const progressKey = `${objective.type}_${objective.target || ''}`;
        const currentProgress = userQuest.progress[progressKey] || { current: 0 };
        
        // Increment progress
        currentProgress.current += data.count || 1;
        currentProgress.required = objective.count;
        
        // Cap at required
        if (currentProgress.current > currentProgress.required) {
          currentProgress.current = currentProgress.required;
        }
        
        userQuest.progress[progressKey] = currentProgress;
        progressUpdated = true;
      }
      
      if (progressUpdated) {
        // Check if all objectives completed
        const allComplete = this.checkQuestComplete(quest, userQuest.progress);
        
        if (allComplete) {
          await this.completeQuest(userId, userQuest.user_quest_id);
        } else {
          await this.userQuestRepo.updateProgress(
            userQuest.user_quest_id, 
            userQuest.progress
          );
        }
      }
    }
  }

  /**
   * Check if all objectives are complete
   */
  checkQuestComplete(quest, progress) {
    for (const objective of quest.objectives) {
      const key = `${objective.type}_${objective.target || ''}`;
      const objProgress = progress[key];
      
      if (!objProgress || objProgress.current < objProgress.required) {
        return false;
      }
    }
    return true;
  }

  /**
   * Complete a quest and grant rewards
   */
  async completeQuest(userId, userQuestId) {
    const userQuest = await this.userQuestRepo.findById(userQuestId);
    const quest = await this.questRepo.findById(userQuest.quest_id);
    
    // Mark as completed
    await this.userQuestRepo.update(userQuestId, {
      status: 'completed',
      completed_at: new Date()
    });
    
    // Grant rewards
    await this.grantQuestRewards(userId, quest.rewards);
    
    // If repeatable, schedule next reset
    if (quest.is_repeatable) {
      const nextReset = this.calculateNextReset(quest.reset_interval, quest.reset_time);
      await this.userQuestRepo.update(userQuestId, {
        reset_count: userQuest.reset_count + 1,
        next_reset_at: nextReset,
        status: 'active', // Reset to active
        progress: this.initializeProgress(quest.objectives)
      });
    }
    
    // Check if part of chain
    if (quest.quest_chain_id) {
      await this.checkChainCompletion(userId, quest.quest_chain_id);
    }
    
    // Emit completion event
    this.eventEmitter.emit('quest.completed', {
      userId,
      questId: quest.quest_id,
      questType: quest.quest_type,
      rewards: quest.rewards
    });
    
    return { message: 'Quest completed!', rewards: quest.rewards };
  }

  /**
   * Grant quest rewards to user
   */
  async grantQuestRewards(userId, rewards) {
    const updates = {};
    
    if (rewards.gold) updates.gold = rewards.gold;
    if (rewards.metal) updates.metal = rewards.metal;
    if (rewards.food) updates.food = rewards.food;
    if (rewards.xp) updates.experience = rewards.xp;
    
    if (Object.keys(updates).length > 0) {
      await this.userRepo.incrementResources(userId, updates);
    }
    
    // Grant units
    if (rewards.units) {
      for (const [unitType, count] of Object.entries(rewards.units)) {
        await this.userRepo.grantUnits(userId, unitType, count);
      }
    }
    
    // Grant items/cosmetics (would need inventory system)
    if (rewards.items || rewards.cosmetics) {
      // TODO: Implement when inventory system exists
    }
    
    // Grant premium currency
    if (rewards.premium) {
      await this.userRepo.incrementPremium(userId, rewards.premium);
    }
  }
}

module.exports = QuestService;
```

---

## 🎓 2. TUTORIAL QUEST CHAIN (5h)

### 2.1 Tutorial Quests (10 quests)

**Chain Name:** "Commander's First Steps"

```javascript
const TUTORIAL_QUESTS = [
  {
    id: 1,
    title: "Bienvenue, Commandant!",
    description: "Explorez votre base et construisez votre première mine d'or.",
    objectives: [
      { type: "build", target: "gold_mine", count: 1 }
    ],
    rewards: { gold: 500, xp: 50 },
    story_text: "Les portails dimensionnels menacent notre monde. Vous êtes notre dernier espoir.",
    icon: "🏗️"
  },
  {
    id: 2,
    title: "Ressources Vitales",
    description: "Construisez une ferme pour nourrir vos troupes.",
    objectives: [
      { type: "build", target: "farm", count: 1 }
    ],
    rewards: { gold: 300, food: 1000, xp: 50 },
    prerequisite_quests: [1],
    story_text: "Une armée affamée ne peut pas combattre.",
    icon: "🌾"
  },
  {
    id: 3,
    title: "Premiers Soldats",
    description: "Entraînez 10 unités d'infanterie.",
    objectives: [
      { type: "train_units", target: "infantry", count: 10 }
    ],
    rewards: { gold: 500, xp: 100 },
    prerequisite_quests: [2],
    story_text: "Il est temps de lever une armée.",
    icon: "🪖"
  },
  {
    id: 4,
    title: "Premier Portail",
    description: "Affrontez et vainquez votre premier portail gris.",
    objectives: [
      { type: "defeat_portal", tier: "grey", count: 1 }
    ],
    rewards: { gold: 1000, xp: 200, units: { infantry: 20 } },
    prerequisite_quests: [3],
    story_text: "Les portails sont des brèches vers d'autres dimensions. Fermez-les!",
    icon: "🌀"
  },
  {
    id: 5,
    title: "Technologie Avancée",
    description: "Lancez votre première recherche.",
    objectives: [
      { type: "research", count: 1 }
    ],
    rewards: { gold: 800, xp: 150 },
    prerequisite_quests: [4],
    story_text: "La technologie est notre avantage contre les créatures dimensionnelles.",
    icon: "🔬"
  },
  {
    id: 6,
    title: "Défenses Actives",
    description: "Construisez une tour de défense.",
    objectives: [
      { type: "build", target: "defense_tower", count: 1 }
    ],
    rewards: { gold: 1000, xp: 150 },
    prerequisite_quests: [5],
    story_text: "Protégez votre base des incursions ennemies.",
    icon: "🗼"
  },
  {
    id: 7,
    title: "Force de Frappe",
    description: "Entraînez vos premiers tanks.",
    objectives: [
      { type: "train_units", target: "tank", count: 5 }
    ],
    rewards: { gold: 1500, xp: 200 },
    prerequisite_quests: [6],
    story_text: "Les blindés sont essentiels pour les portails difficiles.",
    icon: "🚜"
  },
  {
    id: 8,
    title: "Chasseur de Portails",
    description: "Vainquez 3 portails au total.",
    objectives: [
      { type: "defeat_portal", count: 3 }
    ],
    rewards: { gold: 2000, xp: 300, cosmetics: ["portal_hunter_badge"] },
    prerequisite_quests: [7],
    story_text: "Prouvez votre valeur en tant que chasseur de portails.",
    icon: "🎯"
  },
  {
    id: 9,
    title: "Rejoindre une Alliance",
    description: "Créez ou rejoignez une alliance.",
    objectives: [
      { type: "join_alliance", count: 1 }
    ],
    rewards: { gold: 1000, xp: 200 },
    prerequisite_quests: [8],
    story_text: "Seul on va vite, ensemble on va loin.",
    icon: "👥"
  },
  {
    id: 10,
    title: "Commandant Confirmé",
    description: "Atteignez le niveau 5.",
    objectives: [
      { type: "reach_level", level: 5 }
    ],
    rewards: { 
      gold: 5000, 
      xp: 500, 
      premium: 100,
      cosmetics: ["commander_title"],
      units: { infantry: 50, tank: 10 }
    },
    prerequisite_quests: [9],
    story_text: "Félicitations! Vous êtes maintenant un Commandant confirmé. La vraie aventure commence.",
    icon: "⭐"
  }
];
```

### 2.2 Tutorial UX Integration

**Frontend: `TutorialOverlay.jsx`**

- **Highlight mode:** Overlay sombre avec spotlight sur élément cible
- **Step indicator:** "Étape 3/10"
- **Arrow pointers:** Pointer vers bouton/zone UI
- **Skip option:** Bouton "Passer le tutoriel" (avec confirmation)
- **Auto-progress:** Avance automatiquement quand objectif complété

---

## 📖 3. STORY CAMPAIGN (8h)

### 3.1 Main Story Arc: "The Dimensional Crisis"

**30 quêtes narratives en 5 chapitres**

**Chapitre 1: "The First Breach" (6 quêtes)**
- Découverte du premier portail
- Investigation des origines
- Rencontre avec le scientifique Dr. Kael
- Boss: Void Scout (portail vert)

**Chapitre 2: "Expanding Rifts" (6 quêtes)**
- Portails se multiplient
- Recherche de la source
- Découverte de l'artefact ancien
- Boss: Rift Guardian (portail bleu)

**Chapitre 3: "The Shadow Syndicate" (6 quêtes)**
- Organisation ennemie révélée
- Infiltration base ennemie
- Vol de données critiques
- Boss: Syndicate Commander (portail violet)

**Chapitre 4: "Dimensional War" (6 quêtes)**
- Guerre totale contre envahisseurs
- Raid massif alliance
- Défense de la capitale
- Boss: Void Warlord (portail rouge)

**Chapitre 5: "The Final Gate" (6 quêtes)**
- Localisation du portail primaire
- Préparation assault final
- Bataille épique
- Boss: Dimensional Emperor (portail doré légendaire)

### 3.2 Story Quest Example

```javascript
{
  quest_id: 101,
  quest_type: "story",
  quest_chain_id: 1, // Chapter 1
  sequence_order: 1,
  title: "Anomalie Détectée",
  description: "Des lectures énergétiques anormales ont été détectées. Enquêtez sur le portail mystérieux.",
  story_text: `
    Dr. Kael (scientifique): "Commandant, nos capteurs ont détecté une anomalie spatiale massive. 
    Ce n'est pas naturel... C'est comme si quelqu'un avait déchiré le tissu de la réalité elle-même. 
    Nous devons investiguer immédiatement, mais soyez prudent."
  `,
  objectives: [
    { type: "discover_portal", tier: "green", count: 1 },
    { type: "defeat_portal", tier: "green", count: 1 }
  ],
  rewards: {
    gold: 2000,
    xp: 500,
    story_unlock: "chapter_1_scene_2",
    dialogue: {
      completion: `
        Dr. Kael: "Incroyable... Ces créatures ne viennent pas de notre monde. 
        Et ce portail... il est stabilisé par une source d'énergie inconnue. 
        Nous devons en apprendre plus."
      `
    }
  },
  level_required: 5,
  difficulty: 2,
  icon: "🔍"
}
```

---

## 🔄 4. DAILY & WEEKLY QUESTS (2h)

### 4.1 Daily Quest Pool (15 quests)

**Rotation aléatoire: 3 quêtes par jour**

```javascript
const DAILY_QUESTS = [
  {
    title: "Chasseur Quotidien",
    objectives: [{ type: "defeat_portal", count: 3 }],
    rewards: { gold: 1000, xp: 200 }
  },
  {
    title: "Entraînement Intensif",
    objectives: [{ type: "train_units", count: 50 }],
    rewards: { gold: 800, xp: 150 }
  },
  {
    title: "Recherche Active",
    objectives: [{ type: "research", count: 1 }],
    rewards: { gold: 1200, xp: 250 }
  },
  {
    title: "Expansion Rapide",
    objectives: [{ type: "upgrade_building", count: 2 }],
    rewards: { gold: 1500, xp: 300 }
  },
  {
    title: "Ressources Abondantes",
    objectives: [{ type: "collect_resources", count: 10000 }],
    rewards: { gold: 500, xp: 100 }
  }
  // ... 10 more variants
];
```

### 4.2 Weekly Quest Pool (8 quests)

**Rotation: 2 quêtes par semaine (reset lundi 00:00)**

```javascript
const WEEKLY_QUESTS = [
  {
    title: "Maître des Portails",
    objectives: [
      { type: "defeat_portal", tier: "blue", count: 5 },
      { type: "defeat_portal", tier: "violet", count: 2 }
    ],
    rewards: { gold: 5000, xp: 1000, premium: 50 },
    difficulty: 3
  },
  {
    title: "Tueur de Boss",
    objectives: [{ type: "defeat_boss", count: 3 }],
    rewards: { gold: 7000, xp: 1500, premium: 100 },
    difficulty: 4
  },
  {
    title: "Champion d'Alliance",
    objectives: [
      { type: "alliance_raid_participation", count: 2 },
      { type: "alliance_contribution", amount: 10000 }
    ],
    rewards: { gold: 6000, xp: 1200, premium: 75 },
    difficulty: 4
  }
  // ... 5 more
];
```

---

## 🎨 Frontend Components

### Quest System UI (5 fichiers)

**1. QuestLog.jsx** (main quest interface)
- Tab system: Active | Completed | Available
- Quest cards avec progress bars
- Filter par type (tutorial, story, daily, weekly)
- Sort par difficulty, rewards

**2. QuestCard.jsx** (individual quest display)
- Icon + title
- Description + story text (expandable)
- Objectives avec checkboxes
- Progress: "2/3 portails gris vaincus"
- Rewards preview
- Accept/Abandon buttons

**3. QuestTracker.jsx** (in-game overlay)
- Mini widget affichant 1-3 quêtes actives
- Collapsible sidebar
- Real-time progress updates
- Click to focus on objective

**4. QuestCompletionModal.jsx** (celebration)
- Victory animation
- Rewards showcase avec icons
- XP bar fill animation
- "Next quest" button si chain

**5. TutorialOverlay.jsx** (guided tutorial)
- Dark overlay + spotlight
- Arrow pointers
- Step-by-step instructions
- Progress indicator

### API Client

**Fichier:** `frontend/src/api/quests.js`

```javascript
export const getAvailableQuests = () => 
  axiosInstance.get('/quests/available');

export const getActiveQuests = () => 
  axiosInstance.get('/quests/active');

export const getCompletedQuests = (limit = 20, offset = 0) => 
  axiosInstance.get('/quests/completed', { params: { limit, offset } });

export const startQuest = (questId) => 
  axiosInstance.post(`/quests/${questId}/start`);

export const abandonQuest = (questId) => 
  axiosInstance.post(`/quests/${questId}/abandon`);

export const getQuestProgress = (questId) => 
  axiosInstance.get(`/quests/${questId}/progress`);

export const claimQuestReward = (questId) => 
  axiosInstance.post(`/quests/${questId}/claim`);
```

---

## 📊 API Endpoints

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/v1/quests/available` | Quêtes disponibles pour user | ✅ |
| GET | `/api/v1/quests/active` | Quêtes en cours | ✅ |
| GET | `/api/v1/quests/completed` | Historique quêtes complétées | ✅ |
| GET | `/api/v1/quests/:id` | Détail quête | ✅ |
| POST | `/api/v1/quests/:id/start` | Accepter/démarrer quête | ✅ |
| POST | `/api/v1/quests/:id/abandon` | Abandonner quête | ✅ |
| GET | `/api/v1/quests/:id/progress` | Progression quête | ✅ |
| GET | `/api/v1/quests/chains/:chainId` | Toutes quêtes d'une chaîne | ✅ |
| GET | `/api/v1/quests/daily` | Quêtes quotidiennes | ✅ |
| GET | `/api/v1/quests/weekly` | Quêtes hebdomadaires | ✅ |
| POST | `/api/v1/quests/admin/create` | Créer quête (admin) | 🔒 |

---

## ✅ Implementation Checklist

### Backend (18h)
- [ ] Create database schema (tables + migrations) (2h)
- [ ] Implement QuestService with event listeners (6h)
- [ ] Create QuestRepository (2h)
- [ ] Seed tutorial quest chain (1h)
- [ ] Seed story campaign quests (3h)
- [ ] Implement daily/weekly quest rotation (2h)
- [ ] Add API endpoints + controllers (2h)

### Frontend (10h)
- [ ] Create QuestLog main page (3h)
- [ ] Implement QuestCard component (2h)
- [ ] Add QuestTracker in-game overlay (2h)
- [ ] Create QuestCompletionModal (1h)
- [ ] Build TutorialOverlay system (2h)

### Testing (2h)
- [ ] Unit tests for QuestService (1h)
- [ ] E2E test quest completion flow (1h)

**Total: 30h**

---

## 🎯 Success Metrics

| Métrique | Objectif | Impact |
|----------|----------|--------|
| **Tutorial completion rate** | >70% | Onboarding |
| **Daily quest completion** | >40% | Retention |
| **Story quest engagement** | >60% reach Chapter 3 | Narrative |
| **Average quests per session** | 2-3 | Engagement |

---

## 🔮 Future Extensions

### Phase 2 (Q1 2026)
- **Dynamic Events:** Limited-time event quests
- **Community Quests:** Server-wide objectives
- **Quest Builder:** Player-created quests (UGC)
- **Voice Acting:** Narrative cutscenes
- **Quest Achievements:** Meta-progression

---

**Document Status:** ✅ Specification Complete  
**Next Step:** Backend implementation (18h)  
**Dependencies:** Portal System (✅), Event System (✅)
