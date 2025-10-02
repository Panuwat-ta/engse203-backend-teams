const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Agent = require('../models/Agent');
const { transformAgent, transformAgents } = require('../utils/transformers');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach decoded token to request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
};

/**
 * POST /api/auth/login
 * Agent/Supervisor login
 */
router.post('/login', async (req, res) => {
  try {
    const { agentCode, supervisorCode } = req.body;
    
    // Determine login type
    const code = (agentCode || supervisorCode || '').toUpperCase();
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Agent code or Supervisor code is required'
      });
    }
    
    // Find user
    const user = await Agent.findByCode(code);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // For supervisors, get team members
    let teamData = null;
    let rawTeamData = null;
    
    if (user.role === 'supervisor') {
      rawTeamData = await Agent.findByTeam(user.team_id);
      console.log('Raw team data from DB:', rawTeamData);
      
      teamData = transformAgents(rawTeamData);
      console.log('Transformed team data:', teamData);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        agentCode: user.agent_code,
        role: user.role,
        teamId: user.team_id
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Response - return both 'user' and 'agent' for compatibility
    const transformedUser = transformAgent(user);
    
    res.json({
      success: true,
      data: {
        user: transformedUser,
        agent: transformedUser, // Add 'agent' key for desktop app compatibility
        teamData: teamData,
        token: token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify existing JWT token and return user data
 */
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const { agentCode } = req.user;
    
    if (!agentCode) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token data'
      });
    }
    
    // Find user
    const user = await Agent.findByCode(agentCode);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // For supervisors, get team members
    let teamData = null;
    
    if (user.role === 'supervisor') {
      const rawTeamData = await Agent.findByTeam(user.team_id);
      teamData = transformAgents(rawTeamData);
    }
    
    // Response - return both 'user' and 'agent' for compatibility
    const transformedUser = transformAgent(user);
    
    res.json({
      success: true,
      data: {
        user: transformedUser,
        agent: transformedUser, // Add 'agent' key for desktop app compatibility
        teamData: teamData
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Optional: Update agent status to Offline on logout
    const { agentCode } = req.user;
    
    if (agentCode) {
      try {
        await Agent.updateStatus(agentCode, 'Offline');
        console.log(`Agent ${agentCode} status set to Offline on logout`);
      } catch (error) {
        console.error('Failed to update status on logout:', error);
        // Don't fail logout if status update fails
      }
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token (optional - for extending sessions)
 */
router.post('/refresh', verifyToken, (req, res) => {
  try {
    const { agentCode, role, teamId } = req.user;
    
    // Generate new token
    const newToken = jwt.sign(
      {
        agentCode,
        role,
        teamId
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Export middleware for use in other routes
module.exports = router;
module.exports.verifyToken = verifyToken;