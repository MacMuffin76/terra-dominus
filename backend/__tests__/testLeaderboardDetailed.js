/**
 * Test with actual error throwing
 */

const { sequelize, User } = require('./models');

async function testWithErrorCapture() {
  try {
    const user = await User.findOne({ where: { id: 78 } });
    if (!user) {
      console.log('User not found');
      await sequelize.close();
      return;
    }

    console.log(`Testing with user: ${user.username} (ID: ${user.id})\n`);

    // Import leaderboardService directly
    const leaderboardService = require('./modules/leaderboard/application/LeaderboardService');
    const { City, Building, Research, Unit, MarketTransaction } = require('./models');
    const { UserAchievement, UserBattlePass, BattlePassSeason } = require('./models');
    const { Op } = require('sequelize');

    // Test 1: Total Power
    console.log('1. Calculating Total Power...');
    try {
      const cities = await City.findAll({
        where: { user_id: user.id },
        attributes: ['id']
      });
      console.log(`   Found ${cities.length} cities`);
      
      const cityIds = cities.map(c => c.id);
      
      let buildingPower = 0;
      if (cityIds.length > 0) {
        const buildings = await Building.findAll({
          where: { city_id: cityIds },
          attributes: ['level']
        });
        console.log(`   Found ${buildings.length} buildings`);
        buildingPower = buildings.reduce((sum, b) => sum + (b.level || 0) * 100, 0);
      }

      const units = await Unit.findAll({ where: { user_id: user.id } });
      console.log(`   Found ${units.length} units`);
      const unitPower = units.reduce((sum, u) => sum + (u.quantity || 0) * 10, 0);

      const totalPower = buildingPower + unitPower;
      console.log(`   Total Power: ${totalPower}`);

      await leaderboardService.updateScore(user.id, 'total_power', totalPower);
      console.log('   ✅ Updated total_power');
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Test 2: Buildings Score
    console.log('\n2. Calculating Buildings Score...');
    try {
      const cities = await City.findAll({
        where: { user_id: user.id },
        attributes: ['id']
      });
      
      const cityIds = cities.map(c => c.id);
      
      let totalLevels = 0;
      if (cityIds.length > 0) {
        const buildings = await Building.findAll({
          where: { city_id: cityIds },
          attributes: ['level']
        });
        totalLevels = buildings.reduce((sum, b) => sum + (b.level || 0), 0);
      }
      console.log(`   Total Building Levels: ${totalLevels}`);

      await leaderboardService.updateScore(user.id, 'buildings', totalLevels);
      console.log('   ✅ Updated buildings');
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Test 3: Research Score
    console.log('\n3. Calculating Research Score...');
    try {
      const researches = await Research.findAll({
        where: { user_id: user.id }
      });
      console.log(`   Found ${researches.length} researches`);
      const totalLevels = researches.reduce((sum, r) => sum + (r.level || 0), 0);
      console.log(`   Total Research Levels: ${totalLevels}`);

      await leaderboardService.updateScore(user.id, 'research', totalLevels);
      console.log('   ✅ Updated research');
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Test 4: Economy Score
    console.log('\n4. Calculating Economy Score...');
    try {
      const transactions = await MarketTransaction.findAll({
        where: {
          [Op.or]: [
            { buyer_id: user.id },
            { seller_id: user.id }
          ]
        }
      });
      console.log(`   Found ${transactions.length} transactions`);
      const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.total_price || 0), 0);
      console.log(`   Total Volume: ${totalVolume}`);

      await leaderboardService.updateScore(user.id, 'economy', Math.floor(totalVolume));
      console.log('   ✅ Updated economy');
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Test 5: Achievements Score
    console.log('\n5. Calculating Achievements Score...');
    try {
      const count = await UserAchievement.count({
        where: { user_id: user.id }
      });
      console.log(`   Found ${count} achievements`);

      await leaderboardService.updateScore(user.id, 'achievements', count);
      console.log('   ✅ Updated achievements');
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Test 6: Battle Pass Score
    console.log('\n6. Calculating Battle Pass Score...');
    try {
      const activeSeason = await BattlePassSeason.findOne({
        where: { is_active: true }
      });
      
      if (!activeSeason) {
        console.log('   No active season');
        await leaderboardService.updateScore(user.id, 'battle_pass', 0);
        console.log('   ✅ Updated battle_pass (score=0)');
      } else {
        const userProgress = await UserBattlePass.findOne({
          where: {
            user_id: user.id,
            season_id: activeSeason.id
          }
        });

        if (!userProgress) {
          console.log('   User not in battle pass');
          await leaderboardService.updateScore(user.id, 'battle_pass', 0);
          console.log('   ✅ Updated battle_pass (score=0)');
        } else {
          const score = userProgress.current_tier * 1000 + userProgress.current_xp;
          console.log(`   Score: ${score} (tier ${userProgress.current_tier}, XP ${userProgress.current_xp})`);
          await leaderboardService.updateScore(user.id, 'battle_pass', score);
          console.log('   ✅ Updated battle_pass');
        }
      }
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Check final results
    const { LeaderboardEntry } = require('./models');
    console.log('\n7. Final Results:');
    const entries = await LeaderboardEntry.findAll({
      where: { user_id: user.id }
    });
    entries.forEach(entry => {
      console.log(`   - ${entry.category}: ${entry.score}`);
    });

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await sequelize.close();
  }
}

testWithErrorCapture();
