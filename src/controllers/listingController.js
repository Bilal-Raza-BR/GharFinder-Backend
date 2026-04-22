//listingController.js

const listingService = require('../services/listingService');
const cloudinaryService = require('../services/cloudinaryService');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/apiError');

const parseBoolean = (value) => value === true || value === 'true';

// 🔥 SAFE JSON PARSER
const safeParse = (value, fallback) => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

exports.createListing = catchAsync(async (req, res) => {
  const {
    title, description, price, location,
    rooms, baths, area, furnished,
    familyAllowed, gasAvailable,
    latitude, longitude, floor,
    utilities, features, tenantRules
  } = req.body;

  // ✅ PARSE JSON FIELDS
  const parsedUtilities = safeParse(utilities, {});
  const parsedFeatures = safeParse(features, []);

  // Validation
  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    throw new ApiError(400, 'Title must be at least 5 characters');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 20) {
    throw new ApiError(400, 'Description must be at least 20 characters');
  }

  if (!price || isNaN(Number(price)) || Number(price) < 1000) {
    throw new ApiError(400, 'Price must be at least Rs. 1000');
  }

  if (!location || typeof location !== 'string' || location.trim().length < 3) {
    throw new ApiError(400, 'Location must be valid');
  }

  // Image validation
  if (!req.files || !req.files.length) {
    throw new ApiError(400, 'At least 1 image required');
  }

  if (req.files.length > 6) {
    throw new ApiError(400, 'Max 6 images allowed');
  }

  for (let file of req.files) {
    if (!file.mimetype.startsWith('image/')) {
      throw new ApiError(400, 'Only image files allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError(400, 'Image must be < 5MB');
    }
  }

  const listingData = {
    title: title.trim(),
    description: description.trim(),
    price: Number(price),
    location: location.trim(),
    rooms: Number(rooms) || 0,
    baths: Number(baths) || 0,
    area: area ? area.trim() : '',
    furnished: parseBoolean(furnished),
    familyAllowed: parseBoolean(familyAllowed),
    gasAvailable: parseBoolean(gasAvailable),
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    floor: floor ? floor.trim() : '',
    utilities: parsedUtilities,
    features: parsedFeatures,
    tenantRules: tenantRules ? tenantRules.trim() : '',
    status: 'active',
    owner: req.user.id,
    images: [],
  };

  // Upload images
  listingData.images = await cloudinaryService.uploadImages(req.files);

  const listing = await listingService.createListing(listingData);

  res.status(201).json({ success: true, data: listing });
});

exports.getListings = catchAsync(async (req, res) => {
  const result = await listingService.getFilteredListings(req.query);
  res.status(200).json({ success: true, data: result.items, meta: result.meta });
});

exports.getListingById = catchAsync(async (req, res) => {
  const listing = await listingService.getListingById(req.params.id);
  res.status(200).json({ success: true, data: listing });
});

exports.updateListing = catchAsync(async (req, res) => {
  const updateData = { ...req.body };

  // 🔥 PARSE JSON FIELDS (MAIN FIX)
  if (updateData.utilities) {
    updateData.utilities = safeParse(updateData.utilities, {});
  }

  if (updateData.features) {
    updateData.features = safeParse(updateData.features, []);
  }

  if (updateData.existingImages) {
    updateData.existingImages = safeParse(updateData.existingImages, []);
  }

  // Conversions
  if (updateData.rooms !== undefined) updateData.rooms = Number(updateData.rooms);
  if (updateData.baths !== undefined) updateData.baths = Number(updateData.baths);
  if (updateData.latitude !== undefined) updateData.latitude = Number(updateData.latitude);
  if (updateData.longitude !== undefined) updateData.longitude = Number(updateData.longitude);

  if (updateData.furnished !== undefined) {
    updateData.furnished = parseBoolean(updateData.furnished);
  }

  if (updateData.familyAllowed !== undefined) {
    updateData.familyAllowed = parseBoolean(updateData.familyAllowed);
  }

  if (updateData.gasAvailable !== undefined) {
    updateData.gasAvailable = parseBoolean(updateData.gasAvailable);
  }

  if (updateData.floor !== undefined) {
    updateData.floor = updateData.floor ? updateData.floor.trim() : '';
  }

  if (updateData.tenantRules !== undefined) {
    updateData.tenantRules = updateData.tenantRules
      ? updateData.tenantRules.trim()
      : '';
  }

  if (updateData.status && !['active', 'inactive', 'sold'].includes(updateData.status)) {
    throw new ApiError(400, 'Invalid status');
  }

  // Images handling
  if (req.files && req.files.length) {
    const newImages = await cloudinaryService.uploadImages(req.files);
    updateData.images = [
      ...(updateData.existingImages || []),
      ...newImages
    ];
  } else if (updateData.existingImages) {
    updateData.images = updateData.existingImages;
  }

  const listing = await listingService.updateListing(
    req.params.id,
    updateData,
    req.user.id
  );

  res.status(200).json({ success: true, data: listing });
});

exports.deleteListing = catchAsync(async (req, res) => {
  await listingService.deleteListing(req.params.id, req.user.id);
  res.status(200).json({ success: true });
});

exports.deleteImage = catchAsync(async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    throw new ApiError(400, 'Image URL required');
  }

  await listingService.deleteImage(req.params.id, imageUrl, req.user.id);

  res.status(200).json({ success: true });
});