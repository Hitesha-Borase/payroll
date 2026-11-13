/**
 * Global Error Handler Middleware
 * Sanitizes internal and database errors in production while preserving server-side logs
 */
const errorHandler = (err, req, res, next) => {
  const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const isDevelopment = (process.env.NODE_ENV || 'development').toLowerCase() === 'development';

  // Server-side diagnostic log (redacting obvious passwords/tokens if present in err)
  const logError = {
    message: err.message,
    code: err.code,
    errno: err.errno,
    name: err.name,
    path: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip,
  };
  console.error('[SERVER ERROR]:', logError, isDevelopment ? err.stack : '');

  // CORS Policy Errors
  if (err.message && err.message.toLowerCase().includes('cors')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied by CORS policy.',
    });
  }

  // MySQL Duplicate Entry Error (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
    });
  }

  // MySQL Foreign Key Constraint Error (ER_NO_REFERENCED_ROW_2)
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference. Related record does not exist.',
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again.',
    });
  }

  // MySQL internal query/syntax/connection errors
  const isDatabaseError = err.sqlMessage || err.sql || (typeof err.code === 'string' && err.code.startsWith('ER_'));

  const statusCode = err.statusCode || (isDatabaseError ? 500 : 500);

  // In production, sanitize 500 and internal database error messages
  let clientMessage = err.message || 'Internal server error';
  if (isProduction) {
    if (statusCode >= 500 || isDatabaseError) {
      clientMessage = 'An unexpected internal server error occurred. Please contact administrator.';
    }
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(isDevelopment && { stack: err.stack }),
  });
};

module.exports = errorHandler;
