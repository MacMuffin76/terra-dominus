const { runWithContext } = require('../../../utils/logger');

/**
 * UpkeepService - Gestion des coûts d'entretien des unités
 * 
 * Ce service implémente le système d'upkeep pour équilibrer l'économie PvP:
 * - Calcul des coûts horaires par armée
 * - Déduction automatique des ressources
 * - Avertissements quand les ressources sont insuffisantes
 * - Démobilisation automatique des unités non payées
 */
class UpkeepService {
  constructor({ City, Unit, Resource, sequelize }) {
    this.City = City;
    this.Unit = Unit;
    this.Resource = Resource;
    this.sequelize = sequelize;
  }

  /**
   * Calculer l'upkeep total d'une ville
   * @param {number} cityId - ID de la ville
   * @returns {Promise<{gold: number, metal: number, fuel: number, units: Array}>}
   */
  async calculateCityUpkeep(cityId) {
    return runWithContext(async () => {
      const units = await this.Unit.findAll({
        where: { city_id: cityId, quantity: { [this.sequelize.Sequelize.Op.gt]: 0 } },
        include: [
          {
            model: this.sequelize.models.Entity,
            as: 'entity',
            include: [
              {
                model: this.sequelize.models.UnitUpkeep,
                as: 'unitUpkeep',
                required: false
              }
            ]
          }
        ]
      });

      let totalGold = 0;
      let totalMetal = 0;
      let totalFuel = 0;
      const unitBreakdown = [];

      units.forEach(unit => {
        const upkeep = unit.entity?.unitUpkeep;
        if (!upkeep) return;

        const goldCost = upkeep.gold_per_hour * unit.quantity;
        const metalCost = upkeep.metal_per_hour * unit.quantity;
        const fuelCost = upkeep.fuel_per_hour * unit.quantity;

        totalGold += goldCost;
        totalMetal += metalCost;
        totalFuel += fuelCost;

        unitBreakdown.push({
          unitId: unit.id,
          unitName: unit.name,
          quantity: unit.quantity,
          goldPerHour: goldCost,
          metalPerHour: metalCost,
          fuelPerHour: fuelCost
        });
      });

      return {
        gold: totalGold,
        metal: totalMetal,
        fuel: totalFuel,
        units: unitBreakdown
      };
    });
  }

  /**
   * Calculer l'upkeep total d'un joueur (toutes ses villes)
   * @param {number} userId - ID du joueur
   * @returns {Promise<{gold: number, metal: number, fuel: number, cities: Object}>}
   */
  async calculateUserUpkeep(userId) {
    return runWithContext(async () => {
      const cities = await this.City.findAll({
        where: { user_id: userId }
      });

      let totalGold = 0;
      let totalMetal = 0;
      let totalFuel = 0;
      const cityBreakdown = {};

      for (const city of cities) {
        const cityUpkeep = await this.calculateCityUpkeep(city.id);
        
        totalGold += cityUpkeep.gold;
        totalMetal += cityUpkeep.metal;
        totalFuel += cityUpkeep.fuel;

        if (cityUpkeep.gold > 0 || cityUpkeep.metal > 0 || cityUpkeep.fuel > 0) {
          cityBreakdown[city.id] = {
            cityName: city.name,
            upkeep: cityUpkeep
          };
        }
      }

      return {
        gold: totalGold,
        metal: totalMetal,
        fuel: totalFuel,
        cities: cityBreakdown
      };
    });
  }

  /**
   * Déduire l'upkeep horaire pour toutes les villes actives
   * Appelé par le cron job
   * @returns {Promise<{processed: number, warnings: Array, disbanded: Array}>}
   */
  async processHourlyUpkeep() {
    return runWithContext(async () => {
      const transaction = await this.sequelize.transaction();
      const warnings = [];
      const disbanded = [];
      let processed = 0;

      try {
        // Récupérer toutes les villes avec des unités
        const cities = await this.City.findAll({
          include: [
            {
              model: this.Unit,
              as: 'units',
              where: { quantity: { [this.sequelize.Sequelize.Op.gt]: 0 } },
              required: true
            }
          ],
          transaction
        });

        console.log(`⏰ Processing upkeep for ${cities.length} cities with units`);

        for (const city of cities) {
          // Calculer l'upkeep de cette ville
          const upkeep = await this.calculateCityUpkeep(city.id);
          
          if (upkeep.gold === 0 && upkeep.metal === 0 && upkeep.fuel === 0) {
            continue; // Pas d'upkeep pour cette ville
          }

          // Récupérer les ressources actuelles
          const resources = await this.Resource.findOne({
            where: { city_id: city.id },
            transaction
          });

          if (!resources) {
            console.error(`❌ City ${city.id} has no resources record`);
            continue;
          }

          // Vérifier si les ressources sont suffisantes
          const canAfford = 
            resources.gold >= upkeep.gold &&
            resources.metal >= upkeep.metal &&
            resources.fuel >= upkeep.fuel;

          if (canAfford) {
            // Déduire l'upkeep
            resources.gold -= upkeep.gold;
            resources.metal -= upkeep.metal;
            resources.fuel -= upkeep.fuel;
            await resources.save({ transaction });
            processed++;
          } else {
            // Ressources insuffisantes - démobiliser des unités
            console.warn(`⚠️  City ${city.name} (${city.id}) cannot afford upkeep`);
            
            const shortfall = {
              gold: Math.max(0, upkeep.gold - resources.gold),
              metal: Math.max(0, upkeep.metal - resources.metal),
              fuel: Math.max(0, upkeep.fuel - resources.fuel)
            };

            warnings.push({
              cityId: city.id,
              cityName: city.name,
              userId: city.user_id,
              upkeepNeeded: upkeep,
              resourcesAvailable: {
                gold: resources.gold,
                metal: resources.metal,
                fuel: resources.fuel
              },
              shortfall
            });

            // Démobiliser des unités (10% par heure impayé)
            const disbandResult = await this.disbandUnitsForNonPayment(
              city.id,
              0.10,
              transaction
            );
            
            disbanded.push({
              cityId: city.id,
              cityName: city.name,
              userId: city.user_id,
              unitsDisbanded: disbandResult
            });
          }
        }

        await transaction.commit();

        console.log(`✅ Upkeep processed: ${processed} cities paid, ${warnings.length} warnings, ${disbanded.length} cities with disbanded units`);

        return { processed, warnings, disbanded };

      } catch (error) {
        await transaction.rollback();
        console.error('❌ Error processing upkeep:', error);
        throw error;
      }
    });
  }

  /**
   * Démobiliser un pourcentage d'unités d'une ville
   * @param {number} cityId - ID de la ville
   * @param {number} percentage - Pourcentage à démobiliser (0.0 - 1.0)
   * @param {Transaction} transaction - Transaction Sequelize
   * @returns {Promise<Array>} - Liste des unités démobilisées
   */
  async disbandUnitsForNonPayment(cityId, percentage, transaction) {
    const units = await this.Unit.findAll({
      where: { 
        city_id: cityId,
        quantity: { [this.sequelize.Sequelize.Op.gt]: 0 }
      },
      include: [
        {
          model: this.sequelize.models.Entity,
          as: 'entity'
        }
      ],
      transaction
    });

    const disbanded = [];

    for (const unit of units) {
      const toLose = Math.ceil(unit.quantity * percentage);
      if (toLose > 0) {
        unit.quantity -= toLose;
        await unit.save({ transaction });

        disbanded.push({
          unitId: unit.id,
          unitName: unit.name,
          quantityLost: toLose,
          quantityRemaining: unit.quantity
        });
      }
    }

    return disbanded;
  }

  /**
   * Obtenir un rapport d'upkeep pour un joueur (pour le dashboard)
   * @param {number} userId - ID du joueur
   * @returns {Promise<Object>}
   */
  async getUpkeepReport(userId) {
    return runWithContext(async () => {
      const upkeep = await this.calculateUserUpkeep(userId);
      
      // Calculer les revenus horaires du joueur
      const cities = await this.City.findAll({
        where: { user_id: userId },
        include: [
          {
            model: this.Resource,
            as: 'resources'
          }
        ]
      });

      // Estimation des revenus (simplifié - à affiner avec les bâtiments de production)
      let hourlyIncome = {
        gold: 0,
        metal: 0,
        fuel: 0
      };

      // TODO: Calculer les revenus réels depuis les bâtiments de production
      // Pour l'instant, estimation basique
      cities.forEach(city => {
        hourlyIncome.gold += 50; // Base income
        hourlyIncome.metal += 30;
        hourlyIncome.fuel += 20;
      });

      const netIncome = {
        gold: hourlyIncome.gold - upkeep.gold,
        metal: hourlyIncome.metal - upkeep.metal,
        fuel: hourlyIncome.fuel - upkeep.fuel
      };

      const upkeepPercentage = {
        gold: hourlyIncome.gold > 0 ? (upkeep.gold / hourlyIncome.gold) * 100 : 0,
        metal: hourlyIncome.metal > 0 ? (upkeep.metal / hourlyIncome.metal) * 100 : 0,
        fuel: hourlyIncome.fuel > 0 ? (upkeep.fuel / hourlyIncome.fuel) * 100 : 0
      };

      return {
        upkeep,
        hourlyIncome,
        netIncome,
        upkeepPercentage,
        isAffordable: netIncome.gold >= 0 && netIncome.metal >= 0 && netIncome.fuel >= 0,
        warning: upkeepPercentage.gold > 80 || upkeepPercentage.metal > 80 || upkeepPercentage.fuel > 80
      };
    });
  }
}

module.exports = UpkeepService;
