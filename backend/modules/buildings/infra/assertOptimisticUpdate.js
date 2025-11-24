function assertOptimisticUpdate(updatedRows) {
  if (!updatedRows) {
    const error = new Error('Conflit concurrent détecté, veuillez réessayer.');
    error.status = 409;
    throw error;
  }
}

module.exports = assertOptimisticUpdate;