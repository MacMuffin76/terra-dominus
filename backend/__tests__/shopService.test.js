const ShopService = require('../services/shopService');

describe('ShopService limits', () => {
  it('converts currencies to euros', () => {
    expect(ShopService.convertToEur(10000, 'EUR')).toBe(10000);
    expect(ShopService.convertToEur(10000, 'USD')).toBeGreaterThan(10000); // USD rate < 1
  });

  it('throws when daily cap exceeded', async () => {
    const mockTransactions = [
      { amountCents: 30000, currency: 'EUR' },
      { amountCents: 25000, currency: 'USD' }
    ];
    const service = new ShopService({
      ShopItem: {},
      PaymentIntent: {},
      UserTransaction: { findAll: jest.fn().mockResolvedValue(mockTransactions) },
      sequelize: {}
    });

    await expect(service.assertDailyLimit(1, 10000, 'EUR')).rejects.toThrow('Daily purchase limit exceeded');
  });
});