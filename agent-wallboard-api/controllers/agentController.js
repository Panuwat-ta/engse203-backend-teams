// controllers/agentController.js - MongoDB version
const { Agent } = require('../models/Agent');
const { AGENT_STATUS, VALID_STATUS_TRANSITIONS, API_MESSAGES } = require('../utils/constants');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const agentController = {

  // GET /api/agents/:id
  getAgentById: async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await Agent.findById(id);

      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      console.log(`📋 Retrieved agent: ${agent.agentCode}`);
      return sendSuccess(res, 'Agent retrieved successfully', agent.toJSON());
    } catch (error) {
      console.error('Error in getAgentById:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // GET /api/agents
  getAllAgents: async (req, res) => {
    try {
      const { status, department } = req.query;
      const filter = {};

      if (status) filter.status = status;
      if (department) filter.department = department;

      const agentList = await Agent.find(filter);
      console.log(`📋 Retrieved ${agentList.length} agents`);
      return sendSuccess(
        res,
        'Agents retrieved successfully',
        agentList.map(agent => agent.toJSON())
      );
    } catch (error) {
      console.error('Error in getAllAgents:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // POST /api/agents
  createAgent: async (req, res) => {
    try {
      const agentData = req.body;

      // ตรวจสอบว่า agentCode ซ้ำไหม
      const existingAgent = await Agent.findOne({ agentCode: agentData.agentCode });
      if (existingAgent) {
        return sendError(res, `Agent code ${agentData.agentCode} already exists`, 409);
      }

      const newAgent = new Agent(agentData);
      await newAgent.save();

      console.log(`✅ Created agent: ${newAgent.agentCode}`);
      return sendSuccess(res, API_MESSAGES.AGENT_CREATED, newAgent.toJSON(), 201);
    } catch (error) {
      console.error('Error in createAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // PUT /api/agents/:id
  updateAgent: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, department, skills } = req.body;

      const agent = await Agent.findById(id);
      if (!agent) return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);

      // Update allowed fields
      if (name) agent.name = name;
      if (email) agent.email = email;
      if (department) agent.department = department;
      if (skills) agent.skills = skills;
      agent.updatedAt = new Date();

      await agent.save();
      console.log(`✏️ Updated agent: ${agent.agentCode}`);
      return sendSuccess(res, API_MESSAGES.AGENT_UPDATED, agent.toJSON());
    } catch (error) {
      console.error('Error in updateAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // PATCH /api/agents/:id/status
  updateAgentStatus: async (req, res) => {
    try {
      const { status, reason } = req.body;
      const agent = await Agent.findById(req.params.id);
      if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

      // อัปเดต status
      agent.status = status;
      agent.statusHistory = agent.statusHistory || [];
      agent.statusHistory.push({ status, reason, updatedAt: new Date() });
      await agent.save();

      // 🔴 ส่ง real-time update ผ่าน req.io
      req.io.emit('agentStatusChanged', {
        agentId: agent._id,
        agentCode: agent.agentCode,
        newStatus: agent.status,
        timestamp: new Date()
      });

      res.json({ success: true, data: agent });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },



  // DELETE /api/agents/:id
  deleteAgent: async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await Agent.findByIdAndDelete(id);

      if (!agent) return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);

      console.log(`🗑️ Deleted agent: ${agent.agentCode} - ${agent.name}`);
      return sendSuccess(res, API_MESSAGES.AGENT_DELETED);
    } catch (error) {
      console.error('Error in deleteAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // GET /api/agents/status/summary
  getStatusSummary: async (req, res) => {
    try {
      const totalAgents = await Agent.countDocuments();

      const statusCounts = {};
      for (const status of Object.values(AGENT_STATUS)) {
        statusCounts[status] = await Agent.countDocuments({ status });
      }

      const statusPercentages = {};
      Object.entries(statusCounts).forEach(([status, count]) => {
        statusPercentages[status] = totalAgents > 0 ? Math.round((count / totalAgents) * 100) : 0;
      });

      const summary = {
        totalAgents,
        statusCounts,
        statusPercentages,
        lastUpdated: new Date().toISOString(),
      };

      return sendSuccess(res, 'Status summary retrieved successfully', summary);
    } catch (error) {
      console.error('Error in getStatusSummary:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // Agent Search API
  searchAgents: async (req, res) => {
    try {
      console.log('🔍 [searchAgents] called with query:', req.query);

      const { q = '', fields = '' } = req.query;
      const keyword = q.trim().toLowerCase();
      const selectedFields = fields.split(',').map(f => f.trim()).filter(f => f);

      // MongoDB regex search
      const results = await Agent.find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
          { agentCode: { $regex: keyword, $options: 'i' } },
        ],
      });

      const response = results.map(agent => {
        const data = agent.toJSON();
        if (selectedFields.length === 0) return data;
        return Object.fromEntries(
          selectedFields.map(f => [f, data[f]]).filter(([key, val]) => val !== undefined)
        );
      });

      console.log(`✅ [searchAgents] found ${response.length} result(s)`);
      res.json({ success: true, total: response.length, results: response });
    } catch (error) {
      console.error('Error in searchAgents:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // Department Statistics
  getDepartmentStatistics: async (req, res) => {
    try {
      const agents = await Agent.find();

      const summary = {};
      agents.forEach(agent => {
        const dept = agent.department || 'Unknown';
        const status = agent.status || 'Unknown';

        if (!summary[dept]) summary[dept] = { total: 0 };
        summary[dept].total += 1;
        summary[dept][status] = (summary[dept][status] || 0) + 1;
      });

      return sendSuccess(res, 'Department statistics retrieved successfully', {
        summary,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in getDepartmentStatistics:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // Status History
  getStatusHistory: async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await Agent.findById(id);

      if (!agent) return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);

      return sendSuccess(res, 'Status history retrieved successfully', agent.statusHistory);
    } catch (error) {
      console.error('Error in getStatusHistory:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

};

module.exports = agentController;
