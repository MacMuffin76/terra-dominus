# 🌀 Système de Portails PvE — Terra Dominus

## 🎯 Vision : "Solo Leveling" meets OGame

**Principe :** Simplicité OGame + événements PvE dynamiques via portails mystérieux

### Pourquoi ça marche ?

1. **Simplicité OGame préservée** : Pas de zones complexes, pas de PNJ errants
2. **PvE opt-in** : Joueur choisit quand faire du PvE (comme lancer un raid)
3. **Événement visuel fort** : Portail qui apparaît = excitation
4. **Risk/Reward clair** : Couleur = difficulté = récompenses
5. **Pas de changement core gameplay** : Utilise système combat existant

---

## 🌀 Système de Portails

### A) Spawn & Apparition

```javascript
// backend/modules/portals/domain/portalRules.js

const PORTAL_TIERS = {
  GREY: {
    name: 'Portail Gris',
    color: '#808080',
    rarity: 0.50, // 50% des spawns
    difficulty: 'facile',
    power_range: [500, 2000],
    duration: 14400, // 4h
    max_concurrent: 5, // Max 5 portails gris simultanés sur la map
    spawn_zones: 'everywhere' // Partout
  },
  
  GREEN: {
    name: 'Portail Vert',
    color: '#00FF00',
    rarity: 0.30, // 30%
    difficulty: 'moyen',
    power_range: [2000, 8000],
    duration: 10800, // 3h
    max_concurrent: 3,
    spawn_zones: 'everywhere'
  },
  
  BLUE: {
    name: 'Portail Bleu',
    color: '#00BFFF',
    rarity: 0.12, // 12%
    difficulty: 'difficile',
    power_range: [8000, 20000],
    duration: 7200, // 2h
    max_concurrent: 2,
    spawn_zones: 'contested_warzone' // Pas en safe zone
  },
  
  PURPLE: {
    name: 'Portail Violet',
    color: '#9370DB',
    rarity: 0.06, // 6%
    difficulty: 'très difficile',
    power_range: [20000, 50000],
    duration: 5400, // 1h30
    max_concurrent: 1,
    spawn_zones: 'warzone_only',
    announcement: 'global' // Annoncé à tous les joueurs
  },
  
  RED: {
    name: 'Portail Rouge',
    color: '#FF0000',
    rarity: 0.015, // 1.5%
    difficulty: 'cauchemar',
    power_range: [50000, 150000],
    duration: 3600, // 1h seulement
    max_concurrent: 1,
    spawn_zones: 'warzone_center', // Centre de la warzone uniquement
    announcement: 'global',
    special: 'boss_inside' // Contient un boss unique
  },
  
  GOLD: {
    name: 'Portail Doré',
    color: '#FFD700',
    rarity: 0.005, // 0.5% (ultra rare)
    difficulty: 'légendaire',
    power_range: [100000, 300000],
    duration: 1800, // 30min seulement !
    max_concurrent: 1,
    spawn_zones: 'random', // Peut spawn n'importe où (même safe zone)
    announcement: 'global',
    special: 'legendary_loot', // Loot unique garanti
    event: true // Event serveur
  }
};

// Spawn aléatoire (worker tournant chaque 30min)
async function spawnRandomPortal() {
  const roll = Math.random();
  let cumulativeProb = 0;
  let selectedTier = null;
  
  for (const [tier, config] of Object.entries(PORTAL_TIERS)) {
    cumulativeProb += config.rarity;
    if (roll <= cumulativeProb) {
      selectedTier = tier;
      break;
    }
  }
  
  const tierConfig = PORTAL_TIERS[selectedTier];
  
  // Vérifier max concurrent
  const activePortals = await Portal.count({
    where: {
      tier: selectedTier,
      status: 'active',
      expires_at: { [Op.gt]: new Date() }
    }
  });
  
  if (activePortals >= tierConfig.max_concurrent) {
    return null; // Trop de portails de ce type actifs
  }
  
  // Générer position selon zone autorisée
  const coords = generatePortalCoords(tierConfig.spawn_zones);
  
  // Générer contenu aléatoire
  const enemies = generatePortalEnemies(selectedTier, tierConfig.power_range);
  const loot = generatePortalLoot(selectedTier);
  
  const portal = await Portal.create({
    tier: selectedTier,
    coord_x: coords.x,
    coord_y: coords.y,
    power: enemies.totalPower,
    enemies: JSON.stringify(enemies.units),
    loot_table: JSON.stringify(loot),
    status: 'active',
    spawned_at: new Date(),
    expires_at: new Date(Date.now() + tierConfig.duration * 1000),
    times_challenged: 0,
    times_cleared: 0
  });
  
  // Annonce globale si rare
  if (tierConfig.announcement === 'global') {
    io.emit('portal_spawned', {
      portalId: portal.id,
      tier: selectedTier,
      location: coords,
      duration: tierConfig.duration,
      message: `⚡ Un ${tierConfig.name} vient d'apparaître en (${coords.x}, ${coords.y}) !`
    });
  }
  
  return portal;
}
```

### B) Génération du Contenu

```javascript
// Ennemis selon tier
function generatePortalEnemies(tier, powerRange) {
  const [minPower, maxPower] = powerRange;
  const targetPower = Math.floor(Math.random() * (maxPower - minPower) + minPower);
  
  const ENEMY_TEMPLATES = {
    GREY: [
      { type: 'Portal_Slime', attack: 3, defense: 2, cost: 50 },
      { type: 'Portal_Goblin', attack: 5, defense: 4, cost: 80 }
    ],
    GREEN: [
      { type: 'Portal_Orc', attack: 10, defense: 8, cost: 150 },
      { type: 'Portal_Wolf', attack: 12, defense: 6, cost: 180 }
    ],
    BLUE: [
      { type: 'Portal_Troll', attack: 20, defense: 18, cost: 400 },
      { type: 'Portal_Mage', attack: 25, defense: 15, cost: 500 }
    ],
    PURPLE: [
      { type: 'Portal_Demon', attack: 40, defense: 35, cost: 1000 },
      { type: 'Portal_Dragon', attack: 50, defense: 40, cost: 1500 }
    ],
    RED: [
      { type: 'Portal_Ancient', attack: 80, defense: 70, cost: 3000 },
      { type: 'Demon_Lord', attack: 120, defense: 100, cost: 5000 }
    ],
    GOLD: [
      { type: 'Void_Entity', attack: 150, defense: 120, cost: 8000 },
      { type: 'Reality_Bender', attack: 200, defense: 150, cost: 12000 }
    ]
  };
  
  const availableEnemies = ENEMY_TEMPLATES[tier];
  const units = [];
  let currentPower = 0;
  
  while (currentPower < targetPower) {
    const enemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    const quantity = Math.floor((targetPower - currentPower) / enemy.cost / 2) || 1;
    
    units.push({
      type: enemy.type,
      quantity,
      attack: enemy.attack,
      defense: enemy.defense
    });
    
    currentPower += quantity * enemy.cost;
  }
  
  return { units, totalPower: currentPower };
}

// Loot selon tier
function generatePortalLoot(tier) {
  const LOOT_TABLES = {
    GREY: {
      guaranteed: {
        or: [500, 2000],
        metal: [300, 1000],
        xp: [10, 30]
      },
      random: [
        { item: 'speedup_1h', chance: 0.2 },
        { item: 'resource_boost_12h', chance: 0.15 }
      ]
    },
    
    GREEN: {
      guaranteed: {
        or: [2000, 5000],
        metal: [1500, 3000],
        carburant: [500, 1500],
        xp: [50, 100]
      },
      random: [
        { item: 'speedup_3h', chance: 0.3 },
        { item: 'blueprint_common', chance: 0.25 },
        { item: 'premium_currency', amount: [5, 15], chance: 0.1 }
      ]
    },
    
    BLUE: {
      guaranteed: {
        or: [5000, 15000],
        metal: [4000, 10000],
        carburant: [2000, 5000],
        titanium: [50, 150],
        xp: [150, 300]
      },
      random: [
        { item: 'speedup_12h', chance: 0.4 },
        { item: 'blueprint_rare', chance: 0.3 },
        { item: 'premium_currency', amount: [20, 50], chance: 0.2 },
        { item: 'unit_boost_token', chance: 0.15 }
      ]
    },
    
    PURPLE: {
      guaranteed: {
        or: [15000, 40000],
        metal: [10000, 25000],
        carburant: [5000, 12000],
        titanium: [200, 500],
        plasma: [50, 150],
        xp: [400, 800]
      },
      random: [
        { item: 'speedup_24h', chance: 0.5 },
        { item: 'blueprint_rare', chance: 0.5 },
        { item: 'blueprint_epic', chance: 0.2 },
        { item: 'premium_currency', amount: [50, 150], chance: 0.3 },
        { item: 'unique_unit_summon', chance: 0.1 }
      ]
    },
    
    RED: {
      guaranteed: {
        or: [50000, 100000],
        metal: [30000, 60000],
        carburant: [15000, 30000],
        titanium: [500, 1000],
        plasma: [200, 500],
        nanotubes: [50, 150],
        xp: [1000, 2000]
      },
      random: [
        { item: 'blueprint_epic', chance: 0.7 },
        { item: 'blueprint_legendary', chance: 0.3 },
        { item: 'premium_currency', amount: [200, 500], chance: 0.5 },
        { item: 'cosmetic_rare', chance: 0.4 },
        { item: 'title_demon_slayer', chance: 0.2 }
      ],
      boss_loot: {
        guaranteed: { item: 'red_portal_essence', quantity: 1 }, // Monnaie spéciale
        chance_legendary: 0.5
      }
    },
    
    GOLD: {
      guaranteed: {
        or: [100000, 250000],
        metal: [80000, 150000],
        carburant: [40000, 80000],
        titanium: [1000, 2500],
        plasma: [500, 1500],
        nanotubes: [200, 500],
        xp: [3000, 5000],
        premium_currency: [500, 1000]
      },
      random: [
        { item: 'blueprint_legendary', chance: 1.0 }, // Garanti
        { item: 'unique_cosmetic_gold_portal', chance: 1.0 },
        { item: 'title_reality_breaker', chance: 1.0 }
      ],
      legendary_guaranteed: [
        'portal_master_skin',
        'golden_banner',
        'exclusive_unit_voidwalker'
      ]
    }
  };
  
  const lootConfig = LOOT_TABLES[tier];
  const finalLoot = { guaranteed: {}, random: [] };
  
  // Ressources garanties (ranges aléatoires)
  for (const [resource, range] of Object.entries(lootConfig.guaranteed)) {
    if (Array.isArray(range)) {
      finalLoot.guaranteed[resource] = Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
    } else {
      finalLoot.guaranteed[resource] = range;
    }
  }
  
  // Loot random (rolls)
  lootConfig.random.forEach(item => {
    if (Math.random() <= item.chance) {
      finalLoot.random.push({
        item: item.item,
        amount: item.amount ? Math.floor(Math.random() * (item.amount[1] - item.amount[0]) + item.amount[0]) : 1
      });
    }
  });
  
  return finalLoot;
}
```

### C) Mécanique de Challenge

```javascript
// backend/modules/portals/api/portalController.js

const challengePortal = async (req, res) => {
  const { portalId } = req.params;
  const { cityId, units } = req.body; // { Infantry: 50, Tank: 10 }
  const userId = req.user.id;
  
  try {
    const portal = await Portal.findByPk(portalId);
    
    if (!portal || portal.status !== 'active') {
      return res.status(404).json({ message: 'Portail introuvable ou expiré.' });
    }
    
    if (new Date() > portal.expires_at) {
      portal.status = 'expired';
      await portal.save();
      return res.status(400).json({ message: 'Portail a expiré.' });
    }
    
    const city = await City.findOne({ where: { id: cityId, user_id: userId } });
    if (!city) {
      return res.status(403).json({ message: 'Ville introuvable.' });
    }
    
    // Vérifier distance (portail doit être accessible)
    const distance = calculateDistance(city.coord_x, city.coord_y, portal.coord_x, portal.coord_y);
    const maxDistance = 50; // Rayon 50 tiles
    
    if (distance > maxDistance) {
      return res.status(400).json({ message: `Portail trop éloigné (${distance} tiles). Max: ${maxDistance}.` });
    }
    
    // Vérifier que joueur a les unités
    const playerUnits = await Unit.findAll({ where: { city_id: cityId } });
    
    for (const [unitType, quantity] of Object.entries(units)) {
      const playerUnit = playerUnits.find(u => u.name === unitType);
      if (!playerUnit || playerUnit.quantity < quantity) {
        return res.status(400).json({ message: `Unités insuffisantes: ${unitType}` });
      }
    }
    
    // Calculer temps de voyage
    const travelTime = calculateTravelTime(distance);
    const departureTime = new Date();
    const arrivalTime = new Date(Date.now() + travelTime * 1000);
    
    // Créer l'expédition (comme une attaque)
    const expedition = await PortalExpedition.create({
      portal_id: portalId,
      user_id: userId,
      city_id: cityId,
      units: JSON.stringify(units),
      status: 'traveling',
      departure_time: departureTime,
      arrival_time: arrivalTime,
      distance
    });
    
    // Déduire les unités
    for (const [unitType, quantity] of Object.entries(units)) {
      await Unit.decrement('quantity', {
        by: quantity,
        where: { city_id: cityId, name: unitType }
      });
    }
    
    // Programmer résolution (BullMQ job)
    await portalQueue.add(
      'resolve-expedition',
      { expeditionId: expedition.id },
      { delay: travelTime * 1000 }
    );
    
    portal.times_challenged += 1;
    await portal.save();
    
    res.json({
      expeditionId: expedition.id,
      arrivalTime,
      travelTime,
      message: `Expédition lancée vers le ${PORTAL_TIERS[portal.tier].name}`
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error challenging portal');
    res.status(500).json({ message: 'Erreur lors du challenge.' });
  }
};
```

### D) Résolution du Combat

```javascript
// backend/jobs/workers/portalWorker.js

async function resolvePortalExpedition(expeditionId) {
  const expedition = await PortalExpedition.findByPk(expeditionId, {
    include: [{ model: Portal }, { model: User }]
  });
  
  if (!expedition || expedition.status !== 'traveling') {
    return;
  }
  
  const portal = expedition.portal;
  const playerUnits = JSON.parse(expedition.units);
  const portalEnemies = JSON.parse(portal.enemies);
  
  // Calculer puissance joueur
  const playerPower = await calculatePlayerArmyPower(playerUnits, expedition.user_id);
  
  // Simuler combat (réutilise combat système existant)
  const combatResult = simulateCombat(playerPower, portal.power);
  
  const transaction = await sequelize.transaction();
  
  try {
    if (combatResult.winner === 'attacker') {
      // ✅ VICTOIRE
      expedition.status = 'victory';
      
      // Générer loot
      const loot = JSON.parse(portal.loot_table);
      
      // Ajouter ressources
      const cityResources = await Resource.findOne({
        where: { city_id: expedition.city_id },
        transaction
      });
      
      for (const [resource, amount] of Object.entries(loot.guaranteed)) {
        if (cityResources[resource] !== undefined) {
          cityResources[resource] += amount;
        }
      }
      
      await cityResources.save({ transaction });
      
      // Loot random
      const randomLoot = [];
      loot.random.forEach(item => {
        randomLoot.push(item);
        // Ajouter à l'inventaire joueur (à implémenter)
        // await grantItem(expedition.user_id, item.item, item.amount);
      });
      
      // Statistiques
      portal.times_cleared += 1;
      await portal.save({ transaction });
      
      // Retour des unités survivantes
      const survivingUnits = calculateSurvivors(playerUnits, combatResult.attackerLosses);
      for (const [unitType, quantity] of Object.entries(survivingUnits)) {
        await Unit.increment('quantity', {
          by: quantity,
          where: { city_id: expedition.city_id, name: unitType },
          transaction
        });
      }
      
      expedition.loot_gained = JSON.stringify({ guaranteed: loot.guaranteed, random: randomLoot });
      expedition.survivors = JSON.stringify(survivingUnits);
      
      // Notification
      NotificationService.notifyPortalVictory(expedition.user_id, {
        portalTier: portal.tier,
        loot: loot.guaranteed,
        randomItems: randomLoot
      });
      
    } else {
      // ❌ DÉFAITE
      expedition.status = 'defeat';
      
      // Unités perdues (pas de retour)
      expedition.survivors = JSON.stringify({});
      
      NotificationService.notifyPortalDefeat(expedition.user_id, {
        portalTier: portal.tier,
        unitsLost: playerUnits
      });
    }
    
    expedition.resolved_at = new Date();
    await expedition.save({ transaction });
    
    await transaction.commit();
    
    // Socket en temps réel
    io.to(`user_${expedition.user_id}`).emit('portal_expedition_resolved', {
      expeditionId: expedition.id,
      status: expedition.status,
      loot: expedition.loot_gained,
      survivors: expedition.survivors
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error({ err: error }, 'Error resolving portal expedition');
  }
}

function calculateSurvivors(units, lossPercentage) {
  const survivors = {};
  for (const [unitType, quantity] of Object.entries(units)) {
    const lost = Math.floor(quantity * lossPercentage);
    survivors[unitType] = quantity - lost;
  }
  return survivors;
}
```

---

## 🎨 Interface Utilisateur

### A) Vue Carte du Monde

```javascript
// frontend/src/components/WorldMap.js

// Affichage des portails sur la carte
const renderPortals = () => {
  return portals.map(portal => {
    const tierConfig = PORTAL_TIERS[portal.tier];
    
    return (
      <div
        key={portal.id}
        className={`portal portal-${portal.tier.toLowerCase()}`}
        style={{
          left: portal.coord_x * tileSize,
          top: portal.coord_y * tileSize,
          borderColor: tierConfig.color,
          boxShadow: `0 0 20px ${tierConfig.color}`
        }}
        onClick={() => openPortalModal(portal)}
      >
        <div className="portal-icon">🌀</div>
        <div className="portal-timer">
          {formatTimeRemaining(portal.expires_at)}
        </div>
      </div>
    );
  });
};
```

### B) Modal Portail

```jsx
// frontend/src/components/portals/PortalModal.js

const PortalModal = ({ portal, onClose }) => {
  const tierConfig = PORTAL_TIERS[portal.tier];
  const [selectedUnits, setSelectedUnits] = useState({});
  
  const handleChallenge = async () => {
    try {
      const response = await axiosInstance.post(`/portals/${portal.id}/challenge`, {
        cityId: currentCity.id,
        units: selectedUnits
      });
      
      toast.success(`Expédition lancée ! Arrivée dans ${formatDuration(response.data.travelTime)}`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };
  
  return (
    <div className="portal-modal" style={{ borderColor: tierConfig.color }}>
      <div className="portal-header">
        <h2>{tierConfig.name}</h2>
        <span className="portal-difficulty">{tierConfig.difficulty.toUpperCase()}</span>
      </div>
      
      <div className="portal-info">
        <div className="info-block">
          <span>Puissance estimée :</span>
          <strong>{portal.power.toLocaleString()}</strong>
        </div>
        
        <div className="info-block">
          <span>Localisation :</span>
          <strong>({portal.coord_x}, {portal.coord_y})</strong>
        </div>
        
        <div className="info-block">
          <span>Temps restant :</span>
          <strong className="timer">{formatTimeRemaining(portal.expires_at)}</strong>
        </div>
        
        <div className="info-block">
          <span>Challenges :</span>
          <strong>{portal.times_challenged} / Réussis : {portal.times_cleared}</strong>
        </div>
      </div>
      
      <div className="portal-loot-preview">
        <h3>Récompenses Potentielles</h3>
        <LootPreview tier={portal.tier} />
      </div>
      
      <div className="unit-selection">
        <h3>Sélectionner vos unités</h3>
        <UnitSelector 
          availableUnits={userUnits}
          selectedUnits={selectedUnits}
          onChange={setSelectedUnits}
        />
      </div>
      
      <div className="portal-actions">
        <button onClick={handleChallenge} disabled={Object.keys(selectedUnits).length === 0}>
          🚀 Lancer l'expédition
        </button>
        <button onClick={onClose} className="btn-secondary">
          Annuler
        </button>
      </div>
    </div>
  );
};
```

---

## 📊 Campagne & Missions

### A) Système de Quêtes Portails

```javascript
// backend/modules/quests/domain/questDefinitions.js

const PORTAL_QUESTS = {
  // Tutoriel Portails
  TUTORIAL: [
    {
      id: 'portal_intro',
      title: 'Première Expédition',
      description: 'Complétez votre premier Portail Gris',
      objective: { type: 'clear_portal', tier: 'GREY', count: 1 },
      reward: {
        or: 5000,
        xp: 100,
        unlock: 'portal_system_access'
      }
    },
    {
      id: 'portal_veteran',
      title: 'Vétéran des Portails',
      description: 'Complétez 10 portails de n\'importe quelle couleur',
      objective: { type: 'clear_portal', tier: 'any', count: 10 },
      reward: {
        premium_currency: 50,
        xp: 500,
        title: 'Explorateur de Portails'
      }
    }
  ],
  
  // Campagne Progressive
  CAMPAIGN: [
    {
      id: 'green_challenge',
      title: 'Défi Vert',
      description: 'Complétez 5 Portails Verts',
      prerequisite: 'portal_intro',
      objective: { type: 'clear_portal', tier: 'GREEN', count: 5 },
      reward: {
        blueprint_rare: 'Enhanced_Infantry',
        xp: 800
      }
    },
    {
      id: 'blue_master',
      title: 'Maître du Bleu',
      description: 'Complétez 3 Portails Bleus sans perdre plus de 30% de vos unités',
      prerequisite: 'green_challenge',
      objective: { 
        type: 'clear_portal_perfect',
        tier: 'BLUE',
        count: 3,
        max_losses: 0.3
      },
      reward: {
        blueprint_epic: 'Portal_Armor',
        titanium: 500,
        xp: 1500
      }
    },
    {
      id: 'purple_hunter',
      title: 'Chasseur Violet',
      description: 'Éliminez le boss d\'un Portail Violet',
      prerequisite: 'blue_master',
      objective: { type: 'clear_portal', tier: 'PURPLE', count: 1 },
      reward: {
        unique_unit: 'Void_Touched_Soldier',
        premium_currency: 200,
        xp: 3000,
        title: 'Tueur de Démons'
      }
    }
  ],
  
  // Défis Hebdomadaires
  WEEKLY: [
    {
      id: 'weekly_portal_rush',
      title: 'Rush Hebdomadaire',
      description: 'Complétez 15 portails cette semaine',
      objective: { type: 'clear_portal', tier: 'any', count: 15 },
      reward: {
        premium_currency: 100,
        speedup_24h: 3,
        xp: 2000
      },
      reset: 'weekly'
    }
  ],
  
  // Achievements Long-terme
  ACHIEVEMENTS: [
    {
      id: 'red_portal_slayer',
      title: 'Dompteur de Cauchemars',
      description: 'Complétez 10 Portails Rouges',
      objective: { type: 'clear_portal', tier: 'RED', count: 10 },
      reward: {
        cosmetic_legendary: 'Red_Portal_Cape',
        title: 'Seigneur des Abysses',
        premium_currency: 500
      }
    },
    {
      id: 'golden_legend',
      title: 'Légende Dorée',
      description: 'Complétez 3 Portails Dorés',
      objective: { type: 'clear_portal', tier: 'GOLD', count: 3 },
      reward: {
        unique_building: 'Portal_Nexus', // Bâtiment qui attire portails
        title: 'Briseur de Réalités',
        premium_currency: 2000
      }
    }
  ]
};
```

### B) Campagne Narrative (Optionnel)

```javascript
// Progression narrative via portails
const STORY_ARC = {
  ACT_1: {
    title: 'L\'Anomalie',
    description: 'Des portails mystérieux apparaissent. Que cachent-ils ?',
    quests: ['portal_intro', 'green_challenge'],
    cutscene: 'act1_intro.mp4',
    unlock_at: 'player_level_5'
  },
  
  ACT_2: {
    title: 'L\'Invasion',
    description: 'Les créatures des portails deviennent plus agressives...',
    quests: ['blue_master', 'purple_hunter'],
    cutscene: 'act2_invasion.mp4',
    unlock_at: 'complete_act_1'
  },
  
  ACT_3: {
    title: 'La Source',
    description: 'Découvrez l\'origine des portails et affrontez le Void King.',
    quests: ['red_portal_slayer', 'golden_legend'],
    boss_fight: 'VOID_KING_PORTAL', // Portail unique de fin
    cutscene: 'act3_finale.mp4',
    reward: {
      unique_title: 'Sauveur de Terra Dominus',
      cosmetic_set: 'void_conqueror_set',
      building: 'Monument_Victory'
    }
  }
};
```

---

## 🎯 Avantages du Système

### ✅ Pour les Joueurs

1. **PvE accessible** : Pas besoin d'alliance, jouable solo
2. **Risk/Reward clair** : Couleur = difficulté = récompenses
3. **Pas d'obligation** : Joueur ignore les portails s'il veut juste PvP
4. **Événements visuels** : Portail Rouge qui spawn = excitation serveur
5. **Progression parallèle** : Quêtes portails = XP + loot sans PvP

### ✅ Pour le Design

1. **Réutilise système combat** : Pas de nouveau moteur à coder
2. **Simple à balancer** : Ajuster power ranges + loot tables
3. **Scalable** : Facile d'ajouter nouveaux tiers (Orange, Arc-en-ciel, etc.)
4. **Events serveur** : Portail Doré = event planifié (comme boss World)
5. **Sink de unités** : Défaites = unités perdues = économie régulée

### ✅ Pour la Rétention

1. **Daily login** : Checker s'il y a des portails rares
2. **FOMO** : Portail Doré 30min = rush
3. **Progression** : Campagne = objectives long-terme
4. **Social** : Joueurs partagent localisation portails rares dans alliances

---

## 📈 Implémentation Priorisée

### Phase 1 : MVP Portails (Semaine 1-2, 80h)

- [ ] Modèle DB Portal + PortalExpedition
- [ ] Worker spawn portails (3 tiers : Gris, Vert, Bleu)
- [ ] API challenge portail
- [ ] Combat résolution (réutilise CombatService)
- [ ] Loot distribution
- [ ] UI : icône portails sur carte + modal

**Livrable :** Portails Gris/Vert/Bleu fonctionnels, jouable end-to-end

### Phase 2 : Portails Avancés (Semaine 3, 40h)

- [ ] Tiers Violet, Rouge, Doré
- [ ] Annonces globales portails rares
- [ ] Boss mechanics (phases, loot spécial)
- [ ] Système de timer countdown UI

**Livrable :** Tous les tiers disponibles, events rares

### Phase 3 : Quêtes & Campagne (Semaine 4, 60h)

- [ ] Système de quêtes portails
- [ ] Progression campagne (tutoriel → achievements)
- [ ] UI quest tracker
- [ ] Rewards distribution (blueprints, cosmetics)

**Livrable :** Campagne narrative complète

---

## 🔮 Extensions Futures

### A) Portails Spéciaux

```javascript
// Portails thématiques (events saisonniers)
const SEASONAL_PORTALS = {
  HALLOWEEN_PORTAL: {
    name: 'Portail des Ombres',
    duration_event: '7_days',
    enemies: ['Ghost', 'Pumpkin_Golem', 'Witch'],
    loot: ['halloween_cosmetics', 'candy_currency']
  },
  
  CHRISTMAS_PORTAL: {
    name: 'Portail Glacé',
    enemies: ['Ice_Elemental', 'Snow_Titan'],
    loot: ['winter_skins', 'gift_boxes']
  }
};
```

### B) Portails Coopératifs

```javascript
// Portails nécessitant plusieurs joueurs
const RAID_PORTAL = {
  tier: 'RAID',
  min_players: 3,
  max_players: 10,
  shared_hp: 500000,
  coordination_required: true,
  loot_split: 'participation_based'
};
```

### C) Crafting avec Essences de Portail

```javascript
// Portails droppent essences pour crafter
const PORTAL_ESSENCES = {
  grey_essence: { use: 'craft_speedup_1h' },
  blue_essence: { use: 'craft_rare_blueprint' },
  red_essence: { use: 'craft_legendary_unit' },
  void_essence: { use: 'craft_portal_summoner' } // Invoque portail privé
};
```

---

## 🎬 Conclusion

Ce système de portails combine :

✅ **Simplicité OGame** : Mécanique = "Envoyer unités → Attendre → Récompense"  
✅ **Excitation Solo Leveling** : Portails colorés apparaissent mystérieusement  
✅ **PvE sans complexité** : Pas de zones, pas de PNJ errants, juste des events  
✅ **Réutilisation code** : Combat système existant, juste nouveau contexte  
✅ **Scalabilité** : Facile d'ajouter tiers, quêtes, events saisonniers

**ROI estimé :**
- **Coût dev :** 180h total (MVP + Avancé + Quêtes) = ~3 semaines 2 devs
- **Impact rétention :** +40% J7 (contenu PvE solo), +60% J30 (campagne)
- **Engagement :** +50% session time (checker portails = nouveau daily habit)

**Prêt à implémenter ?** Je peux commencer par le MVP (Phase 1) dès maintenant si tu valides le design. 🚀
