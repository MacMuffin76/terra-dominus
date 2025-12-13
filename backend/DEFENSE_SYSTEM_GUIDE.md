# 🛡️ Système de Combat et Défenses - Terra Dominus

## Vue d'ensemble

Lorsqu'un joueur attaque une ville ennemie, le système calcule automatiquement la puissance d'attaque contre la puissance de défense pour déterminer le vainqueur et les pertes.

---

## 📊 Comment fonctionne la défense

### 1. 👥 Unités Défensives

**Toutes les unités restées dans une ville défendent automatiquement lors d'une attaque.**

```javascript
// Chaque unité a une stat "force" utilisée en défense
Force Défensive = Σ (quantité_unitéforce_unitaire)
```

**Exemple :**
- 100 Milices (force: 2) = 200 points de défense
- 50 Fusiliers (force: 5) = 250 points de défense
- **TOTAL = 450 points de défense**

> ⚠️ **Important** : Les unités envoyées en attaque NE défendent PAS la ville ! Gardez toujours des troupes en réserve.

---

### 2. 🏰 Murailles (Buildings)

Les murailles offrent un **bonus multiplicateur** à toute la force défensive.

**Formule :**
```javascript
Bonus Murailles = niveau × 8%
Force Défensive Finale = Force Base × (1 + Bonus Murailles)
```

**Exemples :**
- Murailles Niv 5 → +40% défense (x1.40)
- Murailles Niv 10 → +80% défense (x1.80)
- Murailles Niv 25 → +200% défense (x3.00) **[MAX]**

**Impact réel :**
```
450 points sans murailles
↓
630 points avec Murailles Niv 5
↓
810 points avec Murailles Niv 10
↓
1350 points avec Murailles Niv 25
```

> 💡 **Stratégie** : Les murailles sont LA défense la plus efficace ! Elles multiplient toutes vos troupes.

---

### 3. 🔬 Recherches Technologiques

Certaines recherches donnent des bonus défensifs permanents pour TOUS vos combats.

**Recherches défensives :**
- **"Tactiques Défensives"** : +10% par niveau
- **"Fortifications"** : +10% par niveau

**Les bonus se cumulent !**
```javascript
Bonus Tech Total = Σ (niveau_recherche × 10%)
Force Finale = Force Base × (1 + Bonus Murailles) × (1 + Bonus Tech)
```

**Exemple complet :**
```
450 points de base
× (1 + 0.40)  [Murailles Niv 5]
× (1 + 0.30)  [Tactiques Niv 2 + Fortifications Niv 1]
= 450 × 1.40 × 1.30
= 819 points de défense finale
```

---

## ⚔️ Calcul du Combat

### Phase 1 : Calcul des Forces

**Attaquant :**
```javascript
Force Attaque = Σ(unités_envoyées × force_unitaire) × (1 + bonus_tech_attaquant)
```

**Défenseur :**
```javascript
Force Défense = Σ(unités_ville × force_unitaire) 
              × (1 + bonus_murailles) 
              × (1 + bonus_tech_défenseur)
```

### Phase 2 : Simulation du Combat

Le combat se déroule en **rounds** (max 10) :

```javascript
while (force_attaque > 0 && force_défense > 0 && rounds < 10) {
  // Chaque camp inflige des dégâts à l'autre
  dégâts_attaquant = force_attaque × 0.30
  dégâts_défenseur = force_défense × 0.30
  
  force_défense -= dégâts_attaquant
  force_attaque -= dégâts_défenseur
  
  rounds++
}
```

**Vainqueur :**
- Si `force_attaque > force_défense` → **Victoire Attaquant**
- Si `force_défense > force_attaque` → **Victoire Défenseur**
- Sinon → **Match Nul**

### Phase 3 : Calcul des Pertes

Les pertes sont **proportionnelles** à la force perdue :

```javascript
taux_pertes = force_perdue / force_initiale

Pour chaque type d'unité:
  pertes = Math.floor(quantité × taux_pertes)
  survivants = quantité - pertes
```

**Exemple :**
```
Attaquant: 1000 force → 400 force restante
Taux de pertes = (1000 - 400) / 1000 = 60%

100 Milices envoyées → 60 perdues, 40 survivent
```

---

## 💰 Butin (si victoire attaquant)

Le type d'attaque détermine le % de ressources pillées :

| Type     | % Butin | Usage                        |
|----------|---------|------------------------------|
| **Raid** | 20%     | Pillage rapide de ressources |
| **Conquest** | 40% | Conquête (future feature)    |
| **Siege** | 10%    | Affaiblir l'ennemi           |

```javascript
butin_or = ressources_défenseur_or × pourcentage
butin_metal = ressources_défenseur_metal × pourcentage
butin_fuel = ressources_défenseur_fuel × pourcentage
```

> 📦 Le butin est automatiquement ajouté aux ressources de l'attaquant quand les troupes reviennent.

---

## 🔄 Retour des Troupes

Après le combat, les **unités survivantes** de l'attaquant :

1. ✅ Sont automatiquement restituées à la ville d'origine
2. ✅ Ramènent le butin avec elles
3. ✅ Temps de retour = même durée que l'aller

**Code (dans CombatService.js) :**
```javascript
// Restituer les unités survivantes
for (const wave of attack.waves) {
  const survivors = wave.survivors || 0;
  if (survivors > 0) {
    await Unit.increment('quantity', {
      by: survivors,
      where: { id: wave.unit_entity_id }
    });
  }
}

// Ajouter le butin
attackerResources.gold += loot.gold;
attackerResources.metal += loot.metal;
attackerResources.fuel += loot.fuel;
```

---

## 🎮 Système de Counters (Avancé)

Certaines unités sont **spécialisées** contre d'autres :

### Milice (militia)
- ❌ **Faible contre** : Tout (unité de base)
- Multiplicateur: 0.7 (-30%)

### Fusiliers (riflemen)
- ✅ **Fort contre** : Milice, Scouts
- ❌ **Faible contre** : Chars, Anti-Armor
- Multiplicateur: 1.5 (+50% bonus) ou 0.7 (malus)

### Marksmen (tireurs d'élite)
- ✅ **Fort contre** : Infanterie légère
- ❌ **Faible contre** : Véhicules blindés

### Light Tank
- ✅ **Fort contre** : Infanterie
- ❌ **Faible contre** : Anti-Armor

### Anti-Armor
- ✅ **Fort contre** : Tanks
- ❌ **Faible contre** : Infanterie en masse

```javascript
// Le système applique des multiplicateurs
if (unit_counters_target) {
  force × 1.5  // +50% bonus
} else if (unit_weak_to_target) {
  force × 0.7  // -30% malus
}
```

---

## 📋 Exemple Complet

### Scénario

**Attaquant (Ville A) :**
- 100 Milices (force: 2) = 200
- Recherche "Tactiques Militaires" Niv 1 = +10%
- **Force totale : 220**

**Défenseur (Ville B) :**
- 50 Fusiliers (force: 5) = 250
- Murailles Niv 5 = +40%
- Recherche "Tactiques Défensives" Niv 2 = +20%
- **Force totale : 250 × 1.40 × 1.20 = 420**

### Combat

```
Round 1:
  Attaquant: 220 - (420 × 0.30) = 220 - 126 = 94
  Défenseur: 420 - (220 × 0.30) = 420 - 66 = 354

Round 2:
  Attaquant: 94 - (354 × 0.30) = 94 - 106 = -12 (éliminé)
  Défenseur: 354 - (94 × 0.30) = 354 - 28 = 326

→ VICTOIRE DEFENSEUR
```

### Pertes

**Attaquant :**
- Taux de pertes : 100% (éliminé)
- 100 Milices perdues
- 0 survivant

**Défenseur :**
- Taux de pertes : (420 - 326) / 420 = 22%
- 50 Fusiliers × 0.22 = 11 perdus
- 39 survivants

---

## 💡 Conseils Stratégiques

### Pour le Défenseur

1. 🏰 **Priorisez les Murailles** - Effet multiplicateur massif
2. 👥 **Gardez toujours des troupes** - Une ville vide est une cible facile
3. 🔬 **Recherchez les techs défensives** - Bonus permanent
4. 🎯 **Diversifiez vos unités** - Système de counters
5. 📊 **Surveillez les attaques entrantes** - Préparez-vous à temps

### Pour l'Attaquant

1. 🔍 **Espionnez avant d'attaquer** - Connaissez la défense
2. ⚖️ **Envoyez assez d'unités** - Ratio 2:1 minimum recommandé
3. 🎯 **Exploitez les counters** - Choisissez les bonnes unités
4. ⏱️ **Timing** - Attaquez quand le défenseur est offline
5. 🔬 **Investissez dans les techs** - Chaque % compte

### Règle d'Or

```
Force Nécessaire pour Victoire ≈ Force Défensive × 1.5 à 2.0
```

Une attaque réussie nécessite généralement **50% à 100% plus de force** que la défense pour compenser les pertes et garantir la victoire.

---

## 🐛 Débogage

Pour vérifier l'état de défense d'une ville :

```bash
# Vérifier les unités
node backend/check_attacks.js

# Tester un scénario
node backend/test_defense_scenario.js

# Voir les rapports de combat
SELECT * FROM attacks WHERE status = 'completed' ORDER BY created_at DESC LIMIT 5;
SELECT * FROM defense_reports WHERE attack_id = <attack_id>;
```

---

## 📚 Fichiers Sources

- `backend/modules/combat/application/CombatService.js` - Logique principale
- `backend/modules/combat/domain/combatRules.js` - Règles et calculs
- `backend/modules/combat/domain/unitDefinitions.js` - Définitions des unités
- `backend/jobs/workers/attackWorker.js` - Worker de traitement
- `backend/models/Attack.js` - Modèle de données

---

**Dernière mise à jour : 13 décembre 2025**
