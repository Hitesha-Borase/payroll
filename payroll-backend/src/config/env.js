require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv.toLowerCase() === 'production';

// Strict validation of JWT secrets
const rawAccessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const rawRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (isProduction) {
  if (!rawAccessSecret) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET (or JWT_ACCESS_SECRET) environment variable is required in production.');
  }
  if (!rawRefreshSecret) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET environment variable is required in production.');
  }
  if (rawRefreshSecret === rawAccessSecret) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET must be distinct from JWT_ACCESS_SECRET/JWT_SECRET in production.');
  }
} else if (!rawAccessSecret && nodeEnv !== 'test') {
  throw new Error('CONFIGURATION ERROR: JWT_SECRET or JWT_ACCESS_SECRET must be provided in .env');
}

// Fallback for isolated test/dev environments only
const resolvedAccessSecret = rawAccessSecret || (nodeEnv === 'test' ? 'test_jwt_access_secret_for_unit_tests_only' : '');
const resolvedRefreshSecret = rawRefreshSecret || (rawAccessSecret ? `${rawAccessSecret}_dev_refresh` : (nodeEnv === 'test' ? 'test_jwt_refresh_secret_for_unit_tests_only' : ''));

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  node: nodeEnv,
  isProduction,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'pop_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    secret: resolvedAccessSecret, // Backward compatibility
    accessSecret: resolvedAccessSecret,
    refreshSecret: resolvedRefreshSecret,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '24h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },

  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
      : (isProduction ? [] : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']),
  },
};
