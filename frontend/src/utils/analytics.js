import axiosInstance from './axiosInstance';
import { safeStorage } from './safeStorage';

const CONSENT_KEY = 'analytics_consent';

export const getConsentStatus = () => safeStorage.getItem(CONSENT_KEY) || 'pending';

export const grantConsent = () => {
  safeStorage.setItem(CONSENT_KEY, 'granted');
  return 'granted';
};

export const denyConsent = () => {
  safeStorage.setItem(CONSENT_KEY, 'denied');
  return 'denied';
};

export const ensureConsentInitialized = () => {
  if (!safeStorage.getItem(CONSENT_KEY)) {
    safeStorage.setItem(CONSENT_KEY, 'pending');
  }
};

const hasSessionToken = () => Boolean(safeStorage.getItem('jwtToken'));

export const trackEvent = async (eventName, properties = {}, options = {}) => {
  const consent = options.consent || getConsentStatus();
  if (!hasSessionToken()) return;
  if (consent === 'denied' && options.requireConsent !== false) return;

  const headers = {};
  if (consent) headers['X-Analytics-Consent'] = consent;
  if (consent === 'denied') headers['X-Analytics-Opt-Out'] = 'true';

  try {
    await axiosInstance.post(
      '/analytics/track',
      {
        eventName,
        properties: {
          ...properties,
          source: options.source || 'frontend',
        },
        anonymousId: options.anonymousId,
      },
      { headers, timeout: 3000 }
    );
  } catch (error) {
    // Ne bloque jamais l'UX pour un échec analytics
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Analytics track skipped', error.message);
    }
  }
};

export const trackSessionStart = (properties = {}) =>
  trackEvent('session_start', { ...properties, startedAt: Date.now() });

export const trackSessionEnd = (reason = 'logout') =>
  trackEvent(
    'session_end',
    { reason, endedAt: Date.now() },
    { fireAndForget: true }
  );