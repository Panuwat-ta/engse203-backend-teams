// websocket/socketServer.js - WebSocket server management
const socketIo = require('socket.io');
const AgentMongo = require('../models/AgentMongo');

class SocketServer {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // Map: socketId -> clientInfo
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        //origin: process.env.FRONTEND_URL || "http://localhost:3000", // For Front-end App
        origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500', // For Live Server in VS Code
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    console.log('🌐 WebSocket server initialized');
    return this.io;
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 Client connected: ${socket.id}`);

      // Agent login
      socket.on('agent-login', async (data) => {
        try {
          const { agentCode, agentName } = data;
          console.log(`🔐 Agent login: ${agentCode}`);

          // Update agent online status
          const agent = await AgentMongo.findOneAndUpdate(
            { agentCode },
            {
              isOnline: true,
              socketId: socket.id,
              loginTime: new Date()
            },
            { new: true }
          );

          if (agent) {
            // Store client info
            this.connectedClients.set(socket.id, {
              agentCode,
              agentName,
              agentId: agent._id,
              loginTime: new Date()
            });

            // Join agent to their room
            socket.join(`agent-${agentCode}`);

            // Notify others
            socket.broadcast.emit('agent-online', {
              agentCode,
              agentName,
              timestamp: new Date()
            });

            // Send welcome message
            socket.emit('login-success', {
              agent: agent,
              message: 'Successfully connected to Agent Wallboard System'
            });

            console.log(`✅ Agent ${agentCode} logged in successfully`);
          } else {
            socket.emit('login-error', {
              message: `Agent ${agentCode} not found`
            });
          }
        } catch (error) {
          console.error('❌ Agent login error:', error);
          socket.emit('login-error', {
            message: 'Login failed'
          });
        }
      });

      // Agent logout
      socket.on('agent-logout', async (data) => {
        try {
          const clientInfo = this.connectedClients.get(socket.id);
          if (clientInfo) {
            await this.handleAgentDisconnect(socket.id);
          }
        } catch (error) {
          console.error('❌ Agent logout error:', error);
        }
      });

      // Join dashboard room (for supervisors)
      socket.on('join-dashboard', () => {
        socket.join('dashboard');
        console.log(`📊 Client joined dashboard room: ${socket.id}`);

        // Send current stats
        this.sendDashboardUpdate();
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`👤 Client disconnected: ${socket.id}`);
        await this.handleAgentDisconnect(socket.id);
      });

      // Ping-pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  async handleAgentDisconnect(socketId) {
    try {
      const clientInfo = this.connectedClients.get(socketId);

      if (clientInfo) {
        const { agentCode, agentName } = clientInfo;

        // Update agent offline status
        await AgentMongo.findOneAndUpdate(
          { agentCode },
          {
            isOnline: false,
            socketId: null,
            status: 'Offline'
          }
        );

        // Remove from connected clients
        this.connectedClients.delete(socketId);

        // Notify others
        this.io.emit('agent-offline', {
          agentCode,
          agentName,
          timestamp: new Date()
        });

        console.log(`🔌 Agent ${agentCode} disconnected and marked offline`);
      }
    } catch (error) {
      console.error('❌ Error handling agent disconnect:', error);
    }
  }

  // Add to socketServer.js
  startDashboardUpdates() {
    setInterval(async () => {
      await this.sendDashboardUpdate();
    }, 5000); // Update every 5 seconds
  }

  // Enhanced dashboard data
  async sendDashboardUpdate() {
    const stats = await AgentMongo.aggregate([
      {
        $group: {
          _id: null,
          totalAgents: { $sum: 1 },
          onlineAgents: {
            $sum: { $cond: [{ $eq: ['$isOnline', true] }, 1, 0] }
          },
          avgResponseTime: { $avg: '$avgResponseTime' },
          statusBreakdown: {
            $push: {
              status: '$status',
              count: 1
            }
          }
        }
      }
    ]);

    this.io.to('dashboard').emit('dashboardUpdate', stats[0]);
  }

  // Method to send message to specific agent
  sendToAgent(agentCode, event, data) {
    this.io.to(`agent-${agentCode}`).emit(event, data);
  }

  // Method to broadcast to all agents
  broadcastToAllAgents(event, data) {
    this.io.emit(event, data);
  }

  // Get connected clients info
  getConnectedClients() {
    return Array.from(this.connectedClients.values());
  }

  // Get WebSocket instance
  getIO() {
    return this.io;
  }
}

module.exports = new SocketServer();