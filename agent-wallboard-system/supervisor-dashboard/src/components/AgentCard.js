// components/AgentCard.js - Version 4.0

import React from 'react';

function AgentCard({ agent, onSendMessage, onViewHistory }) {
  if (!agent) return null;

  const getStatusColor = (status) => {
    const colors = {
      Available: '#4CAF50',
      Busy: '#FF9800',
      Break: '#2196F3',
      Offline: '#9E9E9E'
    };
    return colors[status] || colors.Offline;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Agent: '#2196F3',
      Supervisor: '#FF9800',
      Admin: '#F44336'
    };
    return colors[role] || '#9E9E9E';
  };

  return (
    <div className="agent-card">
      <div className="agent-card-header">
        <div className="agent-avatar">
          <span>👤</span>
        </div>
        
        <div className="agent-info">
          {/* ✅ เปลี่ยนจาก agentName เป็น fullName */}
          <h4 className="agent-name">{agent.fullName}</h4>
          
          <div className="agent-meta">
            {/* ✅ เปลี่ยนจาก agentCode เป็น username */}
            <span className="agent-code">{agent.username}</span>
            
            {/* ✅ เพิ่มการแสดง role */}
            <span 
              className="role-badge"
              style={{ backgroundColor: getRoleBadgeColor(agent.role) }}
            >
              {agent.role}
            </span>
          </div>
        </div>
        
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(agent.status) }}
          title={agent.status}
        >
          <span className="status-dot"></span>
        </div>
      </div>
      
      <div className="agent-card-body">
        <div className="agent-details">
          {/* ✅ แสดง team info */}
          {agent.teamId && (
            <div className="detail-item">
              <span className="label">Team:</span>
              <span className="value">
                {agent.teamName || `Team ${agent.teamId}`}
              </span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="label">Status:</span>
            <span 
              className="value"
              style={{ color: getStatusColor(agent.status) }}
            >
              {agent.status}
            </span>
          </div>
          
          {agent.lastSeen && (
            <div className="detail-item">
              <span className="label">Last Seen:</span>
              <span className="value">
                {new Date(agent.lastSeen).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="agent-card-actions">
        <button
          className="btn btn-primary"
          onClick={() => onSendMessage(agent)}
          disabled={agent.status === 'Offline'}
        >
          💬 Send Message
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={() => onViewHistory(agent)}
        >
          📜 View History
        </button>
      </div>
    </div>
  );
}

export default AgentCard;