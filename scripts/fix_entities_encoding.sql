-- Script pour recréer toutes les entités avec le bon encodage UTF-8
-- À exécuter dans psql connecté à terra_dominus

-- Supprimer toutes les entités existantes
TRUNCATE TABLE entities CASCADE;

-- Recréer les entités de bâtiments
INSERT INTO entities (entity_id, entity_type, entity_name) VALUES
(1, 'building', 'Mine d''or'),
(2, 'building', 'Mine de metal'),
(3, 'building', 'Extracteur'),
(4, 'building', 'Centrale electrique'),
(5, 'building', 'Hangar'),
(6, 'building', 'Reservoir');

-- Recréer les entités d'installations
INSERT INTO entities (entity_id, entity_type, entity_name) VALUES
(9, 'facility', 'Terrain d''Entrainement'),
(10, 'facility', 'Centre de Recherche');

-- Recréer les entités d'unités
INSERT INTO entities (entity_id, entity_type, entity_name) VALUES
(13, 'unit', 'Tireur a antimatiere'),
(14, 'unit', 'Artilleur a railgun'),
(17, 'unit', 'Legionnaire quantique'),
(18, 'defense', 'Tourelle a laser');

-- Recréer les entités de défense
INSERT INTO entities (entity_id, entity_type, entity_name) VALUES
(20, 'defense', 'Generateur de champ de force'),
(23, 'defense', 'Systeme de brouillage EM'),
(25, 'defense', 'Lance-charge electromagnetique');

-- Recréer les entités de recherche
INSERT INTO entities (entity_id, entity_type, entity_name) VALUES
(29, 'research', 'Systemes des Armes Railgun'),
(30, 'research', 'Deploiement de Champs de Force'),
(31, 'research', 'Guidage Avance de Missiles'),
(33, 'research', 'Ingenierie des Contre-mesures EM'),
(35, 'research', 'Impulsion EM Avancee'),
(36, 'research', 'Nanotechnologie AutoReplicante'),
(37, 'research', 'Reseau de Detection Quantique');

-- Réinitialiser la séquence
SELECT setval('entities_entity_id_seq', (SELECT MAX(entity_id) FROM entities));

-- Vérifier le résultat
SELECT entity_id, entity_type, entity_name FROM entities ORDER BY entity_type, entity_id;
