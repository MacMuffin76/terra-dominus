function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET environment variable must be set and non-empty');
  }

  return secret;
}

module.exports = { getJwtSecret };