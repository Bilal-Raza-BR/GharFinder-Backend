const Listing = require('../models/Listing');
const ApiError = require('../utils/apiError');
const cloudinaryService = require('./cloudinaryService'); // 🔥 FIX

const parseBoolean = (value) => value === true || value === 'true';

exports.createListing = async (data) => Listing.create(data);

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
    if (roomNum === 3) {
      filter.rooms = { $gte: roomNum };
    } else {
      filter.rooms = { $lte: roomNum };
    }
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
  if (status !== undefined) {
    if (status !== 'all') {
      filter.status = status;
    }
  } else {
    filter.$or = [{ status: 'active' }, { status: { $exists: false } }];
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(limit) || 10);
  const skip = (pageNumber - 1) * pageSize;

  const query = Listing.find(filter).populate('owner', 'phone name');

  if (sort === 'asc') {
    query.sort({ price: 1 });
  } else if (sort === 'desc') {
    query.sort({ price: -1 });
  } else {
    query.sort({ createdAt: -1 });
  }

  const [total, listings] = await Promise.all([
    Listing.countDocuments(filter),
    query.skip(skip).limit(pageSize).lean(),
  ]);

  const items = listings.map((listing) => ({
    ...listing,
    ownerPhone: listing.owner?.phone || null,
    contactLink: listing.owner?.phone
      ? `https://wa.me/${listing.owner.phone}`
      : null,
    owner: listing.owner?._id?.toString(),
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

exports.getListingById = async (id) => {
  const listing = await Listing.findById(id)
    .populate('owner', 'phone name')
    .lean();

  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  return {
    ...listing,
    ownerPhone: listing.owner?.phone || null,
    contactLink: listing.owner?.phone
      ? `https://wa.me/${listing.owner.phone}`
      : null,
    owner: listing.owner?._id?.toString(),
  };
};

exports.updateListing = async (id, updateData, userId) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  if (listing.owner.toString() !== userId) {
    throw new ApiError(403, 'You can only update your own listings');
  }

  Object.assign(listing, updateData);
  await listing.save();

  return listing;
};

exports.deleteListing = async (id, userId) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  if (listing.owner.toString() !== userId) {
    throw new ApiError(403, 'You can only delete your own listings');
  }

  // 🔥 Cloudinary se sab images delete (background)
  if (listing.images?.length) {
    listing.images.forEach((img) => {
      cloudinaryService.deleteImage(img).catch((err) => {
        console.error('Cloudinary bulk delete failed:', err);
      });
    });
  }

  await listing.deleteOne();
};

exports.deleteImage = async (id, imageUrl, userId) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  if (listing.owner.toString() !== userId) {
    throw new ApiError(403, 'You can only delete images from your own listings');
  }

  // ✅ Remove from DB
  listing.images = listing.images.filter((img) => img !== imageUrl);
  await listing.save();

  // ✅ Delete from Cloudinary (background)
  if (imageUrl) {
    cloudinaryService.deleteImage(imageUrl).catch((err) => {
      console.error('Cloudinary delete failed:', err);
    });
  }
};