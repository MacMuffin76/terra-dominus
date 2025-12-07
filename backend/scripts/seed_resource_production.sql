-- Script SQL pour peupler la table resource_production avec les données de production

-- Suppression des anciennes données
DELETE FROM resource_production;

-- Insertion des données de production pour les bâtiments et niveaux
-- Exemple simplifié, à adapter selon la logique métier et les IDs réels

INSERT INTO resource_production (building_id, building_name, resource_type_id, amount, level, production_rate, last_updated)
VALUES
  (1, 'Mine de métal', 1, 0, 1, 100, NOW()),
  (1, 'Mine de métal', 1, 0, 2, 200, NOW()),
  (2, 'Mine d\'or', 2, 0, 1, 80, NOW()),
  (2, 'Mine d\'or', 2, 0, 2, 160, NOW()),
  (3, 'Extracteur', 3, 0, 1, 90, NOW()),
  (3, 'Extracteur', 3, 0, 2, 180, NOW()),
  (4, 'Centrale électrique', 4, 0, 1, 50, NOW()),
  (4, 'Centrale électrique', 4, 0, 2, 100, NOW());

-- Ajouter ici les autres niveaux et bâtiments selon la logique métier
