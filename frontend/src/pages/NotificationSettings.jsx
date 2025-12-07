import React, { useEffect, useState } from 'react';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/notificationPreferences';
import Loader from '../components/ui/Loader';
import { Alert } from '../components/ui';

const VAPID_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

const requestPushPermission = async () => {
  if (!('Notification' in window)) return { granted: false, reason: 'Notifications not supported' };
  const permission = await Notification.requestPermission();
  return { granted: permission === 'granted', reason: permission };
};

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/service-worker.js');
};

const subscribeToPush = async () => {
  const registration = await registerServiceWorker();
  if (!registration?.pushManager) return null;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_KEY,
  });
};

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  const loadPrefs = async () => {
    try {
      setLoading(true);
      const data = await getNotificationPreferences();
      setPrefs(data);
    } catch (err) {
      setError(err?.message || 'Impossible de charger les préférences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrefs();
  }, []);

  const handleToggle = async (key) => {
    try {
      const updated = await updateNotificationPreferences({ [key]: !prefs[key] });
      setPrefs(updated);
      setToast('Préférence mise à jour');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      setError(err?.message || 'Mise à jour impossible');
    }
  };

  const handlePushOptIn = async () => {
    const permission = await requestPushPermission();
    if (!permission.granted) {
      setError('Autorisez les notifications pour activer le push');
      return;
    }
    await subscribeToPush();
    await handleToggle('pushEnabled');
  };

  if (loading) return <Loader label="Chargement des préférences" center />;

  return (
    <div className="page notifications">
      <header className="page-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>Préférences & Push</h1>
          <p className="muted">Activez les alertes email, push web et in-app. Les toasts restent actifs en fallback.</p>
        </div>
      </header>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
      {toast && <Alert variant="success" onClose={() => setToast('')}>{toast}</Alert>}

      <div className="panel">
        <div className="pref-row">
          <div>
            <h3>Email</h3>
            <p className="muted">Recevoir un résumé par email pour combats, achats et quêtes.</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={prefs?.emailEnabled} onChange={() => handleToggle('emailEnabled')} />
            <span className="slider" />
          </label>
        </div>

        <div className="pref-row">
          <div>
            <h3>Push Web</h3>
            <p className="muted">Active les notifications push avec clés VAPID et retry progressif.</p>
          </div>
          <div className="actions">
            <label className="switch">
              <input type="checkbox" checked={prefs?.pushEnabled} onChange={handlePushOptIn} />
              <span className="slider" />
            </label>
            <button onClick={handlePushOptIn}>Opt-in</button>
          </div>
        </div>

        <div className="pref-row">
          <div>
            <h3>In-app</h3>
            <p className="muted">Toasts temps réel quand le push est indisponible.</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={prefs?.inAppEnabled} onChange={() => handleToggle('inAppEnabled')} />
            <span className="slider" />
          </label>
        </div>
      </div>

      <style>{`
        .page.notifications { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .panel { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fff; display: flex; flex-direction: column; gap: 12px; }
        .pref-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .muted { color: #6b7280; }
        .switch { position: relative; display: inline-block; width: 42px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #d1d5db; transition: .2s; border-radius: 24px; }
        .slider:before { position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .2s; border-radius: 50%; }
        input:checked + .slider { background-color: #6366f1; }
        input:checked + .slider:before { transform: translateX(18px); }
        .actions { display: flex; align-items: center; gap: 8px; }
        button { border: 1px solid #e5e7eb; background: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default NotificationSettings;