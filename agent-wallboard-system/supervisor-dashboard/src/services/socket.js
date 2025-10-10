// services/socket.js - Version 4.0
// ⚠️ WebSocket ยังใช้ agentCode ตาม Backend socketHandler
// ไม่ต้องแก้ไขไฟล์นี้!

import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
let socket = null;

/**
 * ✅ Connect as Supervisor
 * ยังใช้ code (username) ตามเดิม
 */
export const connectSocket = (supervisorCode, role = 'Supervisor') => {
  if (!supervisorCode) {
    console.error('❌ connectSocket: supervisorCode is required');
    return null;
  }

  if (socket) {
    console.log('Disconnecting existing socket...');
    disconnectSocket();
  }

  console.log('🔌 Connecting to WebSocket...', SOCKET_URL);
  console.log('📋 Supervisor Code:', supervisorCode, 'Role:', role);

  try {
    socket = io(SOCKET_URL, {
      query: {
        agentCode: supervisorCode.toUpperCase(),  // ⬅️ ยังใช้ agentCode
        role: role,
        type: 'supervisor'  // ⬅️ ระบุเป็น supervisor
      },
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      socket.emit('supervisor_connect', { 
        agentCode: supervisorCode.toUpperCase(),
        role: role 
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
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

export const isSocketConnected = () => {
  return socket && socket.connected;
};

export const getSocket = () => socket;