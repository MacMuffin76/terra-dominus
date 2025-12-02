-- Correction des noms avec encodage UTF-8
UPDATE entities SET entity_name = E'Mine de m\u00E9tal' WHERE entity_id = 2;
UPDATE entities SET entity_name = E'Centrale \u00E9lectrique' WHERE entity_id = 4;
UPDATE entities SET entity_name = E'R\u00E9servoir' WHERE entity_id = 6;

-- Mise à jour des bâtiments
UPDATE buildings SET name = E'Mine de m\u00E9tal' WHERE name LIKE 'Mine de m%tal';
UPDATE buildings SET name = E'Centrale \u00E9lectrique' WHERE name LIKE 'Centrale%lectrique';
UPDATE buildings SET name = E'R\u00E9servoir' WHERE name LIKE 'R%servoir';

-- Vérification
SELECT entity_id, entity_name FROM entities WHERE entity_type = 'building' ORDER BY entity_id;
