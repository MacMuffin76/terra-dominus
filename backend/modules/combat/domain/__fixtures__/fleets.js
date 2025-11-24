const fastAttackFleet = {
  id: 'alpha',
  ownerId: 1,
  originCityId: 10,
  targetCityId: 20,
  squads: [
    { unitType: 'Interceptor', attack: 12, defense: 4, initiative: 8, count: 10 },
    { unitType: 'Bomber', attack: 25, defense: 6, initiative: 4, count: 4 },
  ],
};

const sturdyDefenseFleet = {
  id: 'beta',
  ownerId: 2,
  originCityId: 20,
  targetCityId: 10,
  squads: [
    { unitType: 'Guardian', attack: 8, defense: 10, initiative: 3, count: 8 },
    { unitType: 'Sentinel', attack: 6, defense: 8, initiative: 5, count: 6 },
  ],
};

const attritionFleet = {
  id: 'gamma',
  ownerId: 3,
  originCityId: 15,
  targetCityId: 25,
  squads: [
    { unitType: 'Skirmisher', attack: 2, defense: 5, initiative: 6, count: 3 },
  ],
};

const fortifiedFleet = {
  id: 'delta',
  ownerId: 4,
  originCityId: 25,
  targetCityId: 15,
  squads: [
    { unitType: 'Bulwark', attack: 3, defense: 15, initiative: 2, count: 2 },
  ],
};

module.exports = {
  fastAttackFleet,
  sturdyDefenseFleet,
  attritionFleet,
  fortifiedFleet,
};