import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  setActiveChannel,
  addMessage,
  updateMessage,
  removeMessage,
  setConnected,
  addTypingUser,
  removeTypingUser,
} from '../redux/chatSlice';
import ChatMessage from './ChatMessage';
import Menu from './Menu';
import socket from '../utils/socket';
import './Chat.css';

const Chat = () => {
  const dispatch = useDispatch();
  const {
    globalMessages,
    allianceMessages,
    activeChannel,
    loading,
    error,
    connected,
    typingUsers,
    unreadCount,
    pagination,
  } = useSelector((state) => state.chat);

  const currentUser = useSelector((state) => state.auth.user);
  const userAlliance = currentUser?.allianceId;

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Messages à afficher selon le canal actif
  const displayedMessages =
    activeChannel === 'global' ? globalMessages : allianceMessages;

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages]);

  // Connexion Socket.IO et événements chat
  useEffect(() => {
    // Rejoindre le chat global au chargement
    socket.emit('chat:join:global');
    dispatch(setConnected(socket.connected));

    // Charger l'historique des messages
    dispatch(fetchMessages({ channelType: 'global', limit: 50, offset: 0 }));

    // Si l'utilisateur a une alliance, rejoindre le chat d'alliance
    if (userAlliance) {
      socket.emit('chat:join:alliance', { allianceId: userAlliance });
      dispatch(fetchMessages({ channelType: 'alliance', channelId: userAlliance, limit: 50, offset: 0 }));
    }

    // Événements Socket.IO
    const handleConnect = () => {
      dispatch(setConnected(true));
      socket.emit('chat:join:global');
      if (userAlliance) {
        socket.emit('chat:join:alliance', { allianceId: userAlliance });
      }
    };

    const handleDisconnect = () => {
      dispatch(setConnected(false));
    };

    const handleNewMessage = (message) => {
      dispatch(addMessage(message));
    };

    const handleMessageEdited = (message) => {
      dispatch(updateMessage(message));
    };

    const handleMessageDeleted = ({ messageId }) => {
      dispatch(removeMessage(messageId));
    };

    const handleTyping = ({ userId, channelType, channelId }) => {
      const channel = channelType === 'global' ? 'global' : `alliance_${channelId}`;
      dispatch(addTypingUser({ channel, userId }));

      // Retirer l'indicateur après 3 secondes
      setTimeout(() => {
        dispatch(removeTypingUser({ channel, userId }));
      }, 3000);
    };

    const handleChatJoined = (data) => {
      console.log('Joined chat:', data);
    };

    const handleChatError = (data) => {
      console.error('Chat error:', data.message);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('chat:message', handleNewMessage);
    socket.on('chat:edited', handleMessageEdited);
    socket.on('chat:deleted', handleMessageDeleted);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:joined', handleChatJoined);
    socket.on('chat:error', handleChatError);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:edited', handleMessageEdited);
      socket.off('chat:deleted', handleMessageDeleted);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:joined', handleChatJoined);
      socket.off('chat:error', handleChatError);
    };
  }, [dispatch, userAlliance]);

  // Gérer le changement de canal
  const handleChannelChange = (channelType) => {
    dispatch(setActiveChannel({ channelType }));
  };

  // Envoyer un message
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    const messageData = {
      channelType: activeChannel,
      message: messageInput.trim(),
      metadata: {},
    };

    if (activeChannel === 'alliance' && userAlliance) {
      messageData.channelId = userAlliance;
    }

    // Envoyer via Socket.IO
    socket.emit('chat:send', messageData);

    // Réinitialiser l'input
    setMessageInput('');
    setIsTyping(false);
  };

  // Gérer l'indicateur de frappe
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      const typingData = {
        channelType: activeChannel,
      };
      if (activeChannel === 'alliance' && userAlliance) {
        typingData.channelId = userAlliance;
      }
      socket.emit('chat:typing', typingData);
    }

    // Arrêter l'indicateur après 2 secondes d'inactivité
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  // Charger plus de messages (pagination)
  const handleLoadMore = () => {
    const channelPagination = pagination[activeChannel];
    if (!channelPagination.hasMore || loading) return;

    const params = {
      channelType: activeChannel,
      limit: 50,
      offset: channelPagination.offset + 50,
    };

    if (activeChannel === 'alliance' && userAlliance) {
      params.channelId = userAlliance;
    }

    dispatch(fetchMessages(params));
  };

  // Utilisateurs en train de taper
  const currentTypingUsers = typingUsers[activeChannel === 'global' ? 'global' : `alliance_${userAlliance}`] || [];
  const typingUsernames = currentTypingUsers
    .filter((userId) => userId !== currentUser?.id)
    .map((userId) => {
      // Trouver le username (simplifie, vous pouvez ameliorer avec un store d'utilisateurs)
      const msg = displayedMessages.find((m) => m.userId === userId);
      return (msg && msg.author && msg.author.username) || 'Quelqu\'un';
    });

  return (
    <>
      <Menu />
      <div className="chat-container">
        {/* Header avec onglets */}
        <div className="chat-header">
          <h2>💬 Chat</h2>
          <div className="chat-tabs">
          <button
            className={`chat-tab ${activeChannel === 'global' ? 'active' : ''}`}
            onClick={() => handleChannelChange('global')}
          >
            🌍 Global
            {unreadCount.global > 0 && (
              <span className="unread-badge">{unreadCount.global}</span>
            )}
          </button>
          
          {userAlliance && (
            <button
              className={`chat-tab ${activeChannel === 'alliance' ? 'active' : ''}`}
              onClick={() => handleChannelChange('alliance')}
            >
              🛡️ Alliance
              {unreadCount.alliance > 0 && (
                <span className="unread-badge">{unreadCount.alliance}</span>
              )}
            </button>
          )}
        </div>

        <div className="chat-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Connecté' : '🔴 Déconnecté'}
          </span>
        </div>
      </div>

      {/* Zone de messages */}
      <div className="chat-messages">
        {/* Bouton charger plus */}
        {pagination[activeChannel]?.hasMore && (
          <button onClick={handleLoadMore} className="load-more-btn" disabled={loading}>
            {loading ? 'Chargement...' : '↑ Charger plus de messages'}
          </button>
        )}

        {/* Erreur */}
        {error && (
          <div className="chat-error">
            ⚠️ {error}
          </div>
        )}

        {/* Messages */}
        {displayedMessages.length === 0 ? (
          <div className="chat-empty">
            <p>Aucun message pour le moment.</p>
            <p>Soyez le premier à envoyer un message ! 👋</p>
          </div>
        ) : (
          displayedMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={message.userId === currentUser?.id}
            />
          ))
        )}

        {/* Indicateur de frappe */}
        {typingUsernames.length > 0 && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
            <span className="typing-text">
              {typingUsernames.length === 1
                ? `${typingUsernames[0]} est en train d'écrire...`
                : `${typingUsernames.length} personnes écrivent...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone d'input */}
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          ref={inputRef}
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder={
            activeChannel === 'global'
              ? 'Envoyer un message à tous les joueurs...'
              : 'Envoyer un message à votre alliance...'
          }
          maxLength={2000}
          disabled={!connected}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={!messageInput.trim() || !connected}
          className="chat-send-btn"
        >
          📤 Envoyer
        </button>
      </form>

      {/* Compteur de caractères */}
      {messageInput.length > 1800 && (
        <div className="char-counter">
          {messageInput.length} / 2000 caracteres
        </div>
      )}
      </div>
    </>
  );
};

export default Chat;
