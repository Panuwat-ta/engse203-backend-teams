import { getToken, saveAuth, clearAuth } from './auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Get auth token from auth service
 */
export const getAuthToken = () => getToken();

/**
 * Set auth token (for backward compatibility)
 */
export const setAuthToken = (token) => {
  // This is now handled by auth.js
  console.log('Auth token set via api.js');
};

/**
 * Clear auth token (for backward compatibility)
 */
export const clearAuthToken = () => {
  clearAuth();
  console.log('Auth token cleared');
};

/**
 * Login agent
 */
export const loginAgent = async (agentCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentCode })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Save token and agent data to localStorage
    if (data.data?.token && data.data?.agent) {
      saveAuth(data.data.token, data.data.agent);
    }
    
    return data;
  } catch (error) {
    console.error('Login API Error:', error);
    throw error;
  }
};

/**
 * Logout agent
 */
export const logoutAgent = async () => {
  try {
    const token = getToken();
    
    if (!token) {
      clearAuth();
      return { success: true };
    }

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    clearAuth();
    return data;
  } catch (error) {
    console.error('Logout API Error:', error);
    clearAuth();
    throw error;
  }
};

/**
 * Verify existing token
 */
export const verifyToken = async () => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Token verification failed');
    }
    
    return data;
  } catch (error) {
    console.error('Token Verification Error:', error);
    clearAuth();
    throw error;
  }
};

/**
 * Get messages for agent
 */
export const getMessages = async (agentCode, limit = 50, unreadOnly = false) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}/messages/agent/${agentCode}?limit=${limit}&unreadOnly=${unreadOnly}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get messages');
    }
    
    return data;
  } catch (error) {
    console.error('Get Messages API Error:', error);
    throw error;
  }
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark message as read');
    }
    
    return data;
  } catch (error) {
    console.error('Mark Read API Error:', error);
    throw error;
  }
};

/**
 * Update agent status
 */
export const updateAgentStatus = async (agentCode, status) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/agents/${agentCode}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update status');
    }
    
    return data;
  } catch (error) {
    console.error('Update Status API Error:', error);
    throw error;
  }
};

/**
 * Get status history
 */
export const getStatusHistory = async (agentCode, limit = 50) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/agents/${agentCode}/history?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get status history');
    }
    
    return data;
  } catch (error) {
    console.error('Get Status History API Error:', error);
    throw error;
  }
};

/**
 * Check server health
 */
export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
    
    return data;
  } catch (error) {
    console.error('Health Check Error:', error);
    throw error;
  }
};