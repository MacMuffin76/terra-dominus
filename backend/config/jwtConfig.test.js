const path = require('path');

describe('getJwtSecret', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    jest.resetModules();
  });

  it('throws a clear error when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    jest.resetModules();

    expect(() => {
      const { getJwtSecret } = require(path.join(__dirname, 'jwtConfig'));
      getJwtSecret();
    }).toThrow('JWT_SECRET environment variable must be set and non-empty');
  });

  it('returns the secret when JWT_SECRET is provided', () => {
    process.env.JWT_SECRET = 'test-secret';
    jest.resetModules();

    const { getJwtSecret } = require(path.join(__dirname, 'jwtConfig'));
    expect(getJwtSecret()).toBe('test-secret');
  });
});