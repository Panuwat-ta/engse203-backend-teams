// services/socket.js - Version 4.0
// ⚠️ WebSocket ยังใช้ agentCode ตาม Backend socketHandler
// ไม่ต้องแก้ไขไฟล์นี้!

import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
let socket = null;

/**
 * ✅ ยังใช้ agentCode ตามเดิม
 * เพราะ Backend WebSocket handler ยังไม่ได้ update
 */
export const connectSocket = (agentCode, role = 'Agent') => {
  // Validation
  if (!agentCode) {
    console.error('❌ connectSocket: agentCode is required');
    return null;
  }

  if (typeof agentCode !== 'string') {
    console.error('❌ connectSocket: agentCode must be a string', agentCode);
    return null;
  }

  // Disconnect existing
  if (socket) {
    console.log('Disconnecting existing socket...');
    disconnectSocket();
  }

  console.log('🔌 Connecting to WebSocket...', SOCKET_URL);
  console.log('📋 Agent Code:', agentCode, 'Role:', role);

  try {
    socket = io(SOCKET_URL, {
      query: {
        agentCode: agentCode.toUpperCase(),  // ⬅️ ยังใช้ agentCode
        role: role,
        type: 'agent'
      },
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      socket.emit('agent_connect', { 
        agentCode: agentCode.toUpperCase(),  // ⬅️ ยังใช้ agentCode
        role: role 
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed');
    });

    window.socket = socket;
    return socket;
    
  } catch (error) {
    console.error('❌ Failed to create socket:', error);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting WebSocket...');
    socket.disconnect();
    socket = null;
    window.socket = null;
  }
};

/**
 * ✅ ยังใช้ agentCode
 */
export const sendStatusUpdate = (agentCode, status) => {
  if (!agentCode) {
    console.error('❌ sendStatusUpdate: agentCode is required');
    return false;
  }

  if (socket && socket.connected) {
    console.log('📤 Sending status update:', { agentCode, status });
    socket.emit('update_status', {
      agentCode: agentCode.toUpperCase(),
      status: status
    });
    return true;
  }
  
  console.warn('⚠️ Socket not connected');
  return false;
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};

export const getSocket = () => socket;