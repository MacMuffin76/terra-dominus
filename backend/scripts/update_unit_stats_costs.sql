-- Update base cost columns in unit_stats table with logical values based on unit stats and training time

UPDATE unit_stats SET
  base_cost_metal = 2 + 3 + 10,
  base_cost_gold = 1 * 10,
  base_cost_fuel = ROUND(30 / 60.0)
WHERE unit_id = 1037;

UPDATE unit_stats SET
  base_cost_metal = 5 + 4 + 20,
  base_cost_gold = 1 * 10,
  base_cost_fuel = ROUND(60 / 60.0)
WHERE unit_id = 1038;

UPDATE unit_stats SET
  base_cost_metal = 6 + 2 + 15,
  base_cost_gold = 1 * 10,
  base_cost_fuel = ROUND(75 / 60.0)
WHERE unit_id = 1039;

UPDATE unit_stats SET
  base_cost_metal = 8 + 5 + 30,
  base_cost_gold = 2 * 10,
  base_cost_fuel = ROUND(120 / 60.0)
WHERE unit_id = 1040;

UPDATE unit_stats SET
  base_cost_metal = 6 + 8 + 25,
  base_cost_gold = 2 * 10,
  base_cost_fuel = ROUND(90 / 60.0)
WHERE unit_id = 1041;

UPDATE unit_stats SET
  base_cost_metal = 12 + 2 + 15,
  base_cost_gold = 2 * 10,
  base_cost_fuel = ROUND(180 / 60.0)
WHERE unit_id = 1042;

UPDATE unit_stats SET
  base_cost_metal = 3 + 4 + 20,
  base_cost_gold = 2 * 10,
  base_cost_fuel = ROUND(150 / 60.0)
WHERE unit_id = 1043;

UPDATE unit_stats SET
  base_cost_metal = 20 + 18 + 100,
  base_cost_gold = 3 * 10,
  base_cost_fuel = ROUND(300 / 60.0)
WHERE unit_id = 1044;

UPDATE unit_stats SET
  base_cost_metal = 15 + 10 + 30,
  base_cost_gold = 3 * 10,
  base_cost_fuel = ROUND(240 / 60.0)
WHERE unit_id = 1045;

UPDATE unit_stats SET
  base_cost_metal = 25 + 8 + 40,
  base_cost_gold = 3 * 10,
  base_cost_fuel = ROUND(600 / 60.0)
WHERE unit_id = 1046;

UPDATE unit_stats SET
  base_cost_metal = 35 + 30 + 200,
  base_cost_gold = 4 * 10,
  base_cost_fuel = ROUND(1800 / 60.0)
WHERE unit_id = 1048;

UPDATE unit_stats SET
  base_cost_metal = 40 + 5 + 60,
  base_cost_gold = 4 * 10,
  base_cost_fuel = ROUND(3600 / 60.0)
WHERE unit_id = 1049;

UPDATE unit_stats SET
  base_cost_metal = 1 + 1 + 5,
  base_cost_gold = 2 * 10,
  base_cost_fuel = ROUND(300 / 60.0)
WHERE unit_id = 1050;
