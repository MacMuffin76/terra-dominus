-- Migration: Ajout des nouvelles recherches militaires
-- Date: 2025-12-13
-- Description: Ajoute les recherches manquantes pour le nouveau système de déblocage des unités

-- Note: Cette migration suppose que la table 'researches' existe avec les colonnes suivantes:
-- id, name, description, category, tier, required_lab_level, cost_gold, cost_metal, cost_fuel, research_time, effects

-- Vérifier si les recherches existent déjà avant insertion
-- Si elles existent, cette migration ne fera rien

-- 1. Formation Militaire Avancée (MILITARY_TRAINING_2)
INSERT INTO researches (name, description, category, tier, required_lab_level, cost_gold, cost_metal, cost_fuel, research_time, effects, icon)
SELECT 
  'Formation Militaire Avancée',
  'Débloque Tireurs d''Élite et améliore l''entraînement de l''infanterie.',
  'military_infantry',
  2,
  3,
  800,
  500,
  200,
  600,
  '{"unlocks": ["marksmen"], "infantryAttackBonus": 0.10}',
  'formation_militaire_2.png'
WHERE NOT EXISTS (
  SELECT 1 FROM researches WHERE name = 'Formation Militaire Avancée'
);

-- 2. Tactiques de Guérilla I (GUERRILLA_TACTICS_1)
INSERT INTO researches (name, description, category, tier, required_lab_level, cost_gold, cost_metal, cost_fuel, research_time, effects, icon)
SELECT 
  'Tactiques de Guérilla I',
  'Débloque Éclaireurs et améliore la vitesse de l''infanterie légère.',
  'military_infantry',
  2,
  2,
  500,
  300,
  200,
  420,
  '{"unlocks": ["scouts"], "infantrySpeedBonus": 0.15}',
  'guerrilla_tactics.png'
WHERE NOT EXISTS (
  SELECT 1 FROM researches WHERE name = 'Tactiques de Guérilla I'
);

-- 3. Motorisation I (MOTORIZATION_1)
INSERT INTO researches (name, description, category, tier, required_lab_level, cost_gold, cost_metal, cost_fuel, research_time, effects, icon)
SELECT 
  'Motorisation I',
  'Débloque Transport Blindé. Premiers véhicules motorisés.',
  'military_vehicles',
  2,
  2,
  600,
  400,
  300,
  480,
  '{"unlocks": ["transport"], "vehicleSpeedBonus": 0.05}',
  'motorization_1.png'
WHERE NOT EXISTS (
  SELECT 1 FROM researches WHERE name = 'Motorisation I'
);

-- 4. Motorisation II (MOTORIZATION_2)
INSERT INTO researches (name, description, category, tier, required_lab_level, cost_gold, cost_metal, cost_fuel, research_time, effects, icon)
SELECT 
  'Motorisation II',
  'Débloque Chars Légers. Véhicules de combat blindés.',
  'military_vehicles',
  3,
  4,
  1200,
  800,
  600,
  900,
  '{"unlocks": ["light_tank"], "vehicleAttackBonus": 0.10}',
  'motorization_2.png'
WHERE NOT EXISTS (
  SELECT 1 FROM researches WHERE name = 'Motorisation II'
);

-- 5. Armes Antichar (ANTI_TANK_WEAPONS)
INSERT INTO researches (name, description, category, tier, required_lab_level, cost_gold, cost_metal, cost_fuel, research_time, effects, icon)
SELECT 
  'Armes Antichar',
  'Débloque Anti-Blindage. Lance-roquettes et armes perforantes.',
  'military_advanced',
  3,
  5,
  1500,
  1200,
  800,
  1200,
  '{"unlocks": ["anti_armor"], "antiArmorBonus": 0.30}',
  'anti_tank_weapons.png'
WHERE NOT EXISTS (
  SELECT 1 FROM researches WHERE name = 'Armes Antichar'
);

-- 6. Blindage Lourd (HEAVY_ARMOR)
INSERT INTO researches (name, description, category, tier, required_lab_level, cost_gold, cost_metal, cost_fuel, research_time, effects, icon)
SELECT 
  'Blindage Lourd',
  'Débloque Tanks Lourds. Blindages ultra-résistants.',
  'military_vehicles',
  4,
  8,
  3000,
  2500,
  2000,
  2400,
  '{"unlocks": ["heavy_tank"], "vehicleDefenseBonus": 0.20}',
  'heavy_armor.png'
WHERE NOT EXISTS (
  SELECT 1 FROM researches WHERE name = 'Blindage Lourd'
);

-- Vérification: Afficher toutes les recherches militaires
SELECT 
  name,
  category,
  tier,
  cost_gold,
  cost_metal,
  cost_fuel,
  research_time / 60 as time_minutes
FROM researches
WHERE category LIKE 'military%'
ORDER BY tier, name;

-- Note pour l'administrateur:
-- Après cette migration, vérifiez que :
-- 1. Les 6 nouvelles recherches sont présentes
-- 2. Les prérequis entre recherches sont correctement configurés (table research_dependencies si elle existe)
-- 3. Les joueurs existants n'ont pas ces recherches automatiquement débloquées
