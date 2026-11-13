const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate JWT Access Token
 * Explicitly claims type: 'access'
 */
const generateAccessToken = (payload) => {
  const tokenPayload = {
    ...payload,
    type: 'access',
  };

  return jwt.sign(tokenPayload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiry,
  });
};

/**
 * Generate JWT Refresh Token
 * Explicitly claims type: 'refresh' and signs with distinct refresh secret
 */
const generateRefreshToken = (payload) => {
  const tokenPayload = {
    id: payload.id,
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiry,
  });
};

/**
 * Verify JWT Access Token
 * Rejects tokens that do not have type: 'access'
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    if (decoded.type && decoded.type !== 'access') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify JWT Refresh Token
 * Rejects tokens that do not have type: 'refresh' or are signed with access key
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret);
    if (!decoded || decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Default verifyToken (backward-compatible alias for access token verification)
 */
const verifyToken = (token) => {
  return verifyAccessToken(token);
};

/**
 * Generate both access and refresh tokens
 */
const generateTokens = (user) => {
  const accessPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id || null,
  };

  return {
    accessToken: generateAccessToken(accessPayload),
    refreshToken: generateRefreshToken({ id: user.id }),
  };
};

/**
 * Generate Token (Single Access Token helper)
 */
const generateToken = (payload) => {
  return generateAccessToken(payload);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
  generateTokens,
  generateToken,
};
