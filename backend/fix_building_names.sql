-- Script de correction des noms de bâtiments (ajout des accents)
-- À exécuter sur votre base de données PostgreSQL

-- Mise à jour des entités
UPDATE entities SET entity_name = 'Mine de métal' WHERE entity_name = 'Mine de metal' AND entity_type = 'building';
UPDATE entities SET entity_name = 'Centrale électrique' WHERE entity_name = 'Centrale electrique' AND entity_type = 'building';
UPDATE entities SET entity_name = 'Réservoir' WHERE entity_name = 'Reservoir' AND entity_type = 'building';

-- Mise à jour des bâtiments existants
UPDATE buildings SET name = 'Mine de métal' WHERE name = 'Mine de metal';
UPDATE buildings SET name = 'Centrale électrique' WHERE name = 'Centrale electrique';
UPDATE buildings SET name = 'Réservoir' WHERE name = 'Reservoir';

-- Vérification
SELECT entity_type, entity_name FROM entities WHERE entity_type = 'building' ORDER BY entity_id;
