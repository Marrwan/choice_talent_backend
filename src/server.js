const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const matchPreferenceRoutes = require('./routes/matchPreference');
const datePlanRoutes = require('./routes/datePlan');
const chatRoutes = require('./routes/chat');
const callRoutes = require('./routes/call');
const groupRoutes = require('./routes/group');
const paymentRoutes = require('./routes/payment');
const professionalCareerProfileRoutes = require('./routes/professionalCareerProfile');
const jobHuntingSettingsRoutes = require('./routes/jobHuntingSettings');
const jobSubscriptionRoutes = require('./routes/jobSubscription');
const emailCampaignRoutes = require('./routes/emailCampaign');
const errorHandler = require('./middleware/errorHandler');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketService.initialize(server);

// Initialize email campaign cron jobs
const { scheduleEmailCampaignJobs } = require('./cron/emailCampaignCron');
scheduleEmailCampaignJobs();

// Security middleware
app.use(helmet());
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://choicetalent.netlify.app',
      'https://*.netlify.app',
      process.env.FRONTEND_URL || 'http://192.168.1.101:3000',
      'http://192.168.1.101:3000'
    ];
    
    // Check if origin is in allowed list or matches wildcard patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard patterns
        const pattern = allowedOrigin.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Serve static files from uploads directory with CORS headers (BEFORE rate limiting)
app.use('/api/uploads', (req, res, next) => {
  // Set CORS headers for image requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Remove restrictive CSP headers for images
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // Log image requests for debugging
  console.log('Image request:', req.url);
  
  next();
}, express.static('src/uploads'));

// Rate limiting (AFTER static file serving)
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test image endpoint
app.get('/test-image', (req, res) => {
  res.status(200).json({
    message: 'Image test endpoint',
    sampleImage: 'http://localhost:3001/api/uploads/professional-profiles/1753805315000-aea1abb572ef.jpeg',
    corsHeaders: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/match-preference', matchPreferenceRoutes);
app.use('/api/date-plan', datePlanRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/professional-career-profile', professionalCareerProfileRoutes);
app.use('/api/job-hunting-settings', jobHuntingSettingsRoutes);
app.use('/api/job-subscription', jobSubscriptionRoutes);
app.use('/api/email-campaigns', emailCampaignRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Database connection and server start
async function startServer() {
  try {
    // Test database connection if DATABASE_URL is provided
    if (process.env.DATABASE_URL) {
      await sequelize.authenticate();
      console.log('Database connected successfully.');
      
      // Sync database (in production, use migrations instead)
      if (process.env.NODE_ENV !== 'production') {
        // await sequelize.sync({ alter: true });
        console.log('Database synchronized.');
      }
    } else {
      console.log('No DATABASE_URL provided. Running without database connection.');
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Socket.io server ready for connections`);
    });
  } catch (error) {
    console.error('Database connection failed, but starting server anyway:', error.message);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (without database)`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Socket.io server ready for connections`);
    });
  }
}

startServer();

module.exports = app; 