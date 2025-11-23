-- ================================================
--  SCRIPT SQL COMPLET - TERRADOMINUS DATABASE INIT
--  PostgreSQL - Multi-villes par joueur + SEED
-- ================================================

-- ================================================
-- DROP TABLES (dans le bon ordre de dépendance)
-- ================================================
DROP TABLE IF EXISTS fleet_units;
DROP TABLE IF EXISTS fleets;
DROP TABLE IF EXISTS combat_logs;
DROP TABLE IF EXISTS action_logs;
DROP TABLE IF EXISTS resource_costs;
DROP TABLE IF EXISTS resource_production;
DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS defense;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS researches;
DROP TABLE IF EXISTS trainings;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS entities;
DROP TABLE IF EXISTS users;

-- ================================================
-- USERS
-- ================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    points_experience INTEGER NOT NULL DEFAULT 0 CHECK (points_experience >= 0),
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    rang VARCHAR(50) NOT NULL DEFAULT 'novice',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- ================================================
-- ENTITIES (catalogue générique)
-- ================================================
CREATE TABLE entities (
    entity_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(255) NOT NULL,   -- ex: 'building', 'unit', 'defense', 'research', 'training', 'facility'
    entity_name VARCHAR(255) NOT NULL    -- ex: 'Mine de métal', 'Soldat', 'Tourelle de base'
);

CREATE INDEX idx_entities_type_name
    ON entities (entity_type, entity_name);

-- ================================================
-- CITIES (villes du joueur)
-- ================================================
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_capital BOOLEAN NOT NULL DEFAULT FALSE,
    coord_x INTEGER,
    coord_y INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cities_user_name UNIQUE (user_id, name)
);

CREATE INDEX idx_cities_user
    ON cities (user_id);

-- ================================================
-- RESOURCE COSTS (coûts paramétrables par entité / niveau / type de ressource)
-- ================================================
CREATE TABLE resource_costs (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,  -- ex: 'metal', 'energie', 'carburant', 'or'
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    level INTEGER NOT NULL CHECK (level >= 1)
);

CREATE INDEX idx_resource_costs_entity_level
    ON resource_costs (entity_id, level);

-- ================================================
-- RESOURCES (stock par ville)
-- ================================================
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,           -- ex: 'metal', 'energie', 'carburant', 'or'
    amount INTEGER NOT NULL CHECK (amount >= 0),
    last_update TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_resources_city_type UNIQUE (city_id, type)
);

CREATE INDEX idx_resources_city
    ON resources (city_id);

-- ================================================
-- BUILDINGS (bâtiments par ville)
-- ================================================
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
    capacite INTEGER NOT NULL DEFAULT 0 CHECK (capacite >= 0),
    description VARCHAR(1500),
    build_start TIMESTAMP NULL,
    build_duration INTEGER NULL,
    building_type_id INTEGER NULL REFERENCES entities(entity_id) ON DELETE SET NULL,
    CONSTRAINT uq_buildings_city_name UNIQUE (city_id, name)
);

CREATE INDEX idx_buildings_city
    ON buildings (city_id);

-- ================================================
-- FACILITIES (installations spéciales par ville)
-- ================================================
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1500),
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
    nextlevelcost INTEGER NOT NULL CHECK (nextlevelcost >= 0),
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP NOT NULL DEFAULT NOW(),
    facility_type_id INTEGER NULL REFERENCES entities(entity_id) ON DELETE SET NULL,
    CONSTRAINT uq_facilities_city_name UNIQUE (city_id, name)
);

CREATE INDEX idx_facilities_city
    ON facilities (city_id);

-- ================================================
-- RESOURCE PRODUCTION (paramétrage de la production par bâtiment)
-- ================================================
CREATE TABLE resource_production (
    production_id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    resource_type_id INTEGER NOT NULL,   -- si tu crées plus tard une table resource_types, tu pourras ajouter une FK
    amount INTEGER NOT NULL CHECK (amount >= 0),
    production_rate INTEGER NOT NULL CHECK (production_rate >= 0),
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    level INTEGER NOT NULL CHECK (level >= 1),
    building_name VARCHAR(255) NOT NULL
);

CREATE INDEX idx_resource_production_building
    ON resource_production (building_id);

-- ================================================
-- DEFENSE (défenses par ville)
-- ================================================
CREATE TABLE defense (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1500),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    cost INTEGER NOT NULL CHECK (cost >= 0),
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_defense_city_name UNIQUE (city_id, name)
);

CREATE INDEX idx_defense_city
    ON defense (city_id);

-- ================================================
-- UNITS (unités par ville - garnison)
-- ================================================
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    force INTEGER NOT NULL DEFAULT 0 CHECK (force >= 0),
    capacite_speciale VARCHAR(255),
    CONSTRAINT uq_units_city_name UNIQUE (city_id, name)
);

CREATE INDEX idx_units_city
    ON units (city_id);

-- ================================================
-- RESEARCHES (recherches globales par joueur)
-- ================================================
CREATE TABLE researches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1500),
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
    nextlevelcost INTEGER NOT NULL CHECK (nextlevelcost >= 0),
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_researches_user_name UNIQUE (user_id, name)
);

CREATE INDEX idx_researches_user
    ON researches (user_id);

-- ================================================
-- TRAININGS (bonus / doctrines globales par joueur)
-- ================================================
CREATE TABLE trainings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1500),
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
    nextlevelcost INTEGER NOT NULL CHECK (nextlevelcost >= 0),
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trainings_user_name UNIQUE (user_id, name)
);

CREATE INDEX idx_trainings_user
    ON trainings (user_id);

-- ================================================
-- FLEETS (flottes du joueur)
-- ================================================
CREATE TABLE fleets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'idle',  -- ex: 'idle', 'moving', 'attacking', 'returning'
    position_x INTEGER,
    position_y INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fleets_user_name UNIQUE (user_id, name)
);

CREATE INDEX idx_fleets_user
    ON fleets (user_id);

CREATE INDEX idx_fleets_origin_city
    ON fleets (origin_city_id);

-- ================================================
-- FLEET_UNITS (composition des flottes)
-- ================================================
CREATE TABLE fleet_units (
    id SERIAL PRIMARY KEY,
    fleet_id INTEGER NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
    unit_name VARCHAR(255) NOT NULL,          -- type d'unité (pointera plus tard vers une table unit_types si tu en crées une)
    quantity INTEGER NOT NULL CHECK (quantity >= 0)
);

CREATE INDEX idx_fleet_units_fleet
    ON fleet_units (fleet_id);

-- ================================================
-- ACTION LOGS (logs génériques pour le joueur)
-- ================================================
CREATE TABLE action_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL,            -- ex: 'BUILDING_COMPLETE', 'RESEARCH_COMPLETE', 'RESOURCE_UPDATE'
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_action_logs_user_created
    ON action_logs (user_id, created_at DESC);

-- ================================================
-- COMBAT LOGS (rapports de combat)
-- ================================================
CREATE TABLE combat_logs (
    id SERIAL PRIMARY KEY,
    attacker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    defender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_combat_logs_created
    ON combat_logs (created_at DESC);

-- ============================================================
-- SEED CONFIG JEU : ENTITIES + RESOURCE_COSTS
-- ============================================================

-- ENTITIES
INSERT INTO entities (entity_type, entity_name) VALUES
    -- BÂTIMENTS (BUILDINGS)
    ('building', 'Mine d''or'),
    ('building', 'Mine de métal'),
    ('building', 'Extracteur'),
    ('building', 'Centrale électrique'),
    ('building', 'Hangar'),
    ('building', 'Réservoir'),

    -- INSTALLATIONS (FACILITIES)
    ('facility', 'Centre de Commandement'),
    ('facility', 'Laboratoire de Recherche'),
    ('facility', 'Terrain d''Entraînement'),

    -- UNITÉS (UNITS)
    ('unit', 'Drone d’assaut terrestre'),
    ('unit', 'Fantassin plasmique'),
    ('unit', 'Infiltrateur holo-camouflage'),
    ('unit', 'Tireur à antimatière'),
    ('unit', 'Artilleur à railgun'),
    ('unit', 'Exo-sentinelle'),
    ('unit', 'Commandos nano-armure'),
    ('unit', 'Légionnaire quantique'),

    -- DÉFENSES (DEFENSE)
    ('defense', 'Tourelle à laser'),
    ('defense', 'Canon railgun'),
    ('defense', 'Générateur de champ de force'),
    ('defense', 'Lance-missiles sol-air'),
    ('defense', 'Mine antigrav'),
    ('defense', 'Système de brouillage EM'),
    ('defense', 'Tour plasma'),
    ('defense', 'Lance-charge électromagnétique'),
    ('defense', 'Mur nanobot'),
    ('defense', 'Radar quantique'),

    -- RECHERCHES (RESEARCH)
    ('research', 'Technologie Laser Photonique'),
    ('research', 'Systèmes d’Armes Railgun'),
    ('research', 'Déploiement de Champs de Force'),
    ('research', 'Guidage Avancé de Missiles'),
    ('research', 'Antigravitationnelle'),
    ('research', 'Ingénierie des Contre-mesures EM'),
    ('research', 'Confinement de Plasma'),
    ('research', 'Impulsion EM Avancée'),
    ('research', 'Nanotechnologie Autoréplicante'),
    ('research', 'Réseau de Détection Quantique');

-- ============================================================
-- RESOURCE_COSTS : COÛTS PAR NIVEAU
-- ============================================================

-- Mine d'or
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'metal',   100, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'energie',  50, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'metal',   200, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'energie', 100, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'metal',   400, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'energie', 200, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'metal',   800, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'energie', 400, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'metal',  1600, 5),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine d''or'), 'energie', 800, 5);

-- Mine de métal
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'metal',   100, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'energie',  50, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'metal',   200, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'energie', 100, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'metal',   400, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'energie', 200, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'metal',   800, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'energie', 400, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'metal',  1600, 5),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Mine de métal'), 'energie', 800, 5);

-- Extracteur
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'metal',     120, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'carburant',  60, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'metal',     240, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'carburant', 120, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'metal',     480, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'carburant', 240, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'metal',     960, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'carburant', 480, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'metal',    1920, 5),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Extracteur'), 'carburant', 960, 5);

-- Centrale électrique
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'metal',     150, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'carburant',  80, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'metal',     300, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'carburant', 160, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'metal',     600, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'carburant', 320, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'metal',    1200, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'carburant', 640, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'metal',    2400, 5),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Centrale électrique'), 'carburant',1280, 5);

-- Hangar
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'metal',  200, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'or',     150, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'metal',  400, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'or',     300, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'metal',  800, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'or',     600, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'metal', 1600, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'or',    1200, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'metal', 3200, 5),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Hangar'), 'or',    2400, 5);

-- Réservoir
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'metal',     180, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'carburant', 140, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'metal',     360, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'carburant', 280, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'metal',     720, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'carburant', 560, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'metal',    1440, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'carburant',1120, 4),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'metal',    2880, 5),
    ((SELECT entity_id FROM entities WHERE entity_type='building' AND entity_name='Réservoir'), 'carburant',2240, 5);

-- Centre de Commandement
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Centre de Commandement'), 'metal',  500, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Centre de Commandement'), 'or',     300, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Centre de Commandement'), 'metal', 1000, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Centre de Commandement'), 'or',     600, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Centre de Commandement'), 'metal', 2000, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Centre de Commandement'), 'or',    1200, 3);

-- Laboratoire de Recherche
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Laboratoire de Recherche'), 'metal',   400, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Laboratoire de Recherche'), 'energie', 300, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Laboratoire de Recherche'), 'metal',   800, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Laboratoire de Recherche'), 'energie', 600, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Laboratoire de Recherche'), 'metal',  1600, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Laboratoire de Recherche'), 'energie',1200, 3);

-- Terrain d'Entraînement
INSERT INTO resource_costs (entity_id, resource_type, amount, level) VALUES
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Terrain d''Entraînement'), 'metal',    300, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Terrain d''Entraînement'), 'carburant',200, 1),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Terrain d''Entraînement'), 'metal',    600, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Terrain d''Entraînement'), 'carburant',400, 2),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Terrain d''Entraînement'), 'metal',   1200, 3),
    ((SELECT entity_id FROM entities WHERE entity_type='facility' AND entity_name='Terrain d''Entraînement'), 'carburant',800, 3);

-- Recherche : exemples
-- (je te laisse le même pattern que tout à l'heure, déjà en place si besoin de les compléter)
-- ...

-- FIN DU SCRIPT
