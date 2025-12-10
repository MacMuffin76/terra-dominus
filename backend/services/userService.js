const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const City = require('../models/City');
const CitySlot = require('../models/CitySlot');
const Resource = require('../models/Resource');
const Building = require('../models/Building');
const Unit = require('../models/Unit');
const Research = require('../models/Research');
const Training = require('../models/Training');
const Defense = require('../models/Defense');
const Facility = require('../models/Facility');
const Entity = require('../models/Entity');
const WorldGrid = require('../models/WorldGrid');
const sequelize = require('../db');
const RefreshToken = require('../models/RefreshToken');
const BlueprintRepository = require('../repositories/BlueprintRepository');
const { calculateShieldExpiration } = require('../modules/protection/domain/protectionRules');
const TutorialProgress = require('../models/TutorialProgress');

const { getJwtSecret } = require('../config/jwtConfig');

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '2h';
const REFRESH_TOKEN_TTL_MS = Number(process.env.REFRESH_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const JWT_SECRET = getJwtSecret();

const blueprintRepository = new BlueprintRepository();

const computeBlueprintLevelCost = (blueprint, level) => {
  if (!blueprint || (blueprint.max_level && level > blueprint.max_level)) {
    return 0;
  }

  return Object.values(blueprint.costs || {}).reduce(
    (sum, amount) => sum + Number(amount || 0) * level,
    0,
  );
};

const buildAccessToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  async function findOrCreateCapitalSlot(transaction) {
  const availableSlot = await CitySlot.findOne({
    where: { status: 'free', city_id: null },
    include: [
      {
        model: WorldGrid,
        as: 'grid',
        attributes: ['coord_x', 'coord_y'],
      },
    ],
    order: [['id', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (availableSlot && availableSlot.grid) {
    return availableSlot;
  }

  const [existingCoords] = await sequelize.query(
    'SELECT coord_x, coord_y FROM world_grid FOR UPDATE',
    { transaction }
  );
  const usedCoords = new Set(existingCoords.map((row) => `${row.coord_x},${row.coord_y}`));

  let coordX = 0;
  let coordY = 0;
  while (usedCoords.has(`${coordX},${coordY}`)) {
    coordX += 1;
    if (coordX > 100000) {
      coordX = 0;
      coordY += 1;
    }
  }

  const grid = await WorldGrid.create(
    {
      coord_x: coordX,
      coord_y: coordY,
      terrain_type: 'plains',
      has_city_slot: true,
    },
    { transaction }
  );

  const slot = await CitySlot.create(
    {
      grid_id: grid.id,
      status: 'free',
      quality: 1,
    },
    { transaction }
  );

  slot.grid = grid;
  return slot;
}

  
async function createRefreshTokenRecord(userId, transaction) {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await RefreshToken.create(
    {
      token,
      user_id: userId,
      expires_at: expiresAt,
      revoked: false,
    },
    { transaction }
  );

  return { token, expiresAt };
}

async function initializeUserGameData(userId, transaction) {
  const capitalSlot = await findOrCreateCapitalSlot(transaction);

  if (!capitalSlot || !capitalSlot.grid) {
    throw new Error('Aucun emplacement disponible pour la capitale');
  }

  const city = await City.create({
    user_id: userId,
    name: 'Capitale',
    is_capital: true,
    coord_x: capitalSlot.grid.coord_x,
    coord_y: capitalSlot.grid.coord_y,
  }, { transaction });

  await CitySlot.update({
    city_id: city.id,
    status: 'occupied',
    updated_at: new Date(),
  }, {
    where: { id: capitalSlot.id },
    transaction,
  });

  const cityId = city.id;

  const resourceTypes = ['or', 'metal', 'carburant', 'energie'];
  const initialAmounts = {
    or: 1000,
    metal: 2000,
    carburant: 0,
    energie: 0,
  };

  await Promise.all(
    resourceTypes.map((type) =>
      Resource.create({
        city_id: cityId,
        type,
        amount: initialAmounts[type] ?? 0,
      }, { transaction })
    )
  );

  const buildingTypes = [
    "Mine d'or",
    'Mine de métal',
    'Extracteur',
    'Centrale électrique',
    'Hangar',
    'Réservoir',
  ];

  await Promise.all(
    buildingTypes.map(async (name) => {
      const entity = await Entity.findOne({
        where: { entity_type: 'building', entity_name: name },
        transaction,
      });

      if (!entity) {
        throw new Error(`Entity introuvable pour bâtiment : ${name}`);
      }

      await Building.create({
        city_id: cityId,
        name,
        level: 0,
        capacite: 0,
        description: null,
        building_type_id: entity.entity_id,
      }, { transaction });
    })
  );

  const facilityTypes = [
    'Centre de commandement',
    'Comptoir commercial',
    'Atelier de defense',
    'Centre d\'entraînement',
    'Forge militaire',
    'Laboratoire de recherche'
  ];

  await Promise.all(
    facilityTypes.map(async (name) => {
      const entity = await Entity.findOne({
        where: { entity_type: 'facility', entity_name: name },
        transaction,
      });

      if (!entity) {
        throw new Error(`Entity introuvable pour installation : ${name}`);
      }

      await Facility.create({
        city_id: cityId,
        name,
        description: null,
        level: 0,
        nextlevelcost: 0,
        facility_type_id: entity.entity_id,
      }, { transaction });
    })
  );

  const unitBlueprints = await blueprintRepository.listByCategory('unit');
  const unitTypes = unitBlueprints.length
    ? unitBlueprints.map((bp) => bp.type)
    : [
        'Militia',
        'Infantry',
        'Archer',
        'Cavalry',
        'Spearmen',
        'Artillery',
        'Enginneer',
        'Tanks',
        'Anti_tant',
        'Mec',
        'Spy'
      ];

  await Promise.all(
    unitTypes.map((name) =>
      Unit.create({
        city_id: cityId,
        name,
        quantity: 0,
        force: 0,
      }, { transaction })
    )
  );

  const researchBlueprints = await blueprintRepository.listByCategory('research');
  const researchTypes = researchBlueprints.length
    ? researchBlueprints.map((bp) => bp.type)
    : [
        'Boucliers Énergétiques',
        'Fortifications',
        'Systèmes de Ciblage',
        'Extraction Avancée',
        'Efficacité Énergétique',
        'Logistique',
        'Cartographie',
        'Logistique rapide',
        'Armement Anti-Blindage',
        'Armes à Énergie',
        'Forces Spéciales',
        'Armes Automatiques',
        'Tactiques de Guérilla',
        'Formation Militaire',
        'Blindage Lourd',
        'Motorisation',
      ];

  await Promise.all(
    researchTypes.map((name) =>
      Research.create({
        user_id: userId,
        name,
        level: 0,
        nextlevelcost: computeBlueprintLevelCost(
          researchBlueprints.find((bp) => bp.type === name),
          1,
        ),
        description: null,
      }, { transaction })
    )
  );

  await Promise.all(
    unitTypes.map((name) =>
      Training.create({
        user_id: userId,
        name,
        level: 0,
        nextlevelcost: computeBlueprintLevelCost(
          unitBlueprints.find((bp) => bp.type === name),
          1,
        ),
        description: null,
      }, { transaction })
    )
  );

  const defenseTypes = [
    'Tourelle à laser',
    'Canon railgun',
    'Générateur de champ de force',
    'Lance-missiles sol-air',
    'Mine antigrav',
    'Système de brouillage EM',
    'Tour plasma',
    'Lance-charge électromagnétique',
    'Mur nanobot',
    'Radar quantique',
  ];

  await Promise.all(
    defenseTypes.map((name) =>
      Defense.create({
        city_id: cityId,
        name,
        quantity: 0,
        cost: 0,
        description: null,
      }, { transaction })
    )
  );
}

async function registerUser({ username, email, password }) {
  if (await User.findOne({ where: { username } })) {
    const error = new Error("Nom d'utilisateur déjà existant");
    error.status = 400;
    throw error;
  }

  const hashed = await bcrypt.hash(password, 10);
  return sequelize.transaction(async (transaction) => {
    // Calculate protection shield expiration (72h from now)
    const shieldExpiration = calculateShieldExpiration();
    
    const newUser = await User.create(
      { 
        username, 
        email, 
        password: hashed,
        protection_shield_until: shieldExpiration,
        attacks_sent_count: 0
      },
      { transaction }
    );
  await initializeUserGameData(newUser.id, transaction);

    // Initialize tutorial progress
    await TutorialProgress.create({
      user_id: newUser.id,
      current_step: 1,
      completed: false,
      skipped: false,
      completed_steps: [],
      started_at: new Date(),
    }, { transaction });

    const accessToken = buildAccessToken(newUser.id);
    const refreshToken = await createRefreshTokenRecord(newUser.id, transaction);
    return { token: accessToken, refreshToken: refreshToken.token, user: newUser };
  });
}

async function loginUser({ username, password }) {
  const user = await User.findOne({ where: { username } });
  const isValid = user && (await bcrypt.compare(password, user.password));

  if (!isValid) {
    const error = new Error('Identifiants incorrects');
    error.status = 400;
    throw error;
  }

  // Calculer le rattrapage de production offline
  // Si last_logout existe, on l'utilise. Sinon, on utilise last_login (utilisateur qui a fermé l'onglet sans se déconnecter)
  const lastActivity = user.last_logout || user.last_login;
  
  if (lastActivity) {
    try {
      await calculateOfflineCatchup(user.id, lastActivity);
    } catch (error) {
      console.error('Erreur lors du calcul du rattrapage offline:', error);
      // Ne pas bloquer le login si le calcul échoue
    }
  }

  // Réinitialiser last_logout et enregistrer l'heure de connexion
  user.last_logout = null;
  user.last_login = new Date();
  await user.save();

  const accessToken = buildAccessToken(user.id);
  const refreshToken = await createRefreshTokenRecord(user.id);

  return { token: accessToken, refreshToken: refreshToken.token, user };
}

/**
 * Calculer et appliquer le rattrapage de production offline
 */
async function calculateOfflineCatchup(userId, lastLogout) {
  const sequelize = require('../db');
  const ProductionCalculatorService = require('../modules/resources/application/ProductionCalculatorService');
  const ResourceProduction = require('../models/ResourceProduction');
  
  // Utiliser une transaction pour garantir la cohérence des données
  await sequelize.transaction(async (transaction) => {
    const productionCalculator = new ProductionCalculatorService({
      Building,
      Research,
      Facility,
      City,
      ResourceProduction,
    });

    // Calculer les taux de production
    const { production, storage } = await productionCalculator.calculateProductionRates(userId);

    // Calculer le temps écoulé en secondes
    const now = new Date();
    const elapsedSeconds = Math.floor((now - new Date(lastLogout)) / 1000);

    if (elapsedSeconds <= 0) return;

    // Récupérer les ressources actuelles avec lock
    const city = await City.findOne({ 
      where: { user_id: userId, is_capital: true },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!city) return;

    const resources = await Resource.findAll({ 
      where: { city_id: city.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    const currentResources = {
      gold: resources.find(r => r.type === 'or')?.amount || 0,
      metal: resources.find(r => r.type === 'metal')?.amount || 0,
      fuel: resources.find(r => r.type === 'carburant')?.amount || 0,
      energy: resources.find(r => r.type === 'energie')?.amount || 0,
    };

    // Calculer les nouvelles ressources avec le plafond de stockage
    const newResources = productionCalculator.calculateOfflineProduction(
      currentResources,
      production,
      storage,
      elapsedSeconds
    );

    // Mettre à jour les ressources en base de données
    // ⚠️ IMPORTANT: On met last_update à 'now' pour que getUserResources() 
    // ne recalcule pas la production immédiatement après
    const resourceMap = {
      gold: 'or',
      metal: 'metal',
      fuel: 'carburant',
      energy: 'energie',
    };

    const updateTime = new Date();
    await Promise.all(
      Object.entries(newResources).map(([key, amount]) => {
        const dbType = resourceMap[key];
        return Resource.update(
          { amount, last_update: updateTime },
          { 
            where: { city_id: city.id, type: dbType },
            transaction
          }
        );
      })
    );

    console.log(`Rattrapage offline pour userId ${userId}: ${elapsedSeconds}s écoulées, nouvelles ressources:`, newResources);
  });
}

async function refreshSession(refreshToken) {
  const stored = await RefreshToken.findOne({ where: { token: refreshToken } });

  if (!stored) {
    const error = new Error('Refresh token invalide');
    error.status = 401;
    throw error;
  }

  if (stored.revoked) {
    const error = new Error('Refresh token révoqué');
    error.status = 401;
    throw error;
  }

  if (stored.expires_at.getTime() < Date.now()) {
    stored.revoked = true;
    await stored.save();
    const error = new Error('Refresh token expiré');
    error.status = 401;
    throw error;
  }

  const user = await User.findByPk(stored.user_id);

  if (!user) {
    const error = new Error('Utilisateur introuvable');
    error.status = 404;
    throw error;
  }

  const accessToken = buildAccessToken(user.id);
  const newRefreshToken = await createRefreshTokenRecord(user.id);

  stored.revoked = true;
  stored.replaced_by_token = newRefreshToken.token;
  await stored.save();

  return { token: accessToken, refreshToken: newRefreshToken.token, user };
}

module.exports = {
  initializeUserGameData,
  registerUser,
  loginUser,
  refreshSession,
};
