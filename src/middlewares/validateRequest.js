//validateRequest.js

const ApiError = require('../utils/apiError');

module.exports = (requiredFields) => (req, res, next) => {
  const missingFields = requiredFields.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length) {
    return next(new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`));
  }

  next();
};
