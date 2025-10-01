import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
let socket = null;

export const connectSocket = (agentCode) => {
  if (socket) disconnectSocket();

  console.log('Connecting to WebSocket...', SOCKET_URL);

  socket = io(SOCKET_URL, {
    query: { agentCode: agentCode.toUpperCase(), type: 'agent' },
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket.id);
    socket.emit('agent_connect', { agentCode: agentCode.toUpperCase() });
  });

  socket.on('disconnect', (reason) => console.log('WebSocket disconnected:', reason));
  socket.on('connect_error', (error) => console.error('WebSocket connection error:', error));

  // 🔹 เพิ่ม listener สำหรับ event แจ้งเตือน
  socket.on('newMessage', (data) => {
    console.log('📡 Received newMessage event:', data);

    // เรียก Electron / Web notification
    const title = `Message from ${data.fromCode}`;
    const body = `Type: ${data.type} → To: ${data.toCode}`;
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification(title, body);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  });

  window.socket = socket;
  return socket;
};


export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting WebSocket...');
    socket.disconnect();
    socket = null;
    window.socket = null;
  }
};

export const sendStatusUpdate = (agentCode, status) => {
  if (socket && socket.connected) {
    console.log('Sending status update via WebSocket:', { agentCode, status });
    socket.emit('update_status', {
      agentCode: agentCode.toUpperCase(),
      status: status
    });
    return true;
  }
  console.warn('Socket not connected, cannot send status update');
  return false;
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};

export const getSocket = () => socket;