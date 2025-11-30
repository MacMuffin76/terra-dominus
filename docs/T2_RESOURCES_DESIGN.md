# Terra Dominus - T2 Resources Design

## Vue d'ensemble

Les ressources T2 (Tier 2) sont des ressources rares et avancées qui nécessitent :
- Des bâtiments de niveau élevé
- Des recherches spécifiques
- De la transformation de ressources T1
- Des conditions géographiques particulières

## Les 3 Ressources T2

### 1. Titanium (Titane)

**Description**: Métal ultra-résistant extrait de gisements rares en montagne.

**Propriétés**:
- Rareté: ⭐⭐⭐⭐ (Très rare)
- Source principale: Mines de Métal niveau 10+ dans biomes montagneux
- Taux de production: 0.5 titanium / 100 metal produits
- Stockage max de base: 1000 unités
- Icône: 🔩

**Utilisations**:
- Unités lourdes avancées (Heavy Tank Mk2, Mech)
- Défenses orbitales (Orbital Laser)
- Amélioration de bâtiments T3
- Crafting d'équipements légendaires

**Conditions de production**:
- Mine de Métal niveau 10+
- Recherche "Extraction Avancée" complétée
- Tuile de type "mountain" ou "highland"
- Bonus: +50% production si alliance contrôle territoire montagneux

---

### 2. Plasma (Énergie Plasma)

**Description**: Énergie condensée et stabilisée, produite par des réacteurs à fusion.

**Propriétés**:
- Rareté: ⭐⭐⭐⭐⭐ (Extrêmement rare)
- Source principale: Centrale Énergétique niveau 15+
- Taux de production: 0.1 plasma / 1000 énergie produits
- Stockage max de base: 500 unités
- Icône: ⚡

**Utilisations**:
- Armes à énergie dirigée
- Boucliers énergétiques
- Propulsion avancée (vaisseaux spatiaux)
- Recherches de niveau 3

**Conditions de production**:
- Centrale Énergétique niveau 15+
- Recherche "Réacteur à Fusion" complétée
- Production uniquement si énergie > 10000/h
- Risque: 5% de défaillance du réacteur (perte de production 1h)

---

### 3. Nanotubes (Nanotubes de Carbone)

**Description**: Matériaux nanotech ultra-légers et résistants, produits en laboratoire.

**Propriétés**:
- Rareté: ⭐⭐⭐⭐⭐ (Extrêmement rare)
- Source principale: Laboratoire de Recherche niveau 15+
- Taux de production: 1 nanotube / 8 heures de recherche active
- Stockage max de base: 300 unités
- Icône: 🧬

**Utilisations**:
- Armures nano-renforcées
- Drones de combat
- Infrastructure spatiale
- Blueprints légendaires

**Conditions de production**:
- Laboratoire niveau 15+
- Recherche "Nanotechnologie" complétée
- Production passive: 1 nanotube toutes les 8h
- Bonus: +1 nanotube supplémentaire si recherche en cours

---

## Système de Conversion

Les ressources T2 peuvent être converties depuis les ressources T1, mais avec un coût élevé:

### Recettes de Conversion

#### Titanium
```javascript
{
  input: { metal: 10000, carburant: 2000 },
  output: { titanium: 5 },
  duration: 3600, // 1 heure
  building_required: 'mine_metal_lv10',
  research_required: 'extraction_avancee'
}
```

#### Plasma
```javascript
{
  input: { energie: 50000, metal: 5000 },
  output: { plasma: 3 },
  duration: 7200, // 2 heures
  building_required: 'centrale_energie_lv15',
  research_required: 'reacteur_fusion'
}
```

#### Nanotubes
```javascript
{
  input: { metal: 8000, energie: 20000, carburant: 5000 },
  output: { nanotubes: 2 },
  duration: 10800, // 3 heures
  building_required: 'labo_recherche_lv15',
  research_required: 'nanotechnologie'
}
```

---

## Sources Alternatives

### Portails PvE (Donjons)

- **Portails Bleus**: 5-15 titanium (drop 30%)
- **Portails Violets**: 10-25 plasma (drop 20%)
- **Portails Rouges**: 15-40 nanotubes (drop 10%)
- **Portails Dorés**: 50-100 de chaque (drop 100%, boss obligatoire)

### Marché Joueurs

- Prix indicatif (fluctuant):
  - Titanium: 1000-1500 or/unité
  - Plasma: 3000-5000 or/unité
  - Nanotubes: 5000-8000 or/unité

### Quêtes & Événements

- Quête "Premier Titanium": Récompense 10 titanium
- Événement "Tempête Plasma": +100% production plasma pendant 2h (hebdomadaire)
- Achievement "Nanochercheur": 50 nanotubes pour 100 recherches complétées

---

## Stockage

### Entrepôt T2

Nouveau bâtiment requis pour stocker les ressources T2:

```javascript
{
  name: 'Entrepôt Avancé',
  levels: 10,
  base_cost: { or: 50000, metal: 30000, carburant: 10000 },
  base_storage: 500, // Par ressource T2
  storage_per_level: 200,
  max_storage_lv10: 2300 // Par ressource T2
}
```

Sans entrepôt T2, les ressources T2 ne peuvent pas être stockées (production perdue).

---

## Affichage UI

### Widget Ressources (Dashboard)

```
┌─────────────────────────────────────┐
│ Ressources T1                       │
│ 🪙 Or: 125,430                      │
│ ⚙️ Métal: 84,250                    │
│ ⛽ Carburant: 43,120                │
│ ⚡ Énergie: 156,000/h               │
├─────────────────────────────────────┤
│ Ressources T2 (Rares)               │
│ 🔩 Titanium: 45 / 1000              │
│ ⚡ Plasma: 12 / 500                 │
│ 🧬 Nanotubes: 8 / 300               │
│                                     │
│ [Voir Production] [Convertir]      │
└─────────────────────────────────────┘
```

### Page Production T2

Liste des conversions actives + files d'attente:

```
┌─────────────────────────────────────┐
│ Conversion en cours                 │
│ 🔩 Titanium x5 → 35:24 restant     │
│ [Annuler] [Accélérer 50 CT]        │
├─────────────────────────────────────┤
│ File d'attente (0/3)                │
│ [Ajouter conversion]                │
└─────────────────────────────────────┘
```

---

## Progression & Équilibrage

### Timeline Joueur Typique

- **Jour 1-7**: Découverte des ressources T2 (aperçu dans recherches)
- **Jour 8-14**: Premier bâtiment niveau 10+ (débloquer production titanium)
- **Jour 15-21**: Première conversion T2 réussie
- **Jour 22-30**: Production régulière, débloquer crafting basique
- **Jour 30+**: Optimisation, trading T2 sur marché

### Taux de Production Équilibré

Pour un joueur actif (connexion 3x/jour):

```
Titanium: 2-5 / jour (conversion ou production passive)
Plasma: 1-3 / jour (très rare, réacteurs)
Nanotubes: 1-2 / jour (laboratoire passif)
```

Total mensuel: ~90 titanium, ~45 plasma, ~30 nanotubes
→ Suffisant pour 2-3 items légendaires craftés

---

## Implémentation Technique

### Base de Données

Nouvelle table `user_resources_t2`:

```sql
CREATE TABLE user_resources_t2 (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  titanium BIGINT DEFAULT 0,
  plasma BIGINT DEFAULT 0,
  nanotubes BIGINT DEFAULT 0,
  titanium_storage_max INTEGER DEFAULT 0,
  plasma_storage_max INTEGER DEFAULT 0,
  nanotubes_storage_max INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Nouvelle table `resource_conversions`:

```sql
CREATE TABLE resource_conversions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  resource_type VARCHAR(50), -- 'titanium', 'plasma', 'nanotubes'
  quantity_target INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
  input_cost JSONB -- { metal: 10000, carburant: 2000 }
);
```

### API Endpoints

```
GET    /api/v1/resources/t2                   # Get user's T2 resources
POST   /api/v1/resources/t2/convert           # Start conversion
GET    /api/v1/resources/t2/conversions       # List active conversions
DELETE /api/v1/resources/t2/conversions/:id   # Cancel conversion
POST   /api/v1/resources/t2/conversions/:id/complete # Complete manually (with speedup)
```

### Cron Jobs

```javascript
// backend/jobs/t2ResourceProduction.js
// Exécuté toutes les heures
async function processT2Production() {
  // 1. Titanium depuis mines niveau 10+
  // 2. Plasma depuis centrales niveau 15+
  // 3. Nanotubes depuis labos niveau 15+
  // 4. Conversions complètes
}
```

---

## Roadmap Implémentation

### Phase 1: Foundation (Semaine 1)
- [x] Design document (ce fichier)
- [ ] Migration base de données
- [ ] Models Sequelize
- [ ] Repository & Service basiques

### Phase 2: Production Logic (Semaine 1-2)
- [ ] Production passive depuis bâtiments
- [ ] Système de conversion
- [ ] File d'attente conversions
- [ ] Cron job production

### Phase 3: API & UI (Semaine 2)
- [ ] Controller & routes
- [ ] Widget ressources T2 frontend
- [ ] Page conversions
- [ ] Notifications production

### Phase 4: Integration & Testing (Semaine 2-3)
- [ ] Intégration portails PvE (drop T2)
- [ ] Intégration marché (trading T2)
- [ ] Tests unitaires + intégration
- [ ] Documentation API

---

## Métriques de Succès

- **Adoption**: 60%+ des joueurs niveau 10+ produisent T2
- **Engagement**: +15min session time (optimisation production)
- **Économie**: Prix marché stables (1000-2000 or pour titanium)
- **Rétention**: +10% J30 (nouveau palier progression)

---

**Auteur**: GitHub Copilot  
**Date**: 30 novembre 2025  
**Version**: 1.0  
**Status**: Design approuvé, prêt pour implémentation
