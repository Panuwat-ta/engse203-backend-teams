// routes/agents.js - เชื่อม routes กับ controllers
const express = require('express');
const agentController = require('../controllers/agentController');
const { validateAgent, validateStatusUpdate } = require('../middleware/validation');

const router = express.Router();

// GET /api/agents - List all agents
router.get('/', agentController.getAllAgents);

// GET /api/agents/status/summary - ต้องมาก่อน /:id route
router.get('/status/summary', agentController.getStatusSummary);

//Agent Search API วางผิดที่ยิงยังไงก็ไม่เจอ??ทำไมครับ
router.get('/search', agentController.searchAgents);

// GET /api/agents/department/stats - Department statistics
router.get('/department/stats', agentController.getDepartmentStatistics);

// GET /api/agents/:id/status/history - Get status change history
router.get('/:id/status/history', agentController.getStatusHistory);

// GET /api/agents/:id - Get specific agent
router.get('/:id', agentController.getAgentById);

// POST /api/agents - Create new agent (with validation)
router.post('/', validateAgent, agentController.createAgent);

// PUT /api/agents/:id - Update agent
router.put('/:id', agentController.updateAgent);

// PATCH /api/agents/:id/status - Update status (with validation)
router.patch('/:id/status', validateStatusUpdate, agentController.updateAgentStatus);

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', agentController.deleteAgent);





module.exports = router;