const mongoose = require('mongoose');
const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  rooms: {
    type: Number,
    default: 0,
  },
  baths: {
    type: Number,
    default: 0,
  },
  area: {
    type: String,
    default: '',
    trim: true,
  },
  furnished: {
    type: Boolean,
    default: false,
  },
  familyAllowed: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  floor: {
    type: String,
    default: '',
    trim: true,
  },
  utilities: {
    water: {
      type: String,
      default: '',
      trim: true,
    },
    gas: {
      type: String,
      default: '',
      trim: true,
    },
    electricity: {
      type: String,
      default: '',
      trim: true,
    },
  },
  features: [
    {
      type: String,
      trim: true,
    },
  ],
  tenantRules: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold'],
    default: 'active',
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  images: [
    {
      type: String,
    },
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model('Listing', listingSchema);
