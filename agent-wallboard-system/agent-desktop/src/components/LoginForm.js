// components/LoginForm.js - Version 4.0

import React, { useState, useEffect } from 'react';
import { loginAgent, checkServerHealth } from '../services/api';
import { validateAgentCode } from '../utils/validation';

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
    
    // ✅ Validate username (ใช้ function เดิมได้เพราะ format เหมือนกัน)
    const validationError = validateAgentCode(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ Login with username
      const result = await loginAgent(username.toUpperCase());
      
      console.log('🔐 Login response:', result);
      
      // ✅ Validate response structure
      if (!result || !result.success) {
        throw new Error(result?.message || 'Login failed');
      }

      if (!result.user) {
        throw new Error('Invalid response - missing user data');
      }

      if (!result.user.username) {
        throw new Error('Invalid response - missing username');
      }

      const token = result.user.token || result.token;
      if (!token) {
        throw new Error('Invalid response - missing token');
      }

      console.log('✅ Login successful:', result.user);
      
      // ✅ Send validated data
      onLogin(result.user, token);
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      if (err.message.includes('fetch')) {
        setError('Cannot connect to server. Check if backend is running.');
        setServerStatus('offline');
      } else {
        setError(err.message || 'Network error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    checkHealth();
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <h2>Agent Login</h2>
          <p>Enter your username to continue</p>
          
          <div className={`server-status ${serverStatus}`}>
            <span className="status-dot"></span>
            <span>Server: {serverStatus}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            {/* ✅ เปลี่ยน label และ id */}
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="e.g., AG001, SP001, AD001"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              disabled={loading || serverStatus === 'offline'}
              maxLength={5}
              autoFocus
            />
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
                  onClick={handleRetry} 
                  className="retry-btn"
                >
                  Retry Connection
                </button>
              )}
            </div>

        )}
        </form>
        
        <div className="login-footer">
          <p>Sample codes: AG001, AG002, SP001, AD001</p>
          <p className="help-text">
            Backend must be running on port 3001
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;