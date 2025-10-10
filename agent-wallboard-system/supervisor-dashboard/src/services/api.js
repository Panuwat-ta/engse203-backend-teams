// services/api.js - Version 4.0 (Supervisor Dashboard)

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
let authToken = null;

// ========================================
// Token Management
// ========================================

export const setAuthToken = (token) => {
  authToken = token;
  console.log('✅ Auth token set');
};

export const clearAuthToken = () => {
  authToken = null;
  console.log('🗑️ Auth token cleared');
};

export const getAuthToken = () => authToken;

// ========================================
// Authentication
// ========================================

/**
 * ✅ Login for Supervisors (Backend v1.2)
 */
export const loginSupervisor = async (username) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    if (!data.success || !data.user) {
      throw new Error('Invalid response structure');
    }

    // Check role
    if (data.user.role !== 'Supervisor') {
      throw new Error('Access denied. Supervisor role required.');
    }

    const token = data.user.token || data.token;
    if (token) {
      setAuthToken(token);
    }
    
    console.log('✅ Supervisor login successful');
    return data;
  } catch (error) {
    console.error('❌ Login API Error:', error);
    throw error;
  }
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    clearAuthToken();
    console.log('✅ Logout successful');
    return data;
  } catch (error) {
    console.error('❌ Logout API Error:', error);
    clearAuthToken();
    throw error;
  }
};

// ========================================
// Agent APIs
// ========================================

/**
 * ✅ Get agents with filters (Backend v1.2)
 */
export const getAgents = async (filters = {}) => {
  try {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams();
    
    if (filters.teamId) {
      params.append('teamId', filters.teamId);
    }
    
    if (filters.role) {
      params.append('role', filters.role);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }

    const url = `${API_BASE_URL}/agents?${params.toString()}`;
    console.log('📡 Fetching agents:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get agents');
    }
    
    console.log('✅ Loaded', data.agents?.length || 0, 'agents');
    return data;
  } catch (error) {
    console.error('❌ Get Agents API Error:', error);
    throw error;
  }
};

/**
 * Get agent by username
 */
export const getAgentByUsername = async (username) => {
  try {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/agents/${username}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get agent');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Get Agent Error:', error);
    throw error;
  }
};

// ========================================
// Message APIs
// ========================================

/**
 * ✅ Send message (ไม่เปลี่ยนแปลง - ยังใช้ code)
 */
export const sendMessage = async (messageData) => {
  try {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fromCode: messageData.fromCode,
        toCode: messageData.toCode,
        content: messageData.content,
        type: messageData.type,
        priority: messageData.priority || 'normal'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }
    
    console.log('✅ Message sent successfully');
    return data;
  } catch (error) {
    console.error('❌ Send Message API Error:', error);
    throw error;
  }
};

/**
 * ✅ Get message history by username
 */
export const getMessageHistory = async (username, limit = 50) => {
  try {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}/messages/agent/${username}?limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get message history');
    }
    
    console.log('✅ Loaded', data.messages?.length || 0, 'messages');
    return data;
  } catch (error) {
    console.error('❌ Get Message History Error:', error);
    throw error;
  }
};

/**
 * Get sent messages (by supervisor)
 */
export const getSentMessages = async (username, limit = 50) => {
  try {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}/messages/sent/${username}?limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get sent messages');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Get Sent Messages Error:', error);
    throw error;
  }
};

// ========================================
// Health Check
// ========================================

export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
    
    console.log('✅ Server healthy');
    return data;
  } catch (error) {
    console.error('❌ Health Check Error:', error);
    throw error;
  }
};