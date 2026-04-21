const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

exports.protect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authorization token is required')); 
  }

  const token = authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ApiError(401, 'Invalid token')); 
    }

    req.user = { id: user._id.toString(), role: user.role, phone: user.phone };
    next();
  } catch (err) {
    return next(new ApiError(401, 'Token invalid or expired')); 
  }
};
