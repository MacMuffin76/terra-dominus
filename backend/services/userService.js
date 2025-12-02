const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const City = require('../models/City');
const Resource = require('../models/Resource');
const Building = require('../models/Building');
const Unit = require('../models/Unit');
const Research = require('../models/Research');
const Training = require('../models/Training');
const Defense = require('../models/Defense');
const Facility = require('../models/Facility');
const Entity = require('../models/Entity');
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
  const city = await City.create({
    user_id: userId,
    name: 'Capitale',
    is_capital: true,
    coord_x: 0,
    coord_y: 0,
  }, { transaction });

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
    'Centre de Recherche',
    "Terrain d'Entrainement",
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
        'Drone d’assaut terrestre',
        'Fantassin plasmique',
        'Infiltrateur holo-camouflage',
        'Tireur à antimatière',
        'Artilleur à railgun',
        'Exo-sentinelle',
        'Commandos nano-armure',
        'Légionnaire quantique',
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
        'Technologie Laser Photonique',
        'Systèmes d’Armes Railgun',
        'Déploiement de Champs de Force',
        'Guidage Avancé de Missiles',
        'Antigravitationnelle',
        'Ingénierie des Contre-mesures EM',
        'Confinement de Plasma',
        'Impulsion EM Avancée',
        'Nanotechnologie Autoréplicante',
        'Réseau de Détection Quantique',
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

  const accessToken = buildAccessToken(user.id);
  const refreshToken = await createRefreshTokenRecord(user.id);

  return { token: accessToken, refreshToken: refreshToken.token, user };
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