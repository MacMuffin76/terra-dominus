// src/components/messages/MessageInbox.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import Menu from '../Menu';
import './MessageInbox.css';

const MessageInbox = () => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    loadUnreadCount();
  }, [filter]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'unread') {
        params.isRead = 'false';
      } else if (filter !== 'all') {
        params.type = filter;
      }

      const response = await axiosInstance.get('/messages', { params });
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axiosInstance.put(`/messages/${messageId}/read`);
      loadMessages();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put('/messages/read-all');
      loadMessages();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      loadMessages();
      loadUnreadCount();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      attack_incoming: '🚨',
      attack_launched: '⚔️',
      attack_result: '🏆',
      defense_report: '🛡️',
      spy_report: '🕵️',
      spy_detected: '👁️',
      trade_arrival: '📦',
      admin_message: '📢',
      system_message: 'ℹ️',
      construction_complete: '🏗️',
      research_complete: '🔬'
    };
    return icons[type] || '📬';
  };

  const getPriorityClass = (priority) => {
    return `message-priority-${priority}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <>
      <Menu />
      <div className="message-inbox">
        <div className="message-inbox-header">
          <h2>📬 Boîte aux lettres</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
          )}
        </div>

      <div className="message-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tous
        </button>
        <button
          className={filter === 'unread' ? 'active' : ''}
          onClick={() => setFilter('unread')}
        >
          Non lus ({unreadCount})
        </button>
        <button
          className={filter === 'attack_result' ? 'active' : ''}
          onClick={() => setFilter('attack_result')}
        >
          Combats
        </button>
        <button
          className={filter === 'spy_report' ? 'active' : ''}
          onClick={() => setFilter('spy_report')}
        >
          Espionnage
        </button>
        <button
          className={filter === 'admin_message' ? 'active' : ''}
          onClick={() => setFilter('admin_message')}
        >
          Admin
        </button>
      </div>

      <div className="message-actions">
        <button onClick={markAllAsRead} disabled={unreadCount === 0}>
          Tout marquer comme lu
        </button>
        <button onClick={loadMessages}>
          ⟳ Actualiser
        </button>
      </div>

      {loading ? (
        <div className="message-loading">Chargement...</div>
      ) : messages.length === 0 ? (
        <div className="message-empty">Aucun message</div>
      ) : (
        <div className="message-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-item ${!message.is_read ? 'message-unread' : ''} ${getPriorityClass(message.priority)}`}
            >
              <div className="message-icon">{getTypeIcon(message.type)}</div>
              <div className="message-content">
                <div className="message-header">
                  <h4>{message.title}</h4>
                  <span className="message-date">{formatDate(message.created_at)}</span>
                </div>
                <p className="message-text">{message.content}</p>
                {message.data && (
                  <div className="message-details">
                    {message.data.loot && (
                      <span>
                        💰 {message.data.loot.gold} or | 
                        🔩 {message.data.loot.metal} métal | 
                        ⛽ {message.data.loot.fuel} carburant
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="message-actions-buttons">
                {!message.is_read && (
                  <button
                    className="btn-mark-read"
                    onClick={() => markAsRead(message.id)}
                    title="Marquer comme lu"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="btn-delete"
                  onClick={() => deleteMessage(message.id)}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
};

export default MessageInbox;
