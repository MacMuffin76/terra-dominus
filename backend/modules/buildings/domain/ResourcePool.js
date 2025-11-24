const assertOptimisticUpdate = require('../infra/assertOptimisticUpdate');

class ResourcePool {
  constructor(resources = []) {
    this.resources = resources.map((resource) => ({
      ...resource,
      amount: Number(resource.amount) || 0,
      version: Number(resource.version) || 0,
    }));
  }

  getAmount(type) {
    return this.resources.find((r) => r.type === type)?.amount || 0;
  }

  canAfford(costs) {
    return costs.every((cost) => this.getAmount(cost.resource_type) >= Number(cost.amount));
  }

  spend(costs) {
    if (!this.canAfford(costs)) {
      const error = new Error('Ressources insuffisantes pour améliorer');
      error.status = 400;
      throw error;
    }

    return new ResourcePool(this.resources.map((resource) => {
      const cost = costs.find((c) => c.resource_type === resource.type);
      if (!cost) return resource;

      return {
        ...resource,
        amount: resource.amount - Number(cost.amount),
        version: resource.version + 1,
      };
    }));
  }

  async persist(resourceRepository, transaction) {
    for (const resource of this.resources) {
      const affected = await resourceRepository.update(resource, transaction);
      assertOptimisticUpdate(affected);
    }
  }
}

module.exports = ResourcePool;