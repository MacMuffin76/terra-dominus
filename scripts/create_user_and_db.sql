-- Script pour créer l'utilisateur terra_user et la base de données terra_dominus
-- À exécuter en tant que superuser postgres

-- Supprimer l'utilisateur s'il existe déjà (facultatif)
DROP USER IF EXISTS terra_user;

-- Créer l'utilisateur
CREATE USER terra_user WITH PASSWORD 'Pervetboght76!';

-- Donner les privilèges sur la base de données existante
GRANT ALL PRIVILEGES ON DATABASE terra_dominus TO terra_user;

-- Se connecter à terra_dominus pour donner les privilèges sur le schéma
\c terra_dominus

-- Donner tous les privilèges sur le schéma public
GRANT ALL PRIVILEGES ON SCHEMA public TO terra_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO terra_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO terra_user;

-- Donner les privilèges par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO terra_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO terra_user;

-- Vérification
\du terra_user
