//authController.js

const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

exports.register = catchAsync(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: result });
});

exports.login = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json({ success: true, data: result });
});
