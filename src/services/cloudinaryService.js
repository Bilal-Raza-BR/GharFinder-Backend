//cloudinaryService.js

const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/apiError');

const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

const uploadSingleImage = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'rental_listings',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(502, 'Cloudinary upload failed'));
        }
        resolve(result.secure_url);
      },
    );

    bufferToStream(file.buffer).pipe(uploadStream);
  });

exports.uploadImages = async (files) => {
  if (!files || !files.length) {
    return [];
  }

  const uploads = files.map((file) => uploadSingleImage(file));
  return Promise.all(uploads);
};

exports.deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  // Extract public_id from the URL
  // Cloudinary URLs are like: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
  const urlParts = imageUrl.split('/');
  const publicIdWithExt = urlParts[urlParts.length - 1];
  const publicId = `rental_listings/${publicIdWithExt.split('.')[0]}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary delete error:', error);
        // Don't throw error for delete failures, just log them
        resolve();
      } else {
        resolve(result);
      }
    });
  });
};
