const mongoose = require('mongoose');

// Buffering off karein taake connection na hone par foran error mile
mongoose.set('bufferCommands', false);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000, // 5 seconds mein fail ho jaye agar connect na ho
      socketTimeoutMS: 45000,
      family: 4, // IPv4 use kare
    };

    console.log("Connecting to MongoDB...");
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB Connected Successfully");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("MongoDB Connection Error Details:", err.message);
        cached.promise = null; // Error par promise clear karein taake retry ho sake
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;