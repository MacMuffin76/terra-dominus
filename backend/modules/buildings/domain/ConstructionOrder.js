class ConstructionOrder {
  constructor({
    id,
    cityId,
    entityId,
    type,
    status,
    startTime,
    finishTime,
    slot,
  }) {
    this.id = id;
    this.cityId = cityId;
    this.entityId = entityId;
    this.type = type;
    this.status = status;
    this.startTime = startTime ? new Date(startTime) : null;
    this.finishTime = finishTime ? new Date(finishTime) : null;
    this.slot = slot;
  }

  static schedule({ cityId, entityId, type, durationSeconds, lastOrderSlot, lastFinishTime }) {
    const startTime = lastFinishTime ? new Date(lastFinishTime) : new Date();
    const finishTime = new Date(startTime.getTime() + durationSeconds * 1000);
    const slot = (lastOrderSlot || 0) + 1;

    return new ConstructionOrder({
      cityId,
      entityId,
      type,
      status: slot === 1 ? 'in_progress' : 'queued',
      startTime,
      finishTime,
      slot,
    });
  }

  isReady(now = new Date()) {
    return this.finishTime && now >= this.finishTime;
  }

  markCompleted() {
    return new ConstructionOrder({
      ...this,
      status: 'completed',
    });
  }
}

module.exports = ConstructionOrder;