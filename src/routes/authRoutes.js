const express = require('express');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.post('/register', validateRequest(['name', 'phone', 'password']), authController.register);
router.post('/login', validateRequest(['phone', 'password']), authController.login);

module.exports = router;
