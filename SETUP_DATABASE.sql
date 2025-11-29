-- ÉTAPE 1 : Créer l'utilisateur terra_user
-- Exécutez ces commandes une par une dans psql en tant que postgres

-- 1. Se connecter à PostgreSQL comme superuser
-- Commande : psql -U postgres

-- 2. Créer l'utilisateur (si erreur "already exists", passez à l'étape 3)
CREATE USER terra_user WITH PASSWORD 'Pervetboght76!';

-- 3. Donner les privilèges sur la base de données
GRANT ALL PRIVILEGES ON DATABASE terra_dominus TO terra_user;

-- 4. Se connecter à la base terra_dominus
\c terra_dominus

-- 5. Donner les privilèges sur le schéma public
GRANT ALL PRIVILEGES ON SCHEMA public TO terra_user;

-- 6. Donner les privilèges sur toutes les tables existantes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO terra_user;

-- 7. Donner les privilèges sur toutes les séquences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO terra_user;

-- 8. Privilèges par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO terra_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO terra_user;

-- 9. Vérifier que l'utilisateur existe
\du

-- 10. Quitter psql
\q

-- ÉTAPE 2 : Tester la connexion avec terra_user
-- Commande : psql -U terra_user -d terra_dominus
-- Si ça fonctionne, vous pouvez passer à l'étape 3

-- ÉTAPE 3 : Lancer les migrations
-- Dans PowerShell, exécutez :
-- cd C:\Users\gaeta\repo\backend
-- npx sequelize-cli db:migrate
