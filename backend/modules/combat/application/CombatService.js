const { runWithContext } = require('../../../utils/logger');
const combatRules = require('../domain/combatRules');
const worldRules = require('../../world/domain/worldRules');
const NotificationService = require('../../../services/NotificationService');

/**
 * CombatService - Gestion des combats territoriaux et espionnage
 */
class CombatService {
  constructor({ combatRepository, City, Unit, Resource, Building, Research, sequelize }) {
    this.combatRepository = combatRepository;
    this.City = City;
    this.Unit = Unit;
    this.Resource = Resource;
    this.Building = Building;
    this.Research = Research;
    this.sequelize = sequelize;
  }

  /**
   * Lancer une attaque sur une ville ennemie
   */
  async launchAttack(userId, attackData) {
    return runWithContext(async () => {
      const { attackerCityId, defenderCityId, attackType, units } = attackData;

      const transaction = await this.sequelize.transaction();

      try {
        // 1. Vérifications de base
        const attackerCity = await this.City.findByPk(attackerCityId, { transaction });
        const defenderCity = await this.City.findByPk(defenderCityId, { transaction });

        if (!attackerCity || attackerCity.user_id !== userId) {
          throw new Error('Ville attaquante invalide');
        }

        if (!defenderCity) {
          throw new Error('Ville cible introuvable');
        }

        if (defenderCity.user_id === userId) {
          throw new Error('Impossible d\'attaquer sa propre ville');
        }

        // 2. Calculer la distance
        const distance = worldRules.calculateDistance(
          attackerCity.coord_x,
          attackerCity.coord_y,
          defenderCity.coord_x,
          defenderCity.coord_y
        );

        // 3. Vérifier et déduire les unités
        const waves = [];
        for (const unitData of units) {
          const unit = await this.Unit.findOne({
            where: {
              city_id: attackerCityId,
              entity_id: unitData.entityId
            },
            transaction
          });

          if (!unit || unit.quantity < unitData.quantity) {
            throw new Error(`Unités insuffisantes: ${unitData.entityId}`);
          }

          // Déduire les unités
          unit.quantity -= unitData.quantity;
          await unit.save({ transaction });

          waves.push({
            unit_entity_id: unitData.entityId,
            quantity: unitData.quantity
          });
        }

        // 4. Calculer le temps de trajet
        const travelTime = combatRules.calculateTravelTime(distance);
        const departureTime = new Date();
        const arrivalTime = new Date(departureTime.getTime() + travelTime * 1000);

        // 5. Créer l'attaque
        const attack = await this.combatRepository.createAttack(
          {
            attacker_user_id: userId,
            attacker_city_id: attackerCityId,
            defender_user_id: defenderCity.user_id,
            defender_city_id: defenderCityId,
            attack_type: attackType,
            status: 'traveling',
            departure_time: departureTime,
            arrival_time: arrivalTime,
            distance
          },
          waves,
          transaction
        );

        await transaction.commit();

        // Notification temps réel
        NotificationService.notifyAttackLaunched(userId, defenderCity.user_id, {
          attackId: attack.id,
          attackerCityName: attackerCity.name,
          defenderCityName: defenderCity.name,
          attackType,
          arrivalTime,
          distance
        });

        return {
          attackId: attack.id,
          arrivalTime,
          distance,
          travelTime
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Résoudre un combat (appelé par le worker)
   */
  async resolveCombat(attackId) {
    return runWithContext(async () => {
      const transaction = await this.sequelize.transaction();

      try {
        // 1. Charger l'attaque avec toutes les données
        const attack = await this.combatRepository.getAttackById(attackId, true);

        if (!attack || attack.status !== 'arrived') {
          throw new Error('Attaque invalide ou déjà traitée');
        }

        // 2. Récupérer les unités défensives
        const defenderUnits = await this.combatRepository.getCityUnits(attack.defender_city_id);

        // 3. Récupérer les bonus technologiques
        const attackerResearches = await this.Research.findAll({
          where: { user_id: attack.attacker_user_id },
          include: ['entity']
        });

        const defenderResearches = await this.Research.findAll({
          where: { user_id: attack.defender_user_id },
          include: ['entity']
        });

        const attackerTechBonus = combatRules.calculateTechBonus(
          attackerResearches,
          ['Tactiques Militaires', 'Armement Avancé']
        );

        const defenderTechBonus = combatRules.calculateTechBonus(
          defenderResearches,
          ['Tactiques Défensives', 'Fortifications']
        );

        // 4. Bonus des murailles
        const walls = await this.Building.findOne({
          where: { city_id: attack.defender_city_id },
          include: [{
            model: this.sequelize.models.Entity,
            as: 'entity',
            where: { name: 'Murailles' }
          }],
          transaction
        });

        const wallsBonus = walls ? combatRules.calculateWallsBonus(walls.level) : 0;

        // 5. Calculer les forces
        const attackerStrength = combatRules.calculateArmyStrength(attack.waves) * (1 + attackerTechBonus);
        const defenderStrength = defenderUnits.reduce((total, unit) => {
          return total + (unit.entity.attack_power || 1) * unit.quantity;
        }, 0) * (1 + defenderTechBonus);

        // 6. Simuler le combat
        const combatResult = combatRules.simulateCombat(
          attackerStrength,
          defenderStrength,
          wallsBonus
        );

        // 7. Calculer les pertes
        const attackerLosses = combatRules.calculateLosses(
          attack.waves,
          attackerStrength - combatResult.finalAttackerStrength,
          attackerStrength
        );

        // Mettre à jour les survivants des vagues
        for (const wave of attack.waves) {
          await this.sequelize.models.AttackWave.update(
            { survivors: wave.survivors },
            { where: { id: wave.id }, transaction }
          );
        }

        // Pertes défenseur
        const defenderLosses = {};
        const defStrLost = defenderStrength - combatResult.finalDefenderStrength;
        for (const unit of defenderUnits) {
          const lossRate = defStrLost / defenderStrength;
          const losses = Math.floor(unit.quantity * lossRate);
          defenderLosses[unit.entity_id] = losses;
          unit.quantity -= losses;
          await unit.save({ transaction });
        }

        // 8. Butin si victoire attaquant
        let loot = { gold: 0, metal: 0, fuel: 0 };
        if (combatResult.outcome === 'attacker_victory') {
          const defenderResources = await this.Resource.findOne({
            where: { city_id: attack.defender_city_id },
            transaction
          });

          loot = combatRules.calculateLoot(defenderResources, attack.attack_type);

          // Déduire des ressources du défenseur
          defenderResources.gold = Math.max(0, defenderResources.gold - loot.gold);
          defenderResources.metal = Math.max(0, defenderResources.metal - loot.metal);
          defenderResources.fuel = Math.max(0, defenderResources.fuel - loot.fuel);
          await defenderResources.save({ transaction });

          // Ajouter au pillard (quand les troupes reviennent)
          // TODO: Implémenter le retour des troupes avec le butin
        }

        // 9. Mettre à jour l'attaque
        await this.combatRepository.updateAttackStatus(
          attackId,
          'completed',
          {
            outcome: combatResult.outcome,
            loot_gold: loot.gold,
            loot_metal: loot.metal,
            loot_fuel: loot.fuel,
            attacker_losses: attackerLosses,
            defender_losses: defenderLosses
          },
          transaction
        );

        // 10. Créer le rapport de combat
        await this.combatRepository.createDefenseReport(
          {
            attack_id: attackId,
            combat_rounds: combatResult.rounds.length,
            combat_log: combatResult.rounds,
            initial_attacker_strength: attackerStrength,
            initial_defender_strength: defenderStrength,
            final_attacker_strength: combatResult.finalAttackerStrength,
            final_defender_strength: combatResult.finalDefenderStrength,
            defender_walls_bonus: wallsBonus,
            attacker_tech_bonus: attackerTechBonus,
            defender_tech_bonus: defenderTechBonus
          },
          transaction
        );

        await transaction.commit();

        // Notification temps réel du résultat
        NotificationService.notifyAttackArrived(
          attack.attacker_user_id,
          attack.defender_user_id,
          {
            outcome: combatResult.outcome,
            attackId,
            attackerCityName: attack.attackerCity.name,
            defenderCityName: attack.defenderCity.name,
            loot,
            attackerLosses,
            defenderLosses
          }
        );

        return {
          outcome: combatResult.outcome,
          loot,
          attackerLosses,
          defenderLosses
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Lancer une mission d'espionnage
   */
  async launchSpyMission(userId, missionData) {
    return runWithContext(async () => {
      const { spyCityId, targetCityId, spyCount, missionType } = missionData;

      const transaction = await this.sequelize.transaction();

      try {
        // 1. Vérifications
        const spyCity = await this.City.findByPk(spyCityId, { transaction });
        const targetCity = await this.City.findByPk(targetCityId, { transaction });

        if (!spyCity || spyCity.user_id !== userId) {
          throw new Error('Ville d\'origine invalide');
        }

        if (!targetCity) {
          throw new Error('Ville cible introuvable');
        }

        // 2. Vérifier les espions disponibles
        const spyEntity = await this.sequelize.models.Entity.findOne({
          where: { name: 'Espion', type: 'unit' }
        });

        if (!spyEntity) {
          throw new Error('Type d\'unité "Espion" introuvable');
        }

        const spyUnit = await this.Unit.findOne({
          where: { city_id: spyCityId, entity_id: spyEntity.id },
          transaction
        });

        if (!spyUnit || spyUnit.quantity < spyCount) {
          throw new Error('Espions insuffisants');
        }

        // 3. Déduire les espions
        spyUnit.quantity -= spyCount;
        await spyUnit.save({ transaction });

        // 4. Calculer distance et temps de trajet
        const distance = worldRules.calculateDistance(
          spyCity.coord_x,
          spyCity.coord_y,
          targetCity.coord_x,
          targetCity.coord_y
        );

        const travelTime = combatRules.calculateTravelTime(distance) * 0.5; // Espions 2x plus rapides
        const departureTime = new Date();
        const arrivalTime = new Date(departureTime.getTime() + travelTime * 1000);

        // 5. Créer la mission
        const mission = await this.combatRepository.createSpyMission(
          {
            spy_user_id: userId,
            spy_city_id: spyCityId,
            target_user_id: targetCity.user_id,
            target_city_id: targetCityId,
            spy_count: spyCount,
            mission_type: missionType,
            status: 'traveling',
            departure_time: departureTime,
            arrival_time: arrivalTime,
            distance
          },
          transaction
        );

        await transaction.commit();

        // Notification espionnage lancé
        NotificationService.notifySpyMissionLaunched(userId, {
          missionId: mission.id,
          targetCityName: targetCity.name,
          missionType,
          arrivalTime,
          distance
        });

        return {
          missionId: mission.id,
          arrivalTime,
          distance
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Résoudre une mission d'espionnage (appelé par le worker)
   */
  async resolveSpyMission(missionId) {
    return runWithContext(async () => {
      const transaction = await this.sequelize.transaction();

      try {
        const mission = await this.combatRepository.getSpyMissionById(missionId);

        if (!mission || mission.status !== 'traveling') {
          throw new Error('Mission invalide');
        }

        // 1. Niveau de contre-espionnage de la cible
        const counterIntelBuilding = await this.Building.findOne({
          where: { city_id: mission.target_city_id },
          include: [{
            model: this.sequelize.models.Entity,
            as: 'entity',
            where: { name: 'Centre de Renseignement' }
          }],
          transaction
        });

        const counterIntelLevel = counterIntelBuilding ? counterIntelBuilding.level : 0;

        // 2. Calculer taux de succès et détection
        const detected = combatRules.isSpyMissionDetected(counterIntelLevel);
        const successRate = combatRules.calculateSpySuccessRate(
          mission.spy_count,
          counterIntelLevel,
          mission.mission_type
        );

        const success = Math.random() < successRate;

        // 3. Collecter des informations si succès
        let intelData = null;
        if (success) {
          const targetResources = await this.Resource.findOne({
            where: { city_id: mission.target_city_id },
            transaction
          });

          intelData = {
            resources: mission.mission_type !== 'sabotage' ? {
              gold: Math.floor(targetResources.gold * 0.9), // Approximation
              metal: Math.floor(targetResources.metal * 0.9),
              fuel: Math.floor(targetResources.fuel * 0.9)
            } : null
          };

          if (mission.mission_type === 'military_intel') {
            const targetUnits = await this.combatRepository.getCityUnits(mission.target_city_id);
            intelData.units = targetUnits.map(u => ({
              name: u.entity.name,
              quantity: Math.floor(u.quantity * 0.85) // Approximation
            }));
          }
        }

        // 4. Calculer pertes d'espions
        const spiesLost = combatRules.calculateSpyLosses(mission.spy_count, successRate, detected);

        // 5. Mettre à jour la mission
        await this.combatRepository.updateSpyMission(
          missionId,
          {
            status: success ? 'completed' : 'failed',
            success_rate: successRate,
            intel_data: intelData,
            spies_lost: spiesLost,
            detected
          },
          transaction
        );

        await transaction.commit();

        // Notifications
        NotificationService.notifySpyMissionCompleted(mission.spy_user_id, {
          success,
          detected,
          intelData,
          spiesLost,
          targetCityName: mission.targetCity.name
        });

        if (detected) {
          NotificationService.notifySpyMissionDetected(mission.target_user_id, {
            cityName: mission.targetCity.name,
            spiesLost,
            missionType: mission.mission_type
          });
        }

        return { success, detected, intelData, spiesLost };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Récupérer les attaques d'un utilisateur
   */
  async getUserAttacks(userId, filters) {
    return this.combatRepository.getUserAttacks(userId, filters);
  }

  /**
   * Récupérer les missions d'espionnage d'un utilisateur
   */
  async getUserSpyMissions(userId, filters) {
    return this.combatRepository.getUserSpyMissions(userId, filters);
  }

  /**
   * Récupérer un rapport de combat
   */
  async getCombatReport(attackId) {
    return this.combatRepository.getDefenseReport(attackId);
  }

  /**
   * Annuler une attaque en cours
   */
  async cancelAttack(userId, attackId) {
    return runWithContext(async () => {
      const transaction = await this.sequelize.transaction();

      try {
        const attack = await this.combatRepository.getAttackById(attackId);

        if (!attack || attack.attacker_user_id !== userId) {
          throw new Error('Attaque introuvable ou non autorisée');
        }

        if (attack.status !== 'traveling') {
          throw new Error('Impossible d\'annuler cette attaque');
        }

        // Rembourser 50% des unités
        for (const wave of attack.waves) {
          const refundQuantity = Math.floor(wave.quantity * 0.5);
          const unit = await this.Unit.findOne({
            where: {
              city_id: attack.attacker_city_id,
              entity_id: wave.unit_entity_id
            },
            transaction
          });

          if (unit) {
            unit.quantity += refundQuantity;
            await unit.save({ transaction });
          }
        }

        await this.combatRepository.cancelAttack(attackId, transaction);
        await transaction.commit();

        return { success: true };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }
}

module.exports = CombatService;
