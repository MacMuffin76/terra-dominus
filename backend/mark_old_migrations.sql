-- Marquer les anciennes migrations comme déjà exécutées
-- Exécutez ce script avec : psql -U terra_user -d terra_dominus -f mark_old_migrations.sql

INSERT INTO "SequelizeMeta" (name) VALUES 
  ('20251101-add-version-columns.js'),
  ('20251115-create-construction-queue.js'),
  ('20251220-create-blueprints.js')
ON CONFLICT (name) DO NOTHING;
