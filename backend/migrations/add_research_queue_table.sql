-- Migration: Création de la table research_queue
-- Date: 2025-12-08
-- Description: Ajoute la table pour gérer la file d'attente des recherches

CREATE TABLE IF NOT EXISTS research_queue (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  research_id INTEGER NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'cancelled', 'completed')),
  start_time TIMESTAMP,
  finish_time TIMESTAMP,
  slot INTEGER NOT NULL,
  CONSTRAINT unique_city_slot UNIQUE (city_id, slot)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_research_queue_city_status ON research_queue(city_id, status);
CREATE INDEX IF NOT EXISTS idx_research_queue_slot ON research_queue(city_id, slot);

-- Commentaires
COMMENT ON TABLE research_queue IS 'File d''attente des recherches en cours et planifiées pour chaque ville';
COMMENT ON COLUMN research_queue.city_id IS 'Référence à la ville';
COMMENT ON COLUMN research_queue.research_id IS 'Référence à la recherche';
COMMENT ON COLUMN research_queue.status IS 'Statut de la recherche dans la queue (queued, in_progress, cancelled, completed)';
COMMENT ON COLUMN research_queue.start_time IS 'Date de début de la recherche';
COMMENT ON COLUMN research_queue.finish_time IS 'Date de fin prévue de la recherche';
COMMENT ON COLUMN research_queue.slot IS 'Position dans la file d''attente (1 = en cours, 2+ = en attente)';
