// App.js - Version 4.0 (Backend v1.2 Compatible)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoginForm from './components/LoginForm';
import AgentInfo from './components/AgentInfo';
import StatusPanel from './components/StatusPanel';
import MessagePanel from './components/MessagePanel';
import {
  setAuthToken,
  getMessages,
  updateAgentStatus,
  logoutAgent
} from './services/api';
import {
  connectSocket,
  disconnectSocket,
  sendStatusUpdate
} from './services/socket';
import {
  showDesktopNotification,
  requestNotificationPermission
} from './services/notifications';
import logger from './utils/logger';
import './styles/App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agent, setAgent] = useState(null);
  const [status, setStatus] = useState('Offline');
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef(null);
  const isLoggedInRef = useRef(false);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    requestNotificationPermission();
    logger.info('App initialized');
  }, []);

  /**
   * ✅ Load messages - ใช้ username
   */
  const loadMessages = useCallback(async (username) => {
    if (!username) {
      console.error('❌ loadMessages: username is required');
      return;
    }

    setLoadingMessages(true);
    try {
      logger.log('Loading messages for', username);
      const messagesData = await getMessages(username, 50);

      if (messagesData.success) {
        const messageList = messagesData.messages || [];
        logger.log('Loaded', messageList.length, 'messages');
        setMessages(messageList);
      }
    } catch (error) {
      logger.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /**
   * ✅ WebSocket connection
   * username = agentCode (format เดียวกัน)
   */
  useEffect(() => {
    if (!isLoggedIn || !agent) {
      console.log('⏸️ Skipping WebSocket - not logged in');
      return;
    }

    if (!agent.username) {
      console.error('❌ Agent missing username:', agent);
      setError('Invalid user data');
      return;
    }

    // ✅ ใช้ username เป็น agentCode
    const agentCode = agent.username;
    logger.log('🔌 Setting up WebSocket for', agentCode, agent.role);
    
    const socket = connectSocket(agentCode, agent.role);
    
    if (!socket) {
      console.error('❌ Failed to create socket');
      setError('Failed to connect to server');
      return;
    }

    socketRef.current = socket;

    const handlers = {
      connect: () => {
        logger.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
      },

      disconnect: (reason) => {
        logger.log('🔌 WebSocket disconnected:', reason);
        setConnectionStatus('disconnected');
      },

      connect_error: (error) => {
        logger.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
        setError('Connection error');
      },

      reconnect: (attemptNumber) => {
        logger.log('🔄 Reconnected after', attemptNumber, 'attempts');
        setConnectionStatus('connected');
        setError(null);
      },

      connection_success: (data) => {
        logger.log('✅ Auth successful:', data);
      },

      connection_error: (error) => {
        logger.error('❌ Connection error:', error);
        setError(error.message || 'Connection error');
      },

      status_updated: (data) => {
        logger.log('📊 Status updated:', data);
        setStatus(data.status);
      },

      status_error: (error) => {
        logger.error('❌ Status error:', error);
        setError(error.message || 'Status update failed');
      },

      new_message: (message) => {
        console.log('📨 New message received:', message);
        
        if (!message || !message.content) {
          console.error('❌ Invalid message');
          return;
        }

        if (!isLoggedInRef.current) {
          console.error('❌ Not logged in');
          return;
        }

        console.log('📝 Adding message...');
        setMessages(prev => {
          const isDuplicate = prev.some(m =>
            m._id === message._id || m.messageId === message.messageId
          );

          if (isDuplicate) {
            console.warn('⚠️ Duplicate');
            return prev;
          }

          console.log('✅ Added');
          return [message, ...prev];
        });

        const title = message.type === 'broadcast'
          ? `Broadcast from ${message.fromCode || message.fromUsername}`
          : `Message from ${message.fromCode || message.fromUsername}`;

        showDesktopNotification(title, message.content);
      }
    };

    // Register handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup
    return () => {
      logger.log('🧹 Cleanup WebSocket');
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      disconnectSocket();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    };
  }, [isLoggedIn, agent]);

  /**
   * ✅ Handle login
   */
  const handleLogin = useCallback(async (userData, token) => {
    console.log('🔐 Login successful:', userData);

    if (!userData || !userData.username) {
      console.error('❌ Invalid login data:', userData);
      setError('Invalid user data');
      return;
    }

    setAuthToken(token);
    setAgent(userData);
    setIsLoggedIn(true);
    setStatus(userData.status === 'Active' ? 'Available' : 'Offline');
    setError(null);

    // ✅ Load messages ด้วย username
    await loadMessages(userData.username);
  }, [loadMessages]);

  /**
   * ✅ Handle logout
   */
  const handleLogout = useCallback(async () => {
    logger.log('👋 Logging out');

    try {
      await logoutAgent();
    } catch (error) {
      logger.error('Logout failed:', error);
    }

    disconnectSocket();
    setIsLoggedIn(false);
    setAgent(null);
    setStatus('Offline');
    setMessages([]);
    setConnectionStatus('disconnected');
    setError(null);
  }, []);

  /**
   * ✅ Handle status change
   */
  const handleStatusChange = useCallback(async (newStatus) => {
    if (!agent || !agent.username) {
      console.error('❌ No agent data');
      setError('User data not available');
      return;
    }

    const agentCode = agent.username;
    logger.log('📊 Changing status to:', newStatus);

    const previousStatus = status;
    setStatus(newStatus);

    try {
      const socketSuccess = sendStatusUpdate(agentCode, newStatus);

      if (socketSuccess) {
        logger.log('✅ Status sent via WebSocket');
      } else {
        logger.log('🔄 HTTP fallback');
        await updateAgentStatus(agent.username, newStatus);
        logger.log('✅ Status updated via HTTP');
      }
    } catch (error) {
      logger.error('❌ Status update failed:', error);
      setStatus(previousStatus);
      setError('Failed to update status');
      setTimeout(() => setError(null), 3000);
    }
  }, [agent, status]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="app">
      <div className={`connection-status ${connectionStatus}`}>
        <div className="status-indicator"></div>
        <span>
          {connectionStatus === 'connected' && '✅ Connected'}
          {connectionStatus === 'disconnected' && '⚠️ Disconnected'}
          {connectionStatus === 'error' && '❌ Connection Error'}
        </span>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      {!isLoggedIn ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <div className="dashboard">
          <div className="dashboard-header">
            <AgentInfo agent={agent} status={status} />
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>

          <StatusPanel
            currentStatus={status}
            onStatusChange={handleStatusChange}
            disabled={connectionStatus !== 'connected'}
          />

          <MessagePanel
            messages={messages}
            username={agent?.username}
            loading={loadingMessages}
          />
        </div>
      )}
    </div>
  );
}

export default App;