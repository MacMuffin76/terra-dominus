const { Op } = require('sequelize');
const crypto = require('crypto');
const { getLogger } = require('../utils/logger');

const DAILY_EUR_LIMIT = 50000; // stored in cents
const currencyToEuroRate = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17
};

class ShopService {
  constructor({ ShopItem, PaymentIntent, UserTransaction, sequelize }) {
    this.ShopItem = ShopItem;
    this.PaymentIntent = PaymentIntent;
    this.UserTransaction = UserTransaction;
    this.sequelize = sequelize;
    this.logger = getLogger({ module: 'ShopService' });
  }

  static convertToEur(amountCents, currency) {
    const rate = currencyToEuroRate[currency] || 1;
    return Math.round(amountCents * (1 / rate));
  }

  async listActiveItems() {
    return this.ShopItem.findAll({ where: { active: true }, order: [['name', 'ASC']] });
  }

  async assertDailyLimit(userId, newAmountCents, currency) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const transactions = await this.UserTransaction.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: twentyFourHoursAgo },
        status: { [Op.in]: ['pending', 'succeeded'] }
      }
    });

    const existingTotal = transactions.reduce((sum, tx) => {
      return sum + ShopService.convertToEur(tx.amountCents, tx.currency);
    }, 0);
    const incoming = ShopService.convertToEur(newAmountCents, currency);
    if (existingTotal + incoming > DAILY_EUR_LIMIT) {
      throw new Error('Daily purchase limit exceeded (500€ / 24h).');
    }
  }

  async startPurchase({ user, itemId, quantity, idempotencyKey, requesterIp, userAgent, consentVersion, legalDocuments }) {
    const item = await this.ShopItem.findByPk(itemId);
    if (!item || !item.active) {
      throw new Error('Item unavailable');
    }
    if (item.inventory < quantity) {
      throw new Error('Not enough inventory for this item');
    }

    const amountCents = item.priceCents * quantity;
    await this.assertDailyLimit(user.id, amountCents, item.currency);

    const key = idempotencyKey || crypto.randomUUID();
    const transaction = await this.sequelize.transaction();
    try {
      const paymentIntent = await this.PaymentIntent.create({
        userId: user.id,
        shopItemId: item.id,
        amountCents,
        currency: item.currency,
        status: 'requires_payment_method',
        idempotencyKey: key,
        requesterIp,
        userAgent,
        consentVersion,
        legalDocuments
      }, { transaction });

      const userTransaction = await this.UserTransaction.create({
        userId: user.id,
        paymentIntentId: paymentIntent.id,
        shopItemId: item.id,
        quantity,
        amountCents,
        currency: item.currency,
        status: 'pending'
      }, { transaction });

      item.inventory -= quantity;
      await item.save({ transaction });

      await transaction.commit();

      return { paymentIntent, userTransaction };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async markPaymentResult(intentId, status, failureReason) {
    const paymentIntent = await this.PaymentIntent.findByPk(intentId);
    if (!paymentIntent) return null;

    paymentIntent.status = status;
    if (failureReason) {
      paymentIntent.failureReason = failureReason;
    }
    await paymentIntent.save();

    await this.UserTransaction.update(
      { status: status === 'succeeded' ? 'succeeded' : 'failed', failureReason },
      { where: { paymentIntentId: intentId } }
    );

    return paymentIntent;
  }
}

module.exports = ShopService;