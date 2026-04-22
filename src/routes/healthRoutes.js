//healthRoutes.js

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'GharFinder Backend server is running!' });
});

module.exports = router;