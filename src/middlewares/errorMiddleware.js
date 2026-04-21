const ApiError = require('../utils/apiError');

exports.notFound = (req, res, next) => {
  next(new ApiError(404, 'Resource not found'));
};

exports.errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((error) => error.message).join(', ');
  }

  if (err.code === 11000) {
    message = 'Duplicate field value entered';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
