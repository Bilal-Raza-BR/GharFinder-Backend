// //app.js
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');

// const authRoutes = require('./routes/authRoutes');
// const listingRoutes = require('./routes/listingRoutes');
// const healthRoutes = require('./routes/healthRoutes');

// const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// const app = express();

// app.use(cors({
//   origin: [
//     "http://localhost:3000",
//     "https://ghar-finder-frontend.vercel.app"
//   ],
//   credentials: true,
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.get('/', (req, res) => {
//   res.json({ message: 'API running' });
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/listings', listingRoutes);
// app.use('/api/health', healthRoutes);

// app.use(notFound);
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;

// // Local development ke liye server start karne ka logic
// if (process.env.NODE_ENV !== 'production') {
//   connectDB()
//     .then(() => {
//       app.listen(PORT, () => {
//         console.log(`🚀 Server running on http://localhost:${PORT}`);
//       });
//     })
//     .catch((err) => console.error('❌ Database connection failed:', err));
// }

// // Vercel deployment ke liye handler export
// module.exports = async (req, res) => {
//   await connectDB();
//   return app(req, res);
// };
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const healthRoutes = require('./routes/healthRoutes');

const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// ✅ DB connection (serverless safe)
let isConnected = false;
app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log("✅ DB Connected (once)");
    }
    next();
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// ✅ CORS (safe for Vercel preview links)
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health route
app.get('/', (req, res) => {
  res.json({ message: 'API running 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/health', healthRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;