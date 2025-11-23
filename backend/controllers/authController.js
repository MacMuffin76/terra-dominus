// backend/controllers/authController.js

const User      = require('../models/User');
const City      = require('../models/City');
const Resource  = require('../models/Resource');
const Building  = require('../models/Building');
const Unit      = require('../models/Unit');
const Research  = require('../models/Research');
const Defense   = require('../models/Defense');
const Facility  = require('../models/Facility');
const Entity    = require('../models/Entity');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');

const initializeUserGameData = async (userId) => {
  // 🔹 0) Création de la ville capitale
  const city = await City.create({
    user_id:    userId,
    name:       'Capitale',
    is_capital: true,
    coord_x:    0,
    coord_y:    0,
  });

  const cityId = city.id;

  // 🔹 1) Ressources de la ville
  // ==> On donne 1000 d'or, 2000 de métal, 0 carburant, 0 énergie
  const resourceTypes = ['or', 'metal', 'carburant', 'energie'];
  const initialAmounts = {
    or:        1000,
    metal:     2000,
    carburant: 0,
    energie:   0,
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

  // 🔹 2) Bâtiments (liés à la ville)
  const buildingTypes = [
    "Mine d'or",
    "Mine de métal",
    "Extracteur",
    "Centrale électrique",
    "Hangar",
    "Réservoir",
  ];

  await Promise.all(
    buildingTypes.map(async (name) => {
      const entity = await Entity.findOne({
        where: { entity_type: 'building', entity_name: name },
      });
      if (!entity) throw new Error(`Entity introuvable pour bâtiment : ${name}`);

      await Building.create({
        city_id:          cityId,
        name,
        level:            0,
        capacite:         0,
        description:      null,
        building_type_id: entity.entity_id,
      });
    })
  );

  // 🔹 3) Installations (facilities) – par ville
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
        city_id:          cityId,
        name,
        description:      null,
        level:            0,
        nextlevelcost:    0,
        facility_type_id: entity.entity_id,
      });
    })
  );

  // 🔹 4) Unités – stockées sur la ville
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
        city_id:  cityId,
        name,
        quantity: 0,
        force:    0,
      })
    )
  );

  // 🔹 5) Recherches – globales au joueur (user_id)
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
        user_id:       userId,
        name,
        level:         0,
        nextlevelcost: 0,
        description:   null,
      })
    )
  );

  // 🔹 6) Défenses – par ville
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
        city_id:      cityId,
        name,
        quantity:     0,
        cost:         0,
        description:  null,
      })
    )
  );
};

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (await User.findOne({ where: { username } })) {
      return res
        .status(400)
        .json({ message: "Nom d'utilisateur déjà existant" });
    }

    const hashed  = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashed });

    await initializeUserGameData(newUser.id);

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de l'inscription : " + error.message });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Identifiants incorrects' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la connexion' });
  }
};

module.exports = { registerUser, loginUser };
