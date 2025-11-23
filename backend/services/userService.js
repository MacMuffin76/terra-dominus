const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

async function initializeUserGameData(userId) {
  const city = await City.create({
    user_id: userId,
    name: 'Capitale',
    is_capital: true,
    coord_x: 0,
    coord_y: 0,
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
      })
    )
  );

  const buildingTypes = [
    "Mine d'or",
    "Mine de métal",
    'Extracteur',
    'Centrale électrique',
    'Hangar',
    'Réservoir',
  ];

  await Promise.all(
    buildingTypes.map(async (name) => {
      const entity = await Entity.findOne({
        where: { entity_type: 'building', entity_name: name },
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
      });
    })
  );

  const facilityTypes = [
    'Centre de Commandement',
    'Laboratoire de Recherche',
    "Terrain d'Entraînement",
  ];

  await Promise.all(
    facilityTypes.map(async (name) => {
      const entity = await Entity.findOne({
        where: { entity_type: 'facility', entity_name: name },
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
      });
    })
  );

  const unitTypes = [
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
      })
    )
  );

  const researchTypes = [
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
        nextlevelcost: 0,
        description: null,
      })
    )
  );

  const trainingTypes = [
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
    trainingTypes.map((name) =>
      Training.create({
        user_id: userId,
        name,
        level: 0,
        nextlevelcost: 0,
        description: null,
      })
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
      })
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
  const newUser = await User.create({ username, email, password: hashed });

  await initializeUserGameData(newUser.id);

  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
    expiresIn: '2h',
  });

  return { token, user: newUser };
}

async function loginUser({ username, password }) {
  const user = await User.findOne({ where: { username } });
  const isValid = user && (await bcrypt.compare(password, user.password));

  if (!isValid) {
    const error = new Error('Identifiants incorrects');
    error.status = 400;
    throw error;
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '2h',
  });

  return { token, user };
}

module.exports = {
  initializeUserGameData,
  registerUser,
  loginUser,
};