const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route for Vercel deployment check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'GharFinder Backend server is running successfully!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/health', healthRoutes); // New health check route

app.use(notFound);
app.use(errorHandler);

module.exports = app;
