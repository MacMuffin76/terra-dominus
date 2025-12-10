'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1) Backfill coordinates from existing city_slots links when missing
      await queryInterface.sequelize.query(
        `UPDATE cities c
         SET coord_x = wg.coord_x, coord_y = wg.coord_y
         FROM city_slots cs
         JOIN world_grid wg ON wg.id = cs.grid_id
         WHERE cs.city_id = c.id AND (c.coord_x IS NULL OR c.coord_y IS NULL)`,
        { transaction }
      );

      // 2) Collect cities needing new coordinates (nulls or duplicates)
      const [duplicateRows] = await queryInterface.sequelize.query(
        `SELECT coord_x, coord_y, array_agg(id ORDER BY id) AS city_ids
         FROM cities
         WHERE coord_x IS NOT NULL AND coord_y IS NOT NULL
         GROUP BY coord_x, coord_y
         HAVING COUNT(*) > 1`,
        { transaction }
      );

      const citiesToReassign = new Set();
      for (const row of duplicateRows) {
        // keep the first city in place
        row.city_ids.slice(1).forEach((cityId) => citiesToReassign.add(cityId));
      }

      const [missingRows] = await queryInterface.sequelize.query(
        `SELECT id FROM cities WHERE coord_x IS NULL OR coord_y IS NULL`,
        { transaction }
      );

      missingRows.forEach(({ id }) => citiesToReassign.add(id));

      if (citiesToReassign.size === 0) {
        await transaction.commit();
        return;
      }

      const cityIdsToFix = Array.from(citiesToReassign);

      // Free any slots currently pointing to the affected cities to avoid conflicts
      await queryInterface.sequelize.query(
        `UPDATE city_slots
         SET city_id = NULL,
             status = 'free',
             updated_at = NOW()
         WHERE city_id IN (:cityIds)` ,
        { transaction, replacements: { cityIds: cityIdsToFix } }
      );

      // Prepare existing coordinate set (world grid)
      const [existingCoords] = await queryInterface.sequelize.query(
        `SELECT coord_x, coord_y FROM world_grid FOR UPDATE`,
        { transaction }
      );
      const usedCoords = new Set(existingCoords.map((row) => `${row.coord_x},${row.coord_y}`));

      // Fetch available free slots
      const [freeSlots] = await queryInterface.sequelize.query(
        `SELECT cs.id AS slot_id, wg.coord_x, wg.coord_y
         FROM city_slots cs
         JOIN world_grid wg ON wg.id = cs.grid_id
         WHERE cs.status = 'free' AND cs.city_id IS NULL
         ORDER BY cs.id
         FOR UPDATE`,
        { transaction }
      );

      let freeSlotIndex = 0;

      // Generator for new coordinates when no free slot is available
      let coordCursorX = 0;
      let coordCursorY = 0;
      const getNextNewCoord = () => {
        while (usedCoords.has(`${coordCursorX},${coordCursorY}`)) {
          coordCursorX += 1;
          if (coordCursorX > 100000) {
            coordCursorX = 0;
            coordCursorY += 1;
          }
        }
        const coord = { x: coordCursorX, y: coordCursorY };
        usedCoords.add(`${coord.x},${coord.y}`);
        coordCursorX += 1;
        return coord;
      };

      const assignCityToSlot = async (cityId, slot) => {
        await queryInterface.sequelize.query(
          `UPDATE cities SET coord_x = :x, coord_y = :y WHERE id = :cityId`,
          { transaction, replacements: { x: slot.coord_x, y: slot.coord_y, cityId } }
        );

        await queryInterface.sequelize.query(
          `UPDATE city_slots
           SET city_id = :cityId, status = 'occupied', updated_at = NOW()
           WHERE id = :slotId`,
          { transaction, replacements: { cityId, slotId: slot.slot_id } }
        );
      };

      for (const cityId of cityIdsToFix) {
        let slot = freeSlots[freeSlotIndex];

        if (!slot) {
          // Need to create a new world grid tile + city slot
          const nextCoord = getNextNewCoord();
          const [newGridRows] = await queryInterface.sequelize.query(
            `INSERT INTO world_grid (coord_x, coord_y, terrain_type, has_city_slot, created_at)
             VALUES (:x, :y, 'plains', true, NOW())
             RETURNING id`,
            { transaction, replacements: { x: nextCoord.x, y: nextCoord.y }, type: QueryTypes.INSERT }
          );

          const newGridId = newGridRows[0]?.id || newGridRows; // compatibility depending on dialect

          const [newSlotRows] = await queryInterface.sequelize.query(
            `INSERT INTO city_slots (grid_id, status, city_id, quality, created_at, updated_at)
             VALUES (:gridId, 'free', NULL, 1, NOW(), NOW())
             RETURNING id`,
            { transaction, replacements: { gridId: newGridId }, type: QueryTypes.INSERT }
          );

          const newSlotId = newSlotRows[0]?.id || newSlotRows;
          slot = { slot_id: newSlotId, coord_x: nextCoord.x, coord_y: nextCoord.y };
          usedCoords.add(`${nextCoord.x},${nextCoord.y}`);
        } else {
          freeSlotIndex += 1;
          usedCoords.add(`${slot.coord_x},${slot.coord_y}`);
        }

        await assignCityToSlot(cityId, slot);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down() {
    // Data cleanup is not trivially reversible; no-op
  },
};