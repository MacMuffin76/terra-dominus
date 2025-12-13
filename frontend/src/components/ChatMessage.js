import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { editMessage, deleteMessage } from '../redux/chatSlice';
import './ChatMessage.css';

const ChatMessage = ({ message, isOwnMessage }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.message);
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    if (editedText.trim() && editedText !== message.message) {
      dispatch(editMessage({ messageId: message.id, message: editedText }));
      setIsEditing(false);
    } else {
      setIsEditing(false);
      setEditedText(message.message);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Supprimer ce message ?')) {
      dispatch(deleteMessage(message.id));
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Moins d'une minute
    if (diff < 60000) return 'À l\'instant';
    
    // Moins d'une heure
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `Il y a ${mins} min`;
    }
    
    // Moins d'un jour
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `Il y a ${hours}h`;
    }
    
    // Plus d'un jour
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('fr-FR', options);
  };

  if (message.isDeleted) {
    return (
      <div className="chat-message deleted">
        <span className="deleted-text">Message supprimé</span>
      </div>
    );
  }

  const isSystemMessage = message.channelType === 'system';

  return (
    <div
      className={`chat-message ${isOwnMessage ? 'own-message' : ''} ${isSystemMessage ? 'system-message' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isSystemMessage && (
        <div className="message-avatar">
          {message.author?.username?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      
      <div className="message-content">
        <div className="message-header">
          {!isSystemMessage && (
            <span className="message-author">
              {message.author?.username || 'Utilisateur inconnu'}
            </span>
          )}
          <span className="message-time">
            {formatTimestamp(message.createdAt)}
            {message.editedAt && <span className="edited-indicator"> (modifié)</span>}
          </span>
        </div>

        {isEditing ? (
          <div className="message-edit">
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditedText(message.message);
                }
              }}
              autoFocus
              className="edit-input"
            />
            <div className="edit-actions">
              <button onClick={handleEdit} className="btn-save">
                ✓ Enregistrer
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedText(message.message);
                }}
                className="btn-cancel"
              >
                ✕ Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="message-text">{message.message}</div>
        )}

        {/* Actions (édition/suppression) */}
        {isOwnMessage && !isSystemMessage && showActions && !isEditing && (
          <div className="message-actions">
            <button
              onClick={() => setIsEditing(true)}
              className="action-btn edit-btn"
              title="Modifier"
            >
              ✎
            </button>
            <button
              onClick={handleDelete}
              className="action-btn delete-btn"
              title="Supprimer"
            >
              🗑
            </button>
          </div>
        )}

        {/* Métadonnées (optionnel) */}
        {message.metadata && message.metadata.icon && (
          <span className="message-icon">{message.metadata.icon}</span>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
