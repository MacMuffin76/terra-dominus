const { runWithContext } = require('../../../utils/logger');
const combatRules = require('../domain/combatRules');
const worldRules = require('../../world/domain/worldRules');
const NotificationService = require('../../../services/NotificationService');
const protectionRules = require('../../protection/domain/protectionRules');
const pvpBalancingRules = require('../domain/pvpBalancingRules');
const User = require('../../../models/User');

/**
 * CombatService - Gestion des combats territoriaux et espionnage
 */
class CombatService {
  constructor({ combatRepository, City, Unit, Resource, Building, Research, sequelize, playerPowerService }) {
    this.combatRepository = combatRepository;
    this.City = City;
    this.Unit = Unit;
    this.Resource = Resource;
    this.Building = Building;
    this.Research = Research;
    this.sequelize = sequelize;
    this.playerPowerService = playerPowerService;
  }

  /**
   * Lancer une attaque sur une ville ennemie
   */
  async launchAttack(userId, attackData) {
    return runWithContext(async () => {
      const {
        attackerCityId: directAttackerCityId,
        defenderCityId: directDefenderCityId,
        fromCityId,
        toCityId,
        attackType,
        units,
        formation = 'line',
        speedFactor = 1
      } = attackData;

      const attackerCityId = directAttackerCityId ?? fromCityId;
      const defenderCityId = directDefenderCityId ?? toCityId;

      if (!attackerCityId || !defenderCityId) {
        throw new Error('Ville attaquante ou cible manquante');
      }

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

        // 1.5 Protection Shield Checks
        const attacker = await User.findByPk(userId, { transaction });
        const defender = await User.findByPk(defenderCity.user_id, { transaction });

        if (!attacker || !defender) {
          throw new Error('Utilisateur introuvable');
        }

        // Check if defender has active shield
        const attackCheck = protectionRules.canAttack(attacker, defender);
        if (!attackCheck.canAttack) {
          throw new Error(attackCheck.reason);
        }

        // Check daily attack limit
        const attacksToday = await this.combatRepository.countUserAttacksToday(userId);
        const dailyLimit = protectionRules.checkDailyAttackLimit(attacksToday);
        if (!dailyLimit.canAttack) {
          throw new Error(dailyLimit.reason);
        }

        // Check raid cooldown on this specific target
        const lastAttackOnTarget = await this.combatRepository.getLastAttackOnTarget(
          userId,
          defenderCity.user_id
        );
        const raidCheck = protectionRules.canRaidTarget(lastAttackOnTarget?.arrival_time);
        if (!raidCheck.canAttack) {
          throw new Error(raidCheck.reason);
        }

        // 1.6 PvP Balancing - Calculate power and check for weak target penalty
        let attackerPower = 0;
        let defenderPower = 0;
        let costModifier = null;
        let rewardModifier = null;
        
        if (this.playerPowerService) {
          try {
            attackerPower = await this.playerPowerService.getPlayerPower(userId);
            defenderPower = await this.playerPowerService.getPlayerPower(defenderCity.user_id);
            
            // Calculate cost modifier (penalty for attacking weak targets)
            costModifier = pvpBalancingRules.calculateAttackCostModifier(attackerPower, defenderPower);
            
            // Calculate reward modifier (for later use in resolveCombat)
            rewardModifier = pvpBalancingRules.calculateRewardModifier(attackerPower, defenderPower);
            
            // Apply gold penalty if attacking weak target
            if (costModifier.isWeakTarget && costModifier.goldPenalty > 0) {
              const attackerResources = await this.Resource.findOne({
                where: { city_id: attackerCityId },
                transaction
              });
              
              if (!attackerResources || attackerResources.gold < costModifier.goldPenalty) {
                throw new Error(
                  `Attaquer un joueur plus faible nécessite ${costModifier.goldPenalty} gold. ` +
                  `${costModifier.message}`
                );
              }
              
              // Deduct gold penalty
              attackerResources.gold -= costModifier.goldPenalty;
              await attackerResources.save({ transaction });
              
              console.log(`⚖️ PvP Balancing: Gold penalty applied (${costModifier.goldPenalty} gold) for weak target attack`);
            }
            
            console.log('⚖️ PvP Balancing:', {
              attackerPower,
              defenderPower,
              powerRatio: (defenderPower / attackerPower).toFixed(2),
              costMultiplier: costModifier.costMultiplier,
              isWeakTarget: costModifier.isWeakTarget,
              rewardMultiplier: rewardModifier.rewardMultiplier
            });
          } catch (error) {
            console.error('⚠️ PvP Balancing calculation failed, proceeding without penalties:', error.message);
          }
        }

        // 2. Calculer la distance
        const distance = worldRules.calculateDistance(
          attackerCity.coord_x,
          attackerCity.coord_y,
          defenderCity.coord_x,
          defenderCity.coord_y
        );

        // 2.5 Calculer les coûts d'attaque (fuel + food basés sur distance et nombre d'unités)
        let totalUnitCount = 0;
        units.forEach(u => totalUnitCount += u.quantity);
        
        // Coût de base: 1 fuel et 2 food par unité par tile de distance
        const baseFuelCost = Math.ceil(totalUnitCount * distance * 1);
        const baseFoodCost = Math.ceil(totalUnitCount * distance * 2);
        
        // Appliquer le multiplicateur PvP si cible faible
        const finalFuelCost = costModifier?.isWeakTarget 
          ? Math.ceil(baseFuelCost * costModifier.costMultiplier) 
          : baseFuelCost;
        const finalFoodCost = costModifier?.isWeakTarget 
          ? Math.ceil(baseFoodCost * costModifier.costMultiplier) 
          : baseFoodCost;

        // Vérifier et déduire les ressources d'attaque
        const attackerResources = await this.Resource.findOne({
          where: { city_id: attackerCityId },
          transaction
        });

        if (!attackerResources) {
          throw new Error('Ressources de la ville introuvables');
        }

        // Note: "fuel" = "carburant", "food" pourrait être représenté par "metal" ou on l'ignore si pas dans le modèle
        if (attackerResources.fuel < finalFuelCost) {
          throw new Error(
            `Carburant insuffisant pour cette attaque. ` +
            `Requis: ${finalFuelCost}, Disponible: ${attackerResources.fuel}` +
            (costModifier?.isWeakTarget ? ` (Pénalité x${costModifier.costMultiplier} pour attaque sur cible faible)` : '')
          );
        }

        // Déduire le carburant (et possiblement metal comme "nourriture" si le modèle le supporte)
        attackerResources.fuel -= finalFuelCost;
        // Si votre modèle a un champ "food", déduisez-le ici. Sinon, utilisez metal comme proxy:
        // attackerResources.metal -= finalFoodCost;
        await attackerResources.save({ transaction });

        if (costModifier?.isWeakTarget) {
          console.log(`⚖️ PvP Balancing: Attack cost scaling applied`, {
            baseFuelCost,
            finalFuelCost,
            costMultiplier: costModifier.costMultiplier,
            goldPenalty: costModifier.goldPenalty,
            totalPenalty: finalFuelCost - baseFuelCost + costModifier.goldPenalty
          });
        }

        // 3. Vérifier et déduire les unités
        const waves = [];
        for (const unitData of units) {
          const unit = await this.Unit.findOne({
            where: {
              id: unitData.entityId,
              city_id: attackerCityId
            },
            transaction
          });

          if (!unit || unit.quantity < unitData.quantity) {
            throw new Error(`Unités insuffisantes: ${unit?.name || unitData.entityId} (disponible: ${unit?.quantity || 0}, demandé: ${unitData.quantity})`);
          }

          // Déduire les unités
          unit.quantity -= unitData.quantity;
          await unit.save({ transaction });

          waves.push({
            unit_entity_id: unit.id,
            quantity: unitData.quantity,
            unitEntity: unit // Inclure les infos de l'unité pour les calculs de combat
          });
        }

        // 4. Calculer le temps de trajet (impacté par speedFactor)
        const travelTime = combatRules.calculateTravelTime(distance, speedFactor);
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
            distance,
            // Store PvP balancing + tactical data (formation, vitesse) for resolveCombat
            metadata: JSON.stringify({
              attackerPower,
              defenderPower,
              costMultiplier: costModifier?.costMultiplier ?? 1,
              rewardMultiplier: rewardModifier?.rewardMultiplier ?? 1,
              isWeakTarget: costModifier?.isWeakTarget ?? false,
              formation,
              speedFactor
            })
          },
          waves,
          transaction
        );

        // 6. Remove attacker's shield if active (aggressive behavior)
        if (protectionRules.hasActiveShield(attacker)) {
          attacker.protection_shield_until = null;
          await attacker.save({ transaction });
        }

        // 7. Increment attacks sent count
        attacker.attacks_sent_count += 1;
        await attacker.save({ transaction });

        // 8. Check if defender should lose shield (city count check)
        const defenderCityCount = await this.City.count({
          where: { user_id: defender.id },
          transaction
        });
        const shieldCheck = protectionRules.shouldLoseShield(defender, defenderCityCount);
        if (shieldCheck.shouldLoseShield && defender.protection_shield_until) {
          defender.protection_shield_until = null;
          await defender.save({ transaction });
        }

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

        // 5. Calculer les forces avec système de counters
        const strengthCalc = combatRules.calculateArmyStrengthWithCounters(
          attack.waves,
          defenderUnits
        );

        // Lire les métadonnées (formation, vitesse, PvP) éventuelles
        let metadata = null;
        let formation = 'line';
        try {
          if (attack.metadata) {
            // metadata peut être une string JSON ou un objet JS selon la source
            const raw = typeof attack.metadata === 'string'
              ? attack.metadata
              : JSON.stringify(attack.metadata);
            metadata = JSON.parse(raw);
            if (metadata.formation) {
              formation = metadata.formation;
            }
          }
        } catch (error) {
          console.error('⚠️ Failed to parse attack metadata for formation:', error.message);
        }

        // Apply tech bonuses
        let attackerStrength = strengthCalc.attackerStrength * (1 + attackerTechBonus);
        let defenderStrength = strengthCalc.defenderStrength * (1 + defenderTechBonus);

        // Appliquer les bonus/malus de formation (feeling AAA-lite)
        const formationMultipliers = {
          line:   { attacker: 1.0,  defender: 1.0 },   // Équilibré par défaut
          wedge:  { attacker: 1.15, defender: 0.9 },   // Formation en coin : attaque forte, défense plus fragile
          echelon:{ attacker: 0.95, defender: 1.1 }    // Échelon : plus défensif, attaque un peu réduite
        };
        const fm = formationMultipliers[formation] || formationMultipliers.line;
        attackerStrength *= fm.attacker;
        defenderStrength *= fm.defender;

        console.log('⚔️  Combat strength calculated:', {
          attacker: attackerStrength,
          defender: defenderStrength,
          formation,
          formationMultipliers: fm,
          counterBonuses: strengthCalc.counterBonuses,
          techBonuses: { attacker: attackerTechBonus, defender: defenderTechBonus },
          wallsBonus
        });

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
          defenderLosses[unit.id] = losses;
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
          
          // Apply PvP balancing reward scaling (en s'appuyant sur les métadonnées lues plus haut)
          let rewardMultiplier = 1.0;
          try {
            if (metadata && metadata.rewardMultiplier) {
              rewardMultiplier = metadata.rewardMultiplier || 1.0;
              
              // Apply scaling to loot
              const scaledLoot = pvpBalancingRules.applyRewardScaling(loot, { rewardMultiplier });
              loot = scaledLoot.scaled;
              
              console.log('⚖️ PvP Balancing: Reward scaling applied', {
                original: scaledLoot.original,
                scaled: scaledLoot.scaled,
                multiplier: rewardMultiplier,
                isWeakTarget: metadata.isWeakTarget,
                formation: metadata.formation,
                speedFactor: metadata.speedFactor
              });
            }
          } catch (error) {
            console.error('⚠️ Failed to apply reward scaling:', error.message);
          }

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

        // Invalidate power cache for both players (units lost affect power)
        if (this.playerPowerService) {
          try {
            await this.playerPowerService.invalidateCache(attack.attacker_user_id);
            await this.playerPowerService.invalidateCache(attack.defender_user_id);
            console.log('⚖️ PvP Balancing: Power cache invalidated for both players');
          } catch (error) {
            console.error('⚠️ Failed to invalidate power cache:', error.message);
          }
        }
        
        // Mettre à jour les leaderboards
        const leaderboardIntegration = require('../../../utils/leaderboardIntegration');
        
        // Si victoire de l'attaquant, incrémenter son score de victoires
        if (combatResult.outcome === 'attacker_victory') {
          leaderboardIntegration.incrementCombatVictories(attack.attacker_user_id, 1).catch(err => {
            this.logger.error('Error updating combat victories leaderboard:', err);
          });
          
          // Grant Battle Pass XP for victory
          const battlePassService = require('../../battlepass/application/BattlePassService');
          battlePassService.addXP(attack.attacker_user_id, 100).catch(err => {
            this.logger.error('Failed to grant Battle Pass XP for combat victory:', err);
          });
        }
        
        // Check for achievement unlocks
        const achievementChecker = require('../../../utils/achievementChecker');
        achievementChecker.checkCombatAchievements(attack.attacker_user_id, combatResult)
          .catch(err => this.logger.error('Failed to check combat achievements:', err));
        
        // Mettre à jour la puissance totale des deux joueurs (unités perdues)
        leaderboardIntegration.updateTotalPower(attack.attacker_user_id).catch(err => {
          this.logger.error('Error updating attacker total power:', err);
        });
        leaderboardIntegration.updateTotalPower(attack.defender_user_id).catch(err => {
          this.logger.error('Error updating defender total power:', err);
        });

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
        const spyUnit = await this.Unit.findOne({
          where: { city_id: spyCityId, name: 'Espion' },
          transaction
        });

        if (!spyUnit || spyUnit.quantity < spyCount) {
          throw new Error(`Espions insuffisants (disponible: ${spyUnit?.quantity || 0}, demandé: ${spyCount})`);
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
   * Applique une dégradation temporelle de la précision du rapport
   */
  async getUserSpyMissions(userId, filters) {
    const missions = await this.combatRepository.getUserSpyMissions(userId, filters);

    return missions.map((mission) => {
      const plain = typeof mission.toJSON === 'function' ? mission.toJSON() : mission;

      const decay = combatRules.calculateIntelDecay(
        plain.success_rate,
        plain.arrival_time
      );

      const result = {
        ...plain,
        // success_rate reflète la fiabilité actuelle du rapport
        success_rate: decay.effectiveSuccessRate,
        intel_decay: {
          ageHours: decay.ageHours,
          decaySteps: decay.decaySteps,
          isStale: decay.isStale
        }
      };

      // Si le rapport est périmé (>24h), on masque les données de renseignement
      if (decay.isStale) {
        result.intel_data = null;
      }

      return result;
    });
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
              id: wave.unit_entity_id,
              city_id: attack.attacker_city_id
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
