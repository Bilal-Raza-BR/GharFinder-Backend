const mongoose = require('mongoose');

// Global level par buffering band karein taake connection fail hone par foran pata chale
mongoose.set('bufferCommands', false);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is missing in Environment Variables!");
      throw new Error("MONGODB_URI is not defined");
    }

    const opts = {
      serverSelectionTimeoutMS: 5000, // 5 seconds mein fail ho jaye agar connect na ho
      socketTimeoutMS: 45000,
      family: 4, // IPv4 use kare
      maxPoolSize: 10, // Serverless ke liye pool size chota rakhna behtar hai
      bufferCommands: false, // Operation buffering yahan bhi off karein
    };

    const dbName = process.env.MONGODB_URI?.split('/').pop()?.split('?')[0] || 'default';
    console.log(`Connecting to MongoDB Database: ${dbName}...`);
    
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