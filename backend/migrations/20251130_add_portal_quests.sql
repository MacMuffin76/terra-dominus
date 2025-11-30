-- Migration: Portal Quests System
-- Description: Adds quest system for portal campaign progression
-- Author: Terra Dominus Team
-- Date: 2025-11-30

-- Quest definitions table
CREATE TABLE IF NOT EXISTS portal_quests (
  id SERIAL PRIMARY KEY,
  quest_key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  quest_type VARCHAR(50) NOT NULL, -- 'tutorial', 'daily', 'weekly', 'campaign', 'achievement'
  
  -- Prerequisites
  required_level INTEGER DEFAULT 0,
  required_quest_key VARCHAR(100), -- Quest qui doit être complétée avant
  required_portal_tier VARCHAR(20), -- 'grey', 'green', 'blue', etc.
  
  -- Objectives
  objective_type VARCHAR(50) NOT NULL, -- 'complete_portals', 'defeat_boss', 'collect_resources', 'reach_mastery'
  objective_target INTEGER NOT NULL, -- Quantité à atteindre
  objective_tier VARCHAR(20), -- Tier spécifique si applicable
  
  -- Rewards
  reward_gold INTEGER DEFAULT 0,
  reward_metal INTEGER DEFAULT 0,
  reward_fuel INTEGER DEFAULT 0,
  reward_titanium INTEGER DEFAULT 0,
  reward_plasma INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  reward_blueprint_rarity VARCHAR(20), -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  reward_units JSONB, -- [{ type: 'Infantry', quantity: 10 }]
  reward_cosmetic VARCHAR(100), -- Clé du cosmétique débloqué
  
  -- Metadata
  difficulty INTEGER DEFAULT 1, -- 1-10
  is_repeatable BOOLEAN DEFAULT FALSE,
  cooldown_hours INTEGER DEFAULT 0, -- Cooldown pour quêtes répétables
  expires_at TIMESTAMP, -- Pour quêtes limitées dans le temps
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User quest progress tracking
CREATE TABLE IF NOT EXISTS user_portal_quests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_key VARCHAR(100) NOT NULL REFERENCES portal_quests(quest_key) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'in_progress', 'completed', 'claimed'
  progress INTEGER DEFAULT 0, -- Progression actuelle vers l'objectif
  
  -- Timestamps
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP,
  last_progress_at TIMESTAMP,
  next_available_at TIMESTAMP, -- Pour quêtes répétables avec cooldown
  
  -- Metadata
  attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, quest_key)
);

-- Quest chains for campaign progression
CREATE TABLE IF NOT EXISTS portal_quest_chains (
  id SERIAL PRIMARY KEY,
  chain_key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  
  -- Quests in order
  quest_keys TEXT[] NOT NULL, -- Array of quest_key in sequence
  
  -- Rewards for completing entire chain
  chain_reward_gold INTEGER DEFAULT 0,
  chain_reward_xp INTEGER DEFAULT 0,
  chain_reward_title VARCHAR(100), -- Player title unlocked
  chain_reward_cosmetic VARCHAR(100),
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User chain progress
CREATE TABLE IF NOT EXISTS user_portal_quest_chains (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain_key VARCHAR(100) NOT NULL REFERENCES portal_quest_chains(chain_key) ON DELETE CASCADE,
  
  current_quest_index INTEGER DEFAULT 0,
  completed_quests INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed'
  
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, chain_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_quests_type ON portal_quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_portal_quests_active ON portal_quests(is_active);
CREATE INDEX IF NOT EXISTS idx_user_portal_quests_user ON user_portal_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portal_quests_status ON user_portal_quests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_quest_chains_user ON user_portal_quest_chains(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_portal_quests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portal_quests_update_timestamp
  BEFORE UPDATE ON portal_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_quests_timestamp();

CREATE TRIGGER user_portal_quests_update_timestamp
  BEFORE UPDATE ON user_portal_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_quests_timestamp();

-- Seed initial tutorial and campaign quests
INSERT INTO portal_quests (quest_key, title, description, quest_type, objective_type, objective_target, reward_gold, reward_xp, difficulty, sort_order) VALUES
-- Tutorial chain
('portal_tutorial_1', 'Première Exploration', 'Complétez votre premier portail gris pour découvrir les bases.', 'tutorial', 'complete_portals', 1, 1000, 50, 1, 1),
('portal_tutorial_2', 'Chasseur Confirmé', 'Complétez 5 portails de n''importe quel tier.', 'tutorial', 'complete_portals', 5, 2500, 100, 2, 2),
('portal_tutorial_3', 'Maître Apprenti', 'Atteignez le niveau 1 de maîtrise sur n''importe quel tier.', 'tutorial', 'reach_mastery', 1, 5000, 200, 3, 3),

-- Campaign - Grey tier
('campaign_grey_1', 'Explorateur Novice', 'Complétez 10 portails gris.', 'campaign', 'complete_portals', 10, 3000, 150, 2, 10),
('campaign_grey_2', 'Maîtrise Basique', 'Atteignez le niveau 2 de maîtrise sur les portails gris.', 'campaign', 'reach_mastery', 2, 5000, 300, 3, 11),

-- Campaign - Green tier
('campaign_green_1', 'Portails Verts', 'Complétez votre premier portail vert.', 'campaign', 'complete_portals', 1, 5000, 250, 3, 20),
('campaign_green_2', 'Chasseur Vert', 'Complétez 10 portails verts.', 'campaign', 'complete_portals', 10, 10000, 500, 4, 21),

-- Campaign - Blue tier
('campaign_blue_1', 'Ascension Bleue', 'Complétez votre premier portail bleu.', 'campaign', 'complete_portals', 1, 10000, 500, 5, 30),
('campaign_blue_boss', 'Défi du Gardien', 'Battez votre premier boss de portail.', 'campaign', 'defeat_boss', 1, 20000, 1000, 6, 31),

-- Campaign - Purple tier
('campaign_purple_1', 'Élite Pourpre', 'Complétez 5 portails pourpres.', 'campaign', 'complete_portals', 5, 25000, 1500, 7, 40),
('campaign_purple_boss', 'Titan Ancien', 'Battez un boss de type Ancient Titan.', 'campaign', 'defeat_boss', 1, 50000, 2500, 8, 41),

-- Campaign - Red tier
('campaign_red_1', 'Sang et Gloire', 'Complétez votre premier portail rouge.', 'campaign', 'complete_portals', 1, 50000, 3000, 9, 50),
('campaign_red_raid', 'Raid Légendaire', 'Participez à un raid d''alliance contre un boss.', 'campaign', 'defeat_boss', 1, 100000, 5000, 9, 51),

-- Campaign - Golden tier
('campaign_gold_legend', 'Légende Dorée', 'Complétez un portail doré légendaire.', 'campaign', 'complete_portals', 1, 150000, 10000, 10, 60);

-- Daily quests
INSERT INTO portal_quests (quest_key, title, description, quest_type, objective_type, objective_target, reward_gold, reward_xp, is_repeatable, cooldown_hours, difficulty, sort_order) VALUES
('daily_complete_3', 'Exploration Quotidienne', 'Complétez 3 portails aujourd''hui.', 'daily', 'complete_portals', 3, 2000, 100, true, 24, 2, 100),
('daily_complete_5', 'Chasseur Actif', 'Complétez 5 portails aujourd''hui.', 'daily', 'complete_portals', 5, 5000, 250, true, 24, 3, 101),
('daily_boss', 'Défi du Boss', 'Attaquez un boss de portail.', 'daily', 'defeat_boss', 1, 10000, 500, true, 24, 5, 102);

-- Weekly quests
INSERT INTO portal_quests (quest_key, title, description, quest_type, objective_type, objective_target, reward_gold, reward_xp, is_repeatable, cooldown_hours, difficulty, sort_order) VALUES
('weekly_complete_20', 'Semaine Productive', 'Complétez 20 portails cette semaine.', 'weekly', 'complete_portals', 20, 15000, 1000, true, 168, 4, 200),
('weekly_blue_plus', 'Défi Avancé', 'Complétez 5 portails bleus ou supérieurs.', 'weekly', 'complete_portals', 5, 25000, 2000, true, 168, 6, 201),
('weekly_mastery', 'Maîtrise Hebdomadaire', 'Atteignez un nouveau niveau de maîtrise.', 'weekly', 'reach_mastery', 1, 30000, 2500, true, 168, 5, 202);

-- Create quest chains
INSERT INTO portal_quest_chains (chain_key, title, description, quest_keys, chain_reward_gold, chain_reward_xp, chain_reward_title, sort_order) VALUES
('tutorial_chain', 'Initiation aux Portails', 'Apprenez les bases de l''exploration des portails.', 
  ARRAY['portal_tutorial_1', 'portal_tutorial_2', 'portal_tutorial_3'], 
  10000, 500, 'Explorateur', 1),
  
('grey_mastery_chain', 'Maîtrise des Portails Gris', 'Dominez complètement les portails de tier gris.', 
  ARRAY['campaign_grey_1', 'campaign_grey_2'], 
  15000, 1000, 'Maître Gris', 2),
  
('green_progression', 'Ascension Verte', 'Progressez vers les portails de tier supérieur.', 
  ARRAY['campaign_green_1', 'campaign_green_2'], 
  25000, 1500, 'Chasseur Vert', 3),
  
('elite_hunter', 'Chasseur d''Élite', 'Affrontez les défis les plus difficiles.', 
  ARRAY['campaign_blue_1', 'campaign_blue_boss', 'campaign_purple_1', 'campaign_purple_boss'], 
  100000, 7500, 'Chasseur Légendaire', 4),
  
('legendary_path', 'Chemin Légendaire', 'Devenez une légende vivante.', 
  ARRAY['campaign_red_1', 'campaign_red_raid', 'campaign_gold_legend'], 
  250000, 20000, 'Légende des Portails', 5);

COMMENT ON TABLE portal_quests IS 'Quest definitions for portal campaign system';
COMMENT ON TABLE user_portal_quests IS 'Tracks user progress on portal quests';
COMMENT ON TABLE portal_quest_chains IS 'Quest chains for narrative progression';
COMMENT ON TABLE user_portal_quest_chains IS 'User progress on quest chains';
