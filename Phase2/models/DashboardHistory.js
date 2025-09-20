const mongoose = require('mongoose');

const DashboardHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  totalAgents: Number,
  onlineAgents: Number,
  offlineAgents: Number,
  avgResponseTime: Number,
  statusBreakdown: Object
});

module.exports = mongoose.model('DashboardHistory', DashboardHistorySchema);
