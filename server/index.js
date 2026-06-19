const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware — allows JSON and cross-origin requests
app.use(cors());
app.use(express.json());

// Import all route files
const authRoutes      = require('./routes/auth');
const campaignRoutes  = require('./routes/campaigns');
const reviewRoutes    = require('./routes/reviews');
const complaintRoutes = require('./routes/complaints');
const adminRoutes     = require('./routes/admin');
const departmentRoutes = require('./routes/departments');
const whatsappRoutes   = require('./routes/whatsapp');

// Mount routes at their URL paths
app.use('/api/auth',       authRoutes);
app.use('/api/campaigns',  campaignRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/whatsapp',    whatsappRoutes);

// Simple check — open this in browser to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: 'Hospital Review API is running ✓' });
});

// Connect to MongoDB, then start listening
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`✓ Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('✗ MongoDB connection failed:', err.message);
  });