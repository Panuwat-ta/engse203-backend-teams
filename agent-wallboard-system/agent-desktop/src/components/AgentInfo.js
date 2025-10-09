// components/AgentInfo.js - Version 4.0

import React from 'react';

function AgentInfo({ agent, status }) {
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

  return (
    <div className="agent-info">
      <div className="agent-avatar">
        <span>👤</span>
      </div>
      
      <div className="agent-details">
        {/* ✅ เปลี่ยนจาก agentName เป็น fullName */}
        <h3 className="agent-name">{agent.fullName}</h3>
        
        <div className="agent-meta">
          <div className="agent-code">
            <span className="label">Code:</span>
            {/* ✅ เปลี่ยนจาก agentCode เป็น username */}
            <span className="value">{agent.username}</span>
          </div>
          
          {/* ✅ เพิ่มการแสดง role */}
          <div className="agent-role">
            <span className="label">Role:</span>
            <span className="value">{agent.role}</span>
          </div>
          
          {/* ✅ แสดง Team เฉพาะ Agent/Supervisor */}
          {(agent.role === 'Agent' || agent.role === 'Supervisor') && (
            <div className="agent-team">
              <span className="label">Team:</span>
              <span className="value">
                {agent.teamName || `Team ${agent.teamId}` || 'N/A'}
              </span>
            </div>
          )}
        </div>
        
        <div className="agent-status">
          <span 
            className="status-dot"
            style={{ backgroundColor: getStatusColor(status) }}
          ></span>
          {/* ✅ แสดง status จาก user object หรือ prop */}
          <span className="status-text">{agent.status || status}</span>
        </div>
      </div>
    </div>
  );
}

export default AgentInfo;