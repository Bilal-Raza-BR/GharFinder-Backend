const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const healthRoutes = require('./routes/healthRoutes');

const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const connectDB = require('./config/db');

const app = express();

/* ---------------- DB CONNECTION ---------------- */
connectDB()
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('DB connection failed:', err));

/* ---------------- MIDDLEWARES ---------------- */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://ghar-finder-frontend.vercel.app"
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- ROUTES ---------------- */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'GharFinder Backend server is running successfully!'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/health', healthRoutes);

/* ---------------- ERROR HANDLERS ---------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;