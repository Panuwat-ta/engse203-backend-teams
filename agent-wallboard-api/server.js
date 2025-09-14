// server.js - Main application server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

// Models & Routes
const { agents } = require('./models/Agent');
const routes = require('./routes');
const messageRoutes = require('./routes/messages');

// Middleware
const logger = require('./middleware/logger');
const apiLimiter = require('./middleware/rateLimiter');
const sanitizeInput = require('./middleware/sanitizeinput');
const { globalErrorHandler, notFoundHandler, performanceMonitor } = require('./middleware/errorHandler');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to Local MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Optional: Agent schema (if needed in server.js)
const agentSchema = new mongoose.Schema({
  agentCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, default: 'General' },
  status: { type: String, default: 'Available' },
  loginTime: Date,
  lastStatusChange: { type: Date, default: Date.now }
});
const Agent = mongoose.model('Agent', agentSchema);

// Express app
const app = express();
const PORT = process.env.PORT || 3001;

// HTTP server + Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3001", "http://127.0.0.1:5500"],//port 5500 ของ live server
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware order is important
app.use(helmet()); // Security headers
app.use(cors({
  origin: ["http://localhost:3001", "http://127.0.0.1:5500"],//port 5500 ของ live server
  credentials: true
}));
app.use(logger); // Request logger
app.use('/api', apiLimiter); // Rate limiter

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

// Attach io to req for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Performance monitoring
app.use(performanceMonitor);

// Routes
app.use('/api/messages', messageRoutes);
app.use('/api', routes);

// Swagger docs
const { swaggerUi, specs } = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Agent Wallboard API Enhanced v1.0',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    agentCount: agents.size,
    timestamp: new Date().toISOString()
  });
});

// Advanced health check example
app.get('/api/health/deep', async (req, res) => {
  const [dbStatus, redisStatus, externalStatus] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalAPI()
  ]);

  const memory = process.memoryUsage();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      database: dbStatus.status === 'fulfilled' ? dbStatus.value : 'unreachable',
      redis: redisStatus.status === 'fulfilled' ? redisStatus.value : 'unreachable',
      externalAPI: externalStatus.status === 'fulfilled' ? externalStatus.value : 'unreachable'
    },
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed
    }
  });
});

// Metrics
app.get('/api/metrics', (req, res) => {
  const totalAgents = agents.size;
  const activeAgents = Array.from(agents.values()).filter(a => a.status === 'Available').length;

  res.json({
    totalAgents,
    activeAgents,
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Example dependency checks
async function checkDatabase() {
  // Example MongoDB ping
  await mongoose.connection.db.admin().ping();
  return 'connected';
}

async function checkRedis() {
  // Example Redis ping if available
  return 'connected';
}

async function checkExternalAPI() {
  try {
    const res = await fetch('https://external-service.com/ping');
    return res.ok ? 'connected' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}

// Error handlers (last)
app.use('*', notFoundHandler);
app.use(globalErrorHandler);

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log('🚀 Agent Wallboard API Enhanced');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await mongoose.disconnect();
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

module.exports = app;
