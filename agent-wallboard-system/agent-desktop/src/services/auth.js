/**
 * Authentication Service
 * Handles token storage and retrieval with localStorage persistence
 */

const TOKEN_KEY = 'agent_auth_token';
const AGENT_DATA_KEY = 'agent_data';

/**
 * Save authentication token to localStorage
 * @param {string} token - JWT token
 */
export const saveToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Token saved to localStorage');
    return true;
  } catch (error) {
    console.error('❌ Failed to save token:', error);
    return false;
  }
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} - JWT token or null
 */
export const getToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ Failed to get token:', error);
    return null;
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    console.log('✅ Token removed from localStorage');
    return true;
  } catch (error) {
    console.error('❌ Failed to remove token:', error);
    return false;
  }
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

/**
 * Save agent data to localStorage
 * @param {Object} agentData - Agent information
 */
export const saveAgentData = (agentData) => {
  try {
    localStorage.setItem(AGENT_DATA_KEY, JSON.stringify(agentData));
    console.log('✅ Agent data saved to localStorage');
    return true;
  } catch (error) {
    console.error('❌ Failed to save agent data:', error);
    return false;
  }
};

/**
 * Get agent data from localStorage
 * @returns {Object|null} - Agent data or null
 */
export const getAgentData = () => {
  try {
    const data = localStorage.getItem(AGENT_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Failed to get agent data:', error);
    return null;
  }
};

/**
 * Remove agent data from localStorage
 */
export const removeAgentData = () => {
  try {
    localStorage.removeItem(AGENT_DATA_KEY);
    console.log('✅ Agent data removed from localStorage');
    return true;
  } catch (error) {
    console.error('❌ Failed to remove agent data:', error);
    return false;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  removeToken();
  removeAgentData();
  console.log('✅ All authentication data cleared');
};

/**
 * Verify token validity (basic check)
 * @param {string} token - JWT token
 * @returns {boolean}
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Basic JWT structure check (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration and if it's expired
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.log('⚠️ Token expired');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Token validation error:', error);
    return false;
  }
};

/**
 * Get stored auth state (token + agent data)
 * @returns {Object|null} - { token, agentData } or null
 */
export const getStoredAuth = () => {
  const token = getToken();
  const agentData = getAgentData();
  
  if (!token || !agentData) {
    return null;
  }
  
  // Validate token
  if (!isTokenValid(token)) {
    clearAuth();
    return null;
  }
  
  return { token, agentData };
};

/**
 * Save complete auth state
 * @param {string} token - JWT token
 * @param {Object} agentData - Agent information
 */
export const saveAuth = (token, agentData) => {
  saveToken(token);
  saveAgentData(agentData);
  console.log('✅ Complete auth state saved');
};

export default {
  saveToken,
  getToken,
  removeToken,
  isAuthenticated,
  saveAgentData,
  getAgentData,
  removeAgentData,
  clearAuth,
  isTokenValid,
  getStoredAuth,
  saveAuth
};