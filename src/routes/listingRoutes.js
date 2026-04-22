//listingRoutes.js
const express = require('express');
const listingController = require('../controllers/listingController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);
router.post(
  '/',
  authMiddleware.protect,
  uploadMiddleware,
  validateRequest(['title', 'price', 'location']),
  listingController.createListing,
);
router.put('/:id', authMiddleware.protect, uploadMiddleware, listingController.updateListing);
router.delete('/:id', authMiddleware.protect, listingController.deleteListing);
router.post('/:id/image/delete', authMiddleware.protect, listingController.deleteImage);

module.exports = router;
