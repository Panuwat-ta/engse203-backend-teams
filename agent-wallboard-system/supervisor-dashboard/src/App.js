// App.js - Version 4.0 (Supervisor Dashboard)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AgentList from './components/AgentList';
import SendMessageForm from './components/SendMessageForm';
import MessageHistory from './components/MessageHistory';
import {
  setAuthToken,
  logout as apiLogout
} from './services/api';
import {
  connectSocket,
  disconnectSocket,
  getSocket
} from './services/socket';
import logger from './utils/logger';
import './App.css';
import './styles/components.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [supervisor, setSupervisor] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  
  // ✅ Modal states
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showMessageHistory, setShowMessageHistory] = useState(false);

  const socketRef = useRef(null);
  const isLoggedInRef = useRef(false);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    logger.info('Supervisor Dashboard initialized');
  }, []);

  /**
   * ✅ WebSocket connection for Supervisors
   */
  useEffect(() => {
    if (!isLoggedIn || !supervisor) {
      console.log('⏸️ Skipping WebSocket - not logged in');
      return;
    }

    if (!supervisor.username) {
      console.error('❌ Supervisor missing username:', supervisor);
      setError('Invalid supervisor data');
      return;
    }

    // ✅ ใช้ username เป็น code สำหรับ WebSocket
    const supervisorCode = supervisor.username;
    logger.log('🔌 Setting up WebSocket for', supervisorCode, supervisor.role);
    
    const socket = connectSocket(supervisorCode, supervisor.role);
    
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

      // ✅ Agent status updates
      agent_status_updated: (data) => {
        logger.log('📊 Agent status updated:', data);
        // Trigger agent list refresh
        // You can emit custom event here
        window.dispatchEvent(new CustomEvent('agent-status-updated', { detail: data }));
      },

      // ✅ New message notification
      message_sent: (data) => {
        logger.log('✅ Message sent notification:', data);
        // Show toast notification
        window.dispatchEvent(new CustomEvent('message-sent', { detail: data }));
      },

      // ✅ Agent connected/disconnected
      agent_connected: (data) => {
        logger.log('✅ Agent connected:', data);
        window.dispatchEvent(new CustomEvent('agent-connected', { detail: data }));
      },

      agent_disconnected: (data) => {
        logger.log('🔌 Agent disconnected:', data);
        window.dispatchEvent(new CustomEvent('agent-disconnected', { detail: data }));
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
  }, [isLoggedIn, supervisor]);

  /**
   * ✅ Handle login
   */
  const handleLogin = useCallback(async (userData, token) => {
    console.log('🔐 Supervisor login successful:', userData);

    if (!userData || !userData.username) {
      console.error('❌ Invalid login data:', userData);
      setError('Invalid supervisor data');
      return;
    }

    // ✅ Verify role
    if (userData.role !== 'Supervisor') {
      setError('Access denied. Supervisor role required.');
      return;
    }

    setAuthToken(token);
    setSupervisor(userData);
    setIsLoggedIn(true);
    setError(null);
  }, []);

  /**
   * ✅ Handle logout
   */
  const handleLogout = useCallback(async () => {
    logger.log('👋 Logging out');

    try {
      await apiLogout();
    } catch (error) {
      logger.error('Logout failed:', error);
    }

    disconnectSocket();
    setIsLoggedIn(false);
    setSupervisor(null);
    setConnectionStatus('disconnected');
    setError(null);
    setShowSendMessage(false);
    setSelectedAgent(null);
    setShowMessageHistory(false);
  }, []);

  /**
   * ✅ Handle send message
   */
  const handleSendMessage = useCallback((agent) => {
    setSelectedAgent(agent);
    setShowSendMessage(true);
  }, []);

  /**
   * ✅ Handle view history
   */
  const handleViewHistory = useCallback((agent) => {
    setSelectedAgent(agent);
    setShowMessageHistory(true);
  }, []);

  /**
   * ✅ Handle message sent success
   */
  const handleMessageSent = useCallback((message) => {
    console.log('✅ Message sent:', message);
    // You can show a toast notification here
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="app supervisor-dashboard">
      {/* Connection Status */}
      <div className={`connection-status ${connectionStatus}`}>
        <div className="status-indicator"></div>
        <span>
          {connectionStatus === 'connected' && '✅ Connected'}
          {connectionStatus === 'disconnected' && '⚠️ Disconnected'}
          {connectionStatus === 'error' && '❌ Connection Error'}
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      {/* Main Content */}
      {!isLoggedIn ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <>
          {/* Dashboard Header */}
          <Dashboard 
            supervisor={supervisor}
            onLogout={handleLogout}
            connectionStatus={connectionStatus}
          />

          {/* Agent List */}
          <AgentList
            supervisor={supervisor}
            onSendMessage={handleSendMessage}
            onViewHistory={handleViewHistory}
          />

          {/* Send Message Modal */}
          {showSendMessage && (
            <div className="modal-overlay" onClick={() => setShowSendMessage(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <SendMessageForm
                  supervisor={supervisor}
                  selectedAgent={selectedAgent}
                  onClose={() => setShowSendMessage(false)}
                  onSuccess={handleMessageSent}
                />
              </div>
            </div>
          )}

          {/* Message History Modal */}
          {showMessageHistory && selectedAgent && (
            <div className="modal-overlay" onClick={() => setShowMessageHistory(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <MessageHistory
                  agent={selectedAgent}
                  onClose={() => setShowMessageHistory(false)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;