// //server.js

// require('dotenv').config();
// const connectDB = require('./config/db');
// const app = require('./app');

// const PORT = process.env.PORT || 5000;

// // Local development ke liye server start karne ka logic
// if (process.env.NODE_ENV !== 'production') {
//   connectDB()
//     .then(() => {
//       app.listen(PORT, () => {
//         console.log(`🚀 Server running on http://localhost:${PORT}`);
//       });
//     })
//     .catch((err) => {
//       console.error('❌ Database connection failed:', err);
//     });
// }

// // Vercel deployment ke liye handler export
// module.exports = async (req, res) => {
//   try {
//     await connectDB();
//     return app(req, res);
//   } catch (err) {
//     console.error('Server Error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// ---------------- LOCAL DEVELOPMENT ----------------
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
      process.exit(1);
    }
  })();
}

// ---------------- VERCEL SERVERLESS HANDLER ----------------
module.exports = async (req, res) => {
  try {
    // ⚡ ensure DB connection (safe with caching in db.js)
    await connectDB();

    return app(req, res);
  } catch (err) {
    console.error('❌ Server Error:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};