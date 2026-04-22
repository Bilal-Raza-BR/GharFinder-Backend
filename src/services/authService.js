//authService.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.registerUser = async ({ name, phone, password, role = 'tenant' }) => {
  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new ApiError(400, 'Name is required and must be at least 2 characters long');
  }

  if (!phone || typeof phone !== 'string') {
    throw new ApiError(400, 'Phone number is required');
  }

  // Pakistani phone number validation
  const phoneRegex = /^(\+92|92|0)?[3][0-4][0-9]{8}$/;
  if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
    throw new ApiError(400, 'Please enter a valid Pakistani phone number (e.g. 03001234567)');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'Password is required and must be at least 6 characters long');
  }

  // Password strength validation
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new ApiError(400, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  if (!['tenant', 'owner'].includes(role)) {
    throw new ApiError(400, 'Role must be either tenant or owner');
  }

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new ApiError(409, 'Phone number is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), phone: phone.replace(/\s+/g, ''), password: hashedPassword, role });

  const token = createToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
};

exports.loginUser = async ({ phone, password }) => {
  // Validation
  if (!phone || typeof phone !== 'string') {
    throw new ApiError(400, 'Phone number is required');
  }

  // Pakistani phone number validation
  const phoneRegex = /^(\+92|92|0)?[3][0-4][0-9]{8}$/;
  if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
    throw new ApiError(400, 'Please enter a valid Pakistani phone number');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'Password is required and must be at least 6 characters long');
  }

  const user = await User.findOne({ phone: phone.replace(/\s+/g, '') });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = createToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
    token,
  };
};
