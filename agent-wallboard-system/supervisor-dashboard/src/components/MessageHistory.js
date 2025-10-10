// src/components/MessageHistory.js
import React, { useState, useEffect } from 'react';
import { getMessageHistory as fetchMessageHistory } from '../services/api';

const MessageHistory = ({ agent, onClose }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const loadMessages = async () => {
      const data = await fetchMessageHistory(agent.username);
      setMessages(data.messages || []);
    };
    loadMessages();
  }, [agent]);

  return (
    <div>
      <h2>Message History - {agent.name}</h2>
      <button onClick={onClose}>Close</button>
      <ul>
        {messages.map(msg => <li key={msg.id}>{msg.content}</li>)}
      </ul>
    </div>
  );
};

export default MessageHistory; // ✅ Default export
