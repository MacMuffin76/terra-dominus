/**
 * Quest Progress Notification
 * Shows toast notification when quest objectives are updated
 */

import React, { useState, useEffect } from 'react';
import './QuestProgressNotification.css';

const QuestProgressNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleQuestUpdate = (event) => {
      const { source, questTitle, progress } = event.detail;

      // Create notification
      const notification = {
        id: Date.now(),
        source,
        questTitle,
        progress,
        timestamp: new Date()
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    };

    window.addEventListener('questProgressUpdate', handleQuestUpdate);
    return () => {
      window.removeEventListener('questProgressUpdate', handleQuestUpdate);
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="quest-notification-container">
      {notifications.map(notif => (
        <div key={notif.id} className="quest-notification">
          <div className="quest-notification-icon">✓</div>
          <div className="quest-notification-content">
            <div className="quest-notification-title">
              Objectif progressé
            </div>
            <div className="quest-notification-message">
              {notif.questTitle || 'Vos quêtes ont été mises à jour'}
            </div>
            {notif.progress && (
              <div className="quest-notification-progress">
                {notif.progress}
              </div>
            )}
          </div>
          <button 
            className="quest-notification-close"
            onClick={() => removeNotification(notif.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default QuestProgressNotification;
