// components/AgentList.js - Version 4.0

import React, { useState, useEffect } from 'react';
import AgentCard from './AgentCard';
import { getAgents } from '../services/api';

function AgentList({ supervisor, onSendMessage, onViewHistory }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ เพิ่ม filter states
  const [roleFilter, setRoleFilter] = useState('Agent'); // เฉพาะ Agent by default
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load agents on mount และเมื่อ filter เปลี่ยน
  useEffect(() => {
    loadAgents();
  }, [roleFilter, statusFilter, supervisor?.teamId]);

  const loadAgents = async () => {
    if (!supervisor?.teamId) {
      console.log('⏸️ No team ID, skipping agent load');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Build filters object
      const filters = {
        teamId: supervisor.teamId,  // เฉพาะทีมของ supervisor
        role: roleFilter,            // ✅ Filter by role
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      console.log('📡 Loading agents with filters:', filters);
      
      const result = await getAgents(filters);

      if (result.success) {
        setAgents(result.agents || []);
        console.log('✅ Loaded', result.agents?.length || 0, 'agents');
      }
    } catch (err) {
      console.error('❌ Failed to load agents:', err);
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Client-side search filter
  const filteredAgents = agents.filter(agent => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      agent.username.toLowerCase().includes(term) ||
      agent.fullName.toLowerCase().includes(term)
    );
  });

  // ✅ Group agents by status
  const groupedAgents = {
    Available: filteredAgents.filter(a => a.status === 'Available'),
    Busy: filteredAgents.filter(a => a.status === 'Busy'),
    Break: filteredAgents.filter(a => a.status === 'Break'),
    Offline: filteredAgents.filter(a => a.status === 'Offline')
  };

  return (
    <div className="agent-list">
      {/* Header */}
      <div className="agent-list-header">
        <h3>
          Team Agents ({filteredAgents.length})
        </h3>
        
        <button 
          onClick={loadAgents} 
          className="btn-refresh"
          disabled={loading}
          title="Refresh agent list"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      {/* Filters */}
      <div className="agent-filters">
        {/* ✅ Role Filter */}
        <div className="filter-group">
          <label>Role:</label>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="Agent">Agents Only</option>
            <option value="Supervisor">Supervisors Only</option>
            <option value="">All Roles</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="Break">Break</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        {/* ✅ Search */}
        <div className="filter-group search-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Username or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
          <button onClick={loadAgents} className="btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading agents...</p>
        </div>
      )}

      {/* Agent Cards */}
      {!loading && !error && (
        <div className="agent-list-content">
          {filteredAgents.length === 0 ? (
            <div className="no-agents">
              <div className="no-agents-icon">🔍</div>
              <p>No agents found</p>
              <small>
                {searchTerm 
                  ? 'Try a different search term'
                  : 'No agents in your team'
                }
              </small>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="agent-stats">
                <div className="stat-item available">
                  <span className="stat-label">Available:</span>
                  <span className="stat-value">{groupedAgents.Available.length}</span>
                </div>
                <div className="stat-item busy">
                  <span className="stat-label">Busy:</span>
                  <span className="stat-value">{groupedAgents.Busy.length}</span>
                </div>
                <div className="stat-item break">
                  <span className="stat-label">Break:</span>
                  <span className="stat-value">{groupedAgents.Break.length}</span>
                </div>
                <div className="stat-item offline">
                  <span className="stat-label">Offline:</span>
                  <span className="stat-value">{groupedAgents.Offline.length}</span>
                </div>
              </div>

              {/* Agent Cards Grid */}
              <div className="agent-grid">
                {filteredAgents.map(agent => (
                  <AgentCard
                    key={agent.id || agent.username}
                    agent={agent}
                    onSendMessage={onSendMessage}
                    onViewHistory={onViewHistory}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AgentList;