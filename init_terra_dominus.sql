-- ================================================
--  SCRIPT SQL COMPLET - TERRADOMINUS DATABASE INIT
--  PostgreSQL - Multi-villes par joueur + SEED 50 niveaux
--  metal > or > energie > carburant
--  Mines & Extracteur ajustés :
--    - Mine de métal  : metal + un peu d'or
--    - Mine d'or      : metal + plus d'or
--    - Extracteur     : metal + encore plus d'or
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
    entity_type VARCHAR(255) NOT NULL,   -- 'building', 'unit', 'defense', 'research', 'training', 'facility'
    entity_name VARCHAR(255) NOT NULL
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
-- RESOURCE COSTS (coûts paramétrables)
-- ================================================
CREATE TABLE resource_costs (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,  -- 'metal', 'energie', 'carburant', 'or'
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
    type VARCHAR(50) NOT NULL,           -- 'metal', 'energie', 'carburant', 'or'
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
-- RESOURCE PRODUCTION (non utilisé côté back, gardé au cas où)
-- ================================================
CREATE TABLE resource_production (
    production_id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    resource_type_id INTEGER NOT NULL,
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
    status VARCHAR(50) NOT NULL DEFAULT 'idle',
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
    unit_name VARCHAR(255) NOT NULL,
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
    log_type VARCHAR(50) NOT NULL,
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
-- SEED CONFIG JEU : ENTITIES
-- ============================================================

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
-- RESOURCE_COSTS : BASES NIVEAU 1
-- ============================================================

CREATE TEMP TABLE base_costs (
    entity_type   VARCHAR(50),
    entity_name   VARCHAR(255),
    resource_type VARCHAR(50),
    base_amount   NUMERIC
);

-- BÂTIMENTS
INSERT INTO base_costs (entity_type, entity_name, resource_type, base_amount) VALUES
    -- Mine de métal : metal + un peu d'or
    ('building', 'Mine de métal',         'metal',  80),
    ('building', 'Mine de métal',         'or',     20),

    -- Mine d'or : metal + plus d'or que Mine de métal
    ('building', 'Mine d''or',            'metal', 100),
    ('building', 'Mine d''or',            'or',    60),

    -- Extracteur : metal + encore plus d'or (très gourmand en or)
    ('building', 'Extracteur',            'metal', 150),
    ('building', 'Extracteur',            'or',   120),

    -- Centrale électrique : metal + or (plus cher que les mines)
    ('building', 'Centrale électrique',   'metal', 200),
    ('building', 'Centrale électrique',   'or',   100),

    -- Hangar : metal + or (stockage)
    ('building', 'Hangar',                'metal', 180),
    ('building', 'Hangar',                'or',    80),

    -- Réservoir : metal + carburant (logique stockage carburant)
    ('building', 'Réservoir',             'metal',     120),
    ('building', 'Réservoir',             'carburant', 60);

-- FACILITIES
INSERT INTO base_costs (entity_type, entity_name, resource_type, base_amount) VALUES
    -- Centre de Commandement : metal + or
    ('facility', 'Centre de Commandement',      'metal',    400),
    ('facility', 'Centre de Commandement',      'or',       300),

    -- Laboratoire de Recherche : metal + energie
    ('facility', 'Laboratoire de Recherche',    'metal',    300),
    ('facility', 'Laboratoire de Recherche',    'energie',  200),

    -- Terrain d'Entraînement : metal + carburant
    ('facility', 'Terrain d''Entraînement',     'metal',    300),
    ('facility', 'Terrain d''Entraînement',     'carburant',150);

-- ============================================================
-- GÉNÉRATION AUTO SUR 50 NIVEAUX
--  metal > or > energie > carburant
-- ============================================================

DO $$
DECLARE
    lvl INT;
BEGIN
    FOR lvl IN 1..50 LOOP
        INSERT INTO resource_costs (entity_id, resource_type, amount, level)
        SELECT
            e.entity_id,
            bc.resource_type,
            (
                bc.base_amount *
                CASE bc.resource_type
                    WHEN 'metal'     THEN POWER(1.18, lvl - 1)  -- le plus rapide
                    WHEN 'or'        THEN POWER(1.16, lvl - 1)  -- un peu moins rapide
                    WHEN 'energie'   THEN POWER(1.15, lvl - 1)  -- intermédiaire
                    WHEN 'carburant' THEN POWER(1.13, lvl - 1)  -- le plus lent
                    ELSE 1.0
                END
            )::INT AS amount,
            lvl
        FROM base_costs bc
        JOIN entities e
          ON e.entity_type = bc.entity_type
         AND e.entity_name = bc.entity_name;
    END LOOP;
END $$;

-- FIN DU SCRIPT
