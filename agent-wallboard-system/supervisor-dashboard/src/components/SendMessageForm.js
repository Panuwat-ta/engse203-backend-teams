// components/SendMessageForm.js - Version 4.0

import React, { useState } from 'react';
import { sendMessage } from '../services/api';

function SendMessageForm({ supervisor, selectedAgent, onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('direct'); // 'direct' or 'broadcast'
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!content.trim()) {
      setError('Message content is required');
      return;
    }

    if (content.length > 500) {
      setError('Message is too long (max 500 characters)');
      return;
    }

    if (type === 'direct' && !selectedAgent) {
      setError('Please select an agent');
      return;
    }

    setSending(true);
    setError('');

    try {
      // ✅ Build message data
      const messageData = {
        fromCode: supervisor.username,  // ✅ ใช้ username เป็น code
        content: content.trim(),
        type: type,
        priority: priority
      };

      // ✅ Add toCode for direct messages
      if (type === 'direct') {
        messageData.toCode = selectedAgent.username;  // ✅ ใช้ username
      }

      console.log('📤 Sending message:', messageData);

      const result = await sendMessage(messageData);

      if (result.success) {
        console.log('✅ Message sent successfully');
        
        // Clear form
        setContent('');
        setType('direct');
        setPriority('normal');
        
        // Callback
        if (onSuccess) {
          onSuccess(result.message);
        }
        
        // Close modal after short delay
        setTimeout(() => {
          if (onClose) onClose();
        }, 500);
      }
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="send-message-form">
      <div className="form-header">
        <h3>
          {type === 'direct' 
            ? `📩 Send to ${selectedAgent?.fullName || 'Agent'}` 
            : '📢 Broadcast Message'
          }
        </h3>
        {onClose && (
          <button onClick={onClose} className="btn-close">✕</button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Message Type */}
        <div className="form-group">
          <label>Message Type:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="direct"
                checked={type === 'direct'}
                onChange={(e) => setType(e.target.value)}
                disabled={!selectedAgent}
              />
              <span>Direct Message</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="broadcast"
                checked={type === 'broadcast'}
                onChange={(e) => setType(e.target.value)}
              />
              <span>Broadcast to Team</span>
            </label>
          </div>
        </div>

        {/* Recipient Info (Direct only) */}
        {type === 'direct' && selectedAgent && (
          <div className="recipient-info">
            <strong>To:</strong> {selectedAgent.fullName} ({selectedAgent.username})
          </div>
        )}

        {/* Priority */}
        <div className="form-group">
          <label>Priority:</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            className="form-select"
          >
            <option value="low">🔵 Low</option>
            <option value="normal">⚪ Normal</option>
            <option value="high">🔴 High</option>
          </select>
        </div>

        {/* Message Content */}
        <div className="form-group">
          <label>Message:</label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError('');
            }}
            placeholder="Type your message here..."
            rows={5}
            maxLength={500}
            className="form-textarea"
            disabled={sending}
          />
          <div className="char-count">
            {content.length}/500 characters
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          {onClose && (
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary"
              disabled={sending}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={sending || !content.trim()}
          >
            {sending ? 'Sending...' : `Send ${type === 'broadcast' ? 'Broadcast' : 'Message'}`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SendMessageForm;