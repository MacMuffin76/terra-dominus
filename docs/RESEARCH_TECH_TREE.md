# 🔬 Arbre Technologique Terra Dominus

## Vue d'ensemble

Système de recherche complet avec 17 technologies réparties en 6 catégories, permettant de débloquer progressivement les unités militaires et améliorer l'économie.

---

## 🎖️ Branche Militaire - Infanterie

```
TIER 1: Formation Militaire (military_training_1)
├─ Coût: 300g, 200m, 0f
├─ Temps: 5min
├─ Prérequis: Labo Niv 1, Centre Niv 1
└─ Effets: Débloque Fusiliers, +5% attaque infanterie
    │
    ├─► TIER 2: Tactiques de Guérilla I (guerrilla_tactics_1)
    │   ├─ Coût: 500g, 300m, 200f
    │   ├─ Temps: 7min
    │   ├─ Prérequis: Labo Niv 2, Centre Niv 3
    │   └─ Effets: Débloque Éclaireurs, +15% vitesse infanterie
    │
    └─► TIER 2: Formation Militaire Avancée (military_training_2)
        ├─ Coût: 800g, 500m, 200f
        ├─ Temps: 10min
        ├─ Prérequis: Labo Niv 3, Centre Niv 5
        └─ Effets: Débloque Tireurs d'Élite, +10% attaque infanterie
```

---

## 🚗 Branche Militaire - Véhicules

```
TIER 2: Motorisation I (motorization_1)
├─ Coût: 600g, 400m, 300f
├─ Temps: 8min
├─ Prérequis: Labo Niv 2, Forge Niv 1
└─ Effets: Débloque Transport Blindé, +5% vitesse véhicules
    │
    ├─► TIER 3: Motorisation II (motorization_2)
    │   ├─ Coût: 1200g, 800m, 600f
    │   ├─ Temps: 15min
    │   ├─ Prérequis: Labo Niv 4, Centre Niv 4, Forge Niv 3
    │   └─ Effets: Débloque Chars Légers, +10% attaque véhicules
    │       │
    │       ├─► TIER 3: Armes Antichar (anti_tank_weapons)
    │       │   ├─ Coût: 1500g, 1200m, 800f
    │       │   ├─ Temps: 20min
    │       │   ├─ Prérequis: Labo Niv 5, Centre Niv 5, Forge Niv 2
    │       │   └─ Effets: Débloque Anti-Blindage, +30% bonus antichar
    │       │
    │       └─► TIER 4: Blindage Lourd (heavy_armor)
    │           ├─ Coût: 3000g, 2500m, 2000f
    │           ├─ Temps: 40min
    │           ├─ Prérequis: Labo Niv 8, Centre Niv 8, Forge Niv 6
    │           └─ Effets: Débloque Tanks Lourds, +20% défense véhicules
```

---

## ⚔️ Branche Militaire - Avancée

```
TIER 4: Forces Spéciales (special_forces)
├─ Coût: 6000g, 4000m, 2000f
├─ Temps: 50min
├─ Prérequis: Labo Niv 10, Centre Niv 10
├─ Nécessite: military_training_2, guerrilla_tactics_1
└─ Effets: +25% initiative unités Tier 3+

TIER 4: Armes à Énergie (energy_weapons)
├─ Coût: 4000g, 3000m, 0f + 2000 énergie
├─ Temps: 35min
├─ Prérequis: Labo Niv 8, Centrale Niv 5
├─ Nécessite: energy_efficiency
└─ Effets: Débloque Tourelles Plasma, +10% dégâts énergie
```

---

## 💰 Branche Économie

```
TIER 1: Efficacité Énergétique (energy_efficiency)
├─ Coût: 400g, 200m, 150f + 100 énergie
├─ Temps: 8min
├─ Prérequis: Labo Niv 1, Centrale Niv 2
└─ Effets: -15% consommation énergie

TIER 1: Logistique (logistics)
├─ Coût: 600g, 400m, 200f
├─ Temps: 12min
├─ Prérequis: Labo Niv 2
└─ Effets: +20% capacité stockage
    │
    └─► TIER 2: Logistique Rapide (rapid_logistics)
        ├─ Coût: 1000g, 600m, 400f
        ├─ Temps: 12min
        ├─ Prérequis: Labo Niv 3
        └─ Effets: -15% temps déplacement armées

TIER 2: Extraction Avancée (advanced_extraction)
├─ Coût: 1200g, 800m, 300f
├─ Temps: 20min
├─ Prérequis: Labo Niv 3
└─ Effets: +20% production toutes ressources
```

---

## 🛡️ Branche Défense

```
TIER 2: Systèmes de Ciblage (targeting_systems)
├─ Coût: 800g, 600m, 300f
├─ Temps: 10min
├─ Prérequis: Labo Niv 3, Atelier Défense Niv 3
└─ Effets: +15% précision tourelles

TIER 3: Fortifications (fortifications)
├─ Coût: 1500g, 1200m, 500f
├─ Temps: 20min
├─ Prérequis: Labo Niv 5, Atelier Défense Niv 5
└─ Effets: +30% PV fortifications

TIER 4: Boucliers Énergétiques (energy_shields)
├─ Coût: 8000g, 5000m, 0f + 3000 énergie
├─ Temps: 60min
├─ Prérequis: Labo Niv 10, Atelier Défense Niv 10, Centrale Niv 5
├─ Nécessite: energy_weapons
└─ Effets: Débloque Bouclier Énergétique
```

---

## 🗺️ Branche Exploration

```
TIER 1: Cartographie (cartography)
├─ Coût: 300g, 100m, 100f
├─ Temps: 4min
├─ Prérequis: Labo Niv 1
└─ Effets: +2 vision carte
```

---

## 🎯 Stratégies de Progression Recommandées

### 🔰 Early Game (0-20min)
**Objectif**: Débloquer infanterie de base et logistique
```
1. Formation Militaire → Fusiliers
2. Logistique → Stockage amélioré
3. Motorisation I → Transport Blindé
```

### ⚡ Mid Game (20-40min)
**Objectif**: Spécialisation et premiers blindés
```
1. Tactiques de Guérilla I → Éclaireurs (reconnaissance)
2. Formation Militaire Avancée → Tireurs d'Élite
3. Motorisation II → Chars Légers
4. Extraction Avancée → Économie renforcée
```

### 🚀 Late Game (40min+)
**Objectif**: Domination militaire
```
1. Armes Antichar → Anti-Blindage (counter tanks)
2. Blindage Lourd → Tanks Lourds (domination)
3. Forces Spéciales → Bonus initiative
4. Fortifications → Défense renforcée
```

---

## 📊 Tableau Récapitulatif des Coûts

| Recherche | Tier | Or | Métal | Carburant | Temps |
|-----------|------|----:|------:|----------:|------:|
| Formation Militaire | 1 | 300 | 200 | 0 | 5min |
| Tactiques de Guérilla I | 2 | 500 | 300 | 200 | 7min |
| Formation Militaire Avancée | 2 | 800 | 500 | 200 | 10min |
| Motorisation I | 2 | 600 | 400 | 300 | 8min |
| Motorisation II | 3 | 1200 | 800 | 600 | 15min |
| Armes Antichar | 3 | 1500 | 1200 | 800 | 20min |
| Blindage Lourd | 4 | 3000 | 2500 | 2000 | 40min |
| Forces Spéciales | 4 | 6000 | 4000 | 2000 | 50min |

**Total pour arbre militaire complet**: ~13 900g, ~9 900m, ~6 100f, ~155min

---

## ✅ Unités Débloquées par Recherche

| Recherche | Débloque |
|-----------|----------|
| Formation Militaire | 🔫 Fusiliers |
| Tactiques de Guérilla I | 🏃 Éclaireurs |
| Formation Militaire Avancée | 🎯 Tireurs d'Élite |
| Motorisation I | 🚚 Transport Blindé |
| Motorisation II | 🛡️ Chars Légers |
| Armes Antichar | 💥 Anti-Blindage |
| Blindage Lourd | 🚀 Tanks Lourds |

---

## 🔄 Dépendances Critiques

**Pour débloquer toutes les unités Tier 4**, vous devez obligatoirement rechercher :
1. Formation Militaire (Tier 1)
2. Motorisation I (Tier 2)
3. Motorisation II (Tier 3)
4. Armes Antichar ou Blindage Lourd (Tier 3-4)

**Ordre optimal pour progression rapide** :
`Formation Militaire → Motorisation I → Formation Militaire Avancée → Motorisation II → Armes Antichar + Blindage Lourd`
