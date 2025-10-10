// components/LoginForm.js - Version 4.0

import React, { useState, useEffect } from 'react';
import { loginSupervisor, checkServerHealth } from '../services/api';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');  // ✅ เปลี่ยนจาก agentCode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('unknown');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      await checkServerHealth();
      setServerStatus('online');
    } catch (error) {
      setServerStatus('offline');
      setError('Backend server is not running.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validation
    if (!username || username.trim().length === 0) {
      setError('Username is required');
      return;
    }

    // ✅ Format validation (SP001-SP999)
    const supervisorRegex = /^SP\d{3}$/i;
    if (!supervisorRegex.test(username)) {
      setError('Invalid username format. Use SP001-SP999');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ Login with username
      const result = await loginSupervisor(username.toUpperCase());
      
      console.log('🔐 Login response:', result);
      
      // ✅ Validate response
      if (!result || !result.success) {
        throw new Error(result?.message || 'Login failed');
      }

      if (!result.user || !result.user.username) {
        throw new Error('Invalid response structure');
      }

      // ✅ Check role
      if (result.user.role !== 'Supervisor') {
        throw new Error('Access denied. Supervisor role required.');
      }

      const token = result.user.token || result.token;
      if (!token) {
        throw new Error('Missing authentication token');
      }

      console.log('✅ Supervisor login successful');
      
      // ✅ Send validated data
      onLogin(result.user, token);
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      if (err.message.includes('fetch')) {
        setError('Cannot connect to server. Check if backend is running.');
        setServerStatus('offline');
      } else if (err.message.includes('Access denied')) {
        setError('Access denied. This account is not a Supervisor.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <h2>👥 Supervisor Dashboard</h2>
          <p>Enter your supervisor username</p>
          
          <div className={`server-status ${serverStatus}`}>
            <span className="status-dot"></span>
            <span>Server: {serverStatus}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Supervisor Username</label>
            <input
              id="username"
              type="text"
              placeholder="e.g., SP001"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              disabled={loading || serverStatus === 'offline'}
              maxLength={5}
              autoFocus
            />
            <small className="hint">Format: SP001-SP999</small>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !username.trim() || serverStatus === 'offline'}
            className="login-btn"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
              {serverStatus === 'offline' && (
                <button 
                  type="button" 
                  onClick={checkHealth} 
                  className="retry-btn"
                >
                  Retry Connection
                </button>
              )}
            </div>
          )}
        </form>
        
        <div className="login-footer">
          <p>Sample accounts: SP001, SP002, SP003</p>
          <p className="help-text">
            Backend must be running on port 3001
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;