const sequelize = require('../../../db');

const transactionProvider = async (handler) => sequelize.transaction(handler);

module.exports = { transactionProvider };