const Listing = require('../models/Listing');
const ApiError = require('../utils/apiError');
const cloudinaryService = require('./cloudinaryService');

const parseBoolean = (value) => value === true || value === 'true';

// ---------------- CREATE ----------------
exports.createListing = async (data) => {
  return await Listing.create(data);
};

// ---------------- GET FILTERED LISTINGS (FIXED) ----------------
exports.getFilteredListings = async ({
  minPrice,
  maxPrice,
  rooms,
  furnished,
  familyAllowed,
  location,
  page,
  limit,
  sort,
  status,
}) => {
  const filter = {};

  if (minPrice !== undefined) {
    filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  }

  if (maxPrice !== undefined) {
    filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
  }

  if (rooms !== undefined) {
    const roomNum = Number(rooms);
    filter.rooms = roomNum === 3 ? { $gte: roomNum } : { $lte: roomNum };
  }

  if (furnished !== undefined) {
    filter.furnished = parseBoolean(furnished);
  }

  if (familyAllowed !== undefined) {
    filter.familyAllowed = parseBoolean(familyAllowed);
  }

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  if (status && status !== 'all') {
    filter.status = status;
  } else {
    filter.$or = [{ status: 'active' }, { status: { $exists: false } }];
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(limit) || 10);
  const skip = (pageNumber - 1) * pageSize;

  const query = Listing.find(filter).populate('owner', 'phone name');

  if (sort === 'asc') query.sort({ price: 1 });
  else if (sort === 'desc') query.sort({ price: -1 });
  else query.sort({ createdAt: -1 });

  const [total, listings] = await Promise.all([
    Listing.countDocuments(filter),
    query.skip(skip).limit(pageSize).lean(),
  ]);

  // ---------------- SAFE MAPPING (FIXED CRASH) ----------------
  const items = listings.map((listing) => ({
    ...listing,
    owner: listing.owner?._id?.toString?.() || null,
    ownerPhone: listing.owner?.phone || null,
    contactLink: listing.owner?.phone
      ? `https://wa.me/${listing.owner.phone}`
      : null,
  }));

  return {
    items,
    meta: {
      total,
      page: pageNumber,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
    },
  };
};

// ---------------- GET BY ID (FIXED) ----------------
exports.getListingById = async (id) => {
  const listing = await Listing.findById(id)
    .populate('owner', 'phone name')
    .lean();

  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  return {
    ...listing,
    owner: listing.owner?._id?.toString?.() || null,
    ownerPhone: listing.owner?.phone || null,
    contactLink: listing.owner?.phone
      ? `https://wa.me/${listing.owner.phone}`
      : null,
  };
};

// ---------------- UPDATE ----------------
exports.updateListing = async (id, updateData, userId) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  if (listing.owner.toString() !== String(userId)) {
    throw new ApiError(403, 'You can only update your own listings');
  }

  Object.assign(listing, updateData);
  await listing.save();

  return listing;
};

// ---------------- DELETE ----------------
exports.deleteListing = async (id, userId) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  if (listing.owner.toString() !== String(userId)) {
    throw new ApiError(403, 'You can only delete your own listings');
  }

  if (listing.images?.length) {
    listing.images.forEach((img) => {
      cloudinaryService.deleteImage(img).catch((err) => {
        console.error('Cloudinary delete failed:', err);
      });
    });
  }

  await listing.deleteOne();
};

// ---------------- DELETE IMAGE ----------------
exports.deleteImage = async (id, imageUrl, userId) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  if (listing.owner.toString() !== String(userId)) {
    throw new ApiError(403, 'You can only delete images from your own listings');
  }

  listing.images = listing.images.filter((img) => img !== imageUrl);
  await listing.save();

  if (imageUrl) {
    cloudinaryService.deleteImage(imageUrl).catch((err) => {
      console.error('Cloudinary delete failed:', err);
    });
  }
};