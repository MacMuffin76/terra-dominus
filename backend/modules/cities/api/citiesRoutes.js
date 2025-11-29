const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const { getLogger } = require('../../../utils/logger');
const City = require('../../../models/City');
const Building = require('../../../models/Building');
const Resource = require('../../../models/Resource');
const Unit = require('../../../models/Unit');

const logger = getLogger({ module: 'CitiesController' });

const createCitiesRouter = () => {
  const router = Router();

  /**
   * GET /api/cities/my-cities
   * Récupère toutes les villes du joueur
   */
  router.get('/my-cities', protect, async (req, res) => {
    try {
      const cities = await City.findAll({
        where: { user_id: req.user.id },
        attributes: [
          'id',
          'name',
          'is_capital',
          'coord_x',
          'coord_y',
          'vision_range',
          'founded_at',
          'created_at',
        ],
        order: [
          ['is_capital', 'DESC'],
          ['created_at', 'ASC'],
        ],
      });

      // Enrichir avec statistiques basiques de chaque ville
      const enrichedCities = await Promise.all(
        cities.map(async (city) => {
          const [buildingCount, unitCount, resources] = await Promise.all([
            Building.count({ where: { city_id: city.id } }),
            Unit.sum('quantity', { where: { city_id: city.id } }) || 0,
            Resource.findAll({
              where: { city_id: city.id },
              attributes: ['type', 'amount'],
            }),
          ]);

          return {
            id: city.id,
            name: city.name,
            isCapital: city.is_capital,
            coords: {
              x: city.coord_x,
              y: city.coord_y,
            },
            visionRange: city.vision_range,
            foundedAt: city.founded_at,
            stats: {
              buildings: buildingCount,
              units: unitCount,
              resources: resources.map((r) => ({
                type: r.type,
                amount: Math.floor(Number(r.amount) || 0),
              })),
            },
          };
        })
      );

      return res.json(enrichedCities);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error getting user cities');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des villes.' });
    }
  });

  /**
   * GET /api/cities/:id
   * Récupère les détails d'une ville spécifique
   */
  router.get('/:id', protect, async (req, res) => {
    try {
      const cityId = parseInt(req.params.id, 10);

      if (isNaN(cityId)) {
        return res.status(400).json({ message: 'ID de ville invalide.' });
      }

      const city = await City.findOne({
        where: {
          id: cityId,
          user_id: req.user.id,
        },
        attributes: [
          'id',
          'name',
          'is_capital',
          'coord_x',
          'coord_y',
          'vision_range',
          'founded_at',
          'created_at',
          'updated_at',
        ],
      });

      if (!city) {
        return res.status(404).json({ message: 'Ville introuvable.' });
      }

      // Récupérer les données complètes de la ville
      const [buildings, units, resources] = await Promise.all([
        Building.findAll({
          where: { city_id: cityId },
          attributes: ['id', 'name', 'level', 'capacite'],
          order: [['name', 'ASC']],
        }),
        Unit.findAll({
          where: { city_id: cityId },
          attributes: ['id', 'name', 'quantity', 'force'],
          order: [['name', 'ASC']],
        }),
        Resource.findAll({
          where: { city_id: cityId },
          attributes: ['type', 'amount', 'last_update'],
        }),
      ]);

      return res.json({
        id: city.id,
        name: city.name,
        isCapital: city.is_capital,
        coords: {
          x: city.coord_x,
          y: city.coord_y,
        },
        visionRange: city.vision_range,
        foundedAt: city.founded_at,
        buildings: buildings.map((b) => ({
          id: b.id,
          name: b.name,
          level: b.level,
          capacity: b.capacite,
        })),
        units: units.map((u) => ({
          id: u.id,
          name: u.name,
          quantity: u.quantity,
          force: u.force,
        })),
        resources: resources.map((r) => ({
          type: r.type,
          amount: Math.floor(Number(r.amount) || 0),
          lastUpdate: r.last_update,
        })),
      });
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error getting city details');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des détails de la ville.' });
    }
  });

  /**
   * POST /api/cities/:id/set-capital
   * Change la capitale du joueur
   */
  router.post('/:id/set-capital', protect, async (req, res) => {
    try {
      const cityId = parseInt(req.params.id, 10);

      if (isNaN(cityId)) {
        return res.status(400).json({ message: 'ID de ville invalide.' });
      }

      // Vérifier que la ville appartient au joueur
      const city = await City.findOne({
        where: {
          id: cityId,
          user_id: req.user.id,
        },
      });

      if (!city) {
        return res.status(404).json({ message: 'Ville introuvable.' });
      }

      if (city.is_capital) {
        return res.status(400).json({ message: 'Cette ville est déjà la capitale.' });
      }

      // Mettre à jour: retirer is_capital de toutes les villes, puis définir la nouvelle
      await City.update(
        { is_capital: false },
        { where: { user_id: req.user.id } }
      );

      await City.update(
        { is_capital: true },
        { where: { id: cityId } }
      );

      (req.logger || logger).audit(
        { userId: req.user.id, cityId },
        'Capital city changed'
      );

      return res.json({ message: `${city.name} est maintenant votre capitale.` });
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error setting capital');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors du changement de capitale.' });
    }
  });

  /**
   * PUT /api/cities/:id/rename
   * Renomme une ville
   */
  router.put('/:id/rename', protect, async (req, res) => {
    try {
      const cityId = parseInt(req.params.id, 10);
      const { name } = req.body;

      if (isNaN(cityId)) {
        return res.status(400).json({ message: 'ID de ville invalide.' });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Le nom de la ville est requis.' });
      }

      if (name.length > 100) {
        return res.status(400).json({ message: 'Le nom de la ville est trop long (max 100 caractères).' });
      }

      const city = await City.findOne({
        where: {
          id: cityId,
          user_id: req.user.id,
        },
      });

      if (!city) {
        return res.status(404).json({ message: 'Ville introuvable.' });
      }

      await city.update({ name: name.trim() });

      (req.logger || logger).audit(
        { userId: req.user.id, cityId, oldName: city.name, newName: name },
        'City renamed'
      );

      return res.json({ message: 'Ville renommée avec succès.', name: city.name });
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error renaming city');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors du renommage de la ville.' });
    }
  });

  return router;
};

module.exports = createCitiesRouter;
