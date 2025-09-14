// server.js - Main application server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { agents } = require('./models/Agent');
const logger = require('./middleware/logger'); //import middleware
const apiLimiter = require('./middleware/rateLimiter');
//OpenAPI Documentation
const { swaggerUi, specs } = require('./swagger');
//Input Sanitization
const sanitizeInput = require('./middleware/sanitizeinput');
require('dotenv').config();//โหลด environment variables
const mongoose = require('mongoose'); //เชื่อมต่อ MongoDB
const http = require('http'); // สร้าง HTTP server
const socketIo = require('socket.io'); // ใช้สำหรับ WebSocket


// เชื่อมต่อ Local MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connected to Local MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


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



// Import routes และ middleware
const routes = require('./routes');
const { globalErrorHandler, notFoundHandler, performanceMonitor } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
// สร้าง HTTP server และผูกกับ Express app
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3001" }
});

// Security middleware
app.use(helmet());
// ใช้งานก่อน route ทั้งหมด
app.use(logger);
// ป้องกันการยิง request ถี่เกินไป
app.use('/api', apiLimiter);
//Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use((req, res, next) => {
  req.io = io; // ให้ controller ใช้ io.emit ได้
  next();
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
//Input Sanitization
app.use(sanitizeInput);
app.use(express.urlencoded({ extended: true }));

// Request logging (เฉพาะ development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Performance monitoring
app.use(performanceMonitor);



// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Agent Wallboard API Enhanced v1.0',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/api/health',
    endpoints: {
      agents: '/api/agents',
      health: '/api/health',
      docs: '/api/docs'
    }
  });
});
// 1. Enhanced Health Check
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

// Advanced health checks with dependencies
app.get('/api/health', async (req, res) => {
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

// Metrics Collection Endpoint
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


// ตัวอย่างฟังก์ชันตรวจ dependencies
async function checkDatabase() {
  await db.ping(); // หรือ query เบา ๆ
  return 'connected';
}

async function checkRedis() {
  await redisClient.ping();
  return 'connected';
}

async function checkExternalAPI() {
  const res = await fetch('https://external-service.com/ping');
  return res.ok ? 'connected' : 'unreachable';
}
//

// API routes
app.use('/api', routes);

// Error handlers (ต้องอยู่ท้ายสุด)
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

// Graceful shutdown (เตรียมสำหรับ Phase 3)
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await db.disconnect?.(); // ถ้ามี
  await redisClient.quit?.(); // ถ้ามี
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

module.exports = app;