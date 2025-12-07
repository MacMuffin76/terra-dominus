const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const ShopService = require('../services/shopService');
const { getLogger } = require('../utils/logger');
const { getAnalyticsService } = require('../services/analyticsService');
const models = require('../models');

const router = Router();
const logger = getLogger({ module: 'ShopRoutes' });
const analyticsService = getAnalyticsService();
const shopService = new ShopService({
  PaymentIntent: models.PaymentIntent,
  UserTransaction: models.UserTransaction,
  sequelize: models.sequelize
});

router.get('/items', protect, asyncHandler(async (req, res) => {
  const items = await shopService.listActiveItems();
  res.json(items);
}));

router.post('/purchase', protect, asyncHandler(async (req, res) => {
  const { itemId, quantity = 1, idempotencyKey, consentVersion } = req.body;
  const requesterIp = req.ip;
  const userAgent = req.headers['user-agent'];
  const legalDocuments = req.body.legalDocuments || {};

  if (!itemId) {
    return res.status(400).json({ message: 'itemId is required' });
  }
  const qty = Number(quantity) || 1;
  if (qty <= 0) {
    return res.status(400).json({ message: 'quantity must be positive' });
  }

  try {
    analyticsService.trackEvent({
      userId: req.user.id,
      eventName: 'purchase_attempt',
      properties: { itemId, quantity: qty, consentVersion },
      consent: { status: req.get('x-analytics-consent') },
    });
    const { paymentIntent, userTransaction } = await shopService.startPurchase({
      user: req.user,
      itemId,
      quantity: qty,
      idempotencyKey,
      requesterIp,
      userAgent,
      consentVersion,
      legalDocuments
    });

    res.status(201).json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      checkoutSessionId: paymentIntent.checkoutSessionId,
      transactionId: userTransaction.id 
    });
    analyticsService.trackEvent({
      userId: req.user.id,
      eventName: 'purchase_success',
      properties: {
        itemId,
        quantity: qty,
        transactionId: userTransaction.id,
      },
      consent: { status: req.get('x-analytics-consent') },
    });
  } catch (error) {
    logger.warn({ err: error, userId: req.user.id }, 'Purchase failed');
    analyticsService.trackEvent({
      userId: req.user.id,
      eventName: 'purchase_fail',
      properties: { itemId, quantity: qty, reason: error.message },
      consent: { status: req.get('x-analytics-consent') },
    });
    res.status(400).json({ message: error.message });
  }
}));

router.post('/webhooks/stripe', asyncHandler(async (req, res) => {
  const { type, data } = req.body || {};
  const paymentIntentId = data?.object?.metadata?.localIntentId;
  if (!paymentIntentId) {
    return res.status(400).json({ received: true, ignored: true });
  }

  if (type === 'payment_intent.succeeded') {
    await shopService.markPaymentResult(paymentIntentId, 'succeeded');
  } else if (type === 'payment_intent.payment_failed' || type === 'payment_intent.failed') {
    await shopService.markPaymentResult(paymentIntentId, 'failed', data?.object?.last_payment_error?.message);
  }

  res.json({ received: true });
}));

module.exports = router;