// //server.js

// require('dotenv').config();
// const app = require('./app');
// const connectDB = require('./config/db');

// const PORT = process.env.PORT || 5000;

// // Connect to the database when the server starts
// connectDB()
//   .then(() => {
//     console.log('MongoDB connected');

//     // only for local (Vercel ignores listen)
//     if (process.env.NODE_ENV !== 'production') {
//       app.listen(5000, () => {
//         console.log('Server running on port 5000');
//       });
//     }
//   })
//   .catch((err) => {
//     console.error('DB connection failed:', err);
//   });
// // For Vercel deployment, we export the app directly.
// // Vercel's environment will handle listening on the port.
// // For local development, you can still run `node src/server.js`
// // and it will connect to the DB, but won't start a listener.
// module.exports = app;
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

let isConnected = false;

module.exports = async (req, res) => {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log('MongoDB connected');
    }

    return app(req, res);
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};