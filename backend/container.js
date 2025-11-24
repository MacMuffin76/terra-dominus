class Container {
  constructor() {
    this.registrations = new Map();
    this.cache = new Map();
  }

  register(name, resolver) {
    this.registrations.set(name, resolver);
  }

  resolve(name) {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    if (!this.registrations.has(name)) {
      throw new Error(`Dependency not registered: ${name}`);
    }

    const resolver = this.registrations.get(name);
    const value = resolver(this);
    this.cache.set(name, value);
    return value;
  }
}

const createContainer = () => {
  const container = new Container();

  container.register('resourceService', () => require('./services/resourceService'));
  container.register('buildingService', () => require('./services/buildingService'));
  container.register('userService', () => require('./services/userService'));

  container.register('resourceController', (c) => require('./controllers/resourceController')({ resourceService: c.resolve('resourceService') }));
  container.register('buildingController', (c) => require('./controllers/buildingController')({ buildingService: c.resolve('buildingService') }));
  container.register('authController', (c) => require('./controllers/authController')({ userService: c.resolve('userService') }));

  container.register('facilityController', () => require('./controllers/facilityController'));
  container.register('researchController', () => require('./controllers/researchController'));
  container.register('trainingController', () => require('./controllers/trainingController'));
  container.register('defenseController', () => require('./controllers/defenseController'));
  container.register('unitController', () => require('./controllers/unitController'));
  container.register('dashboardController', () => require('./controllers/dashboardController'));

  return container;
};

module.exports = createContainer;