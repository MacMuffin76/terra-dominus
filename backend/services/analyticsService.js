const axios = require('axios');
const crypto = require('crypto');
const { getLogger } = require('../utils/logger');

const DEFAULT_ALLOWED_EVENTS = [
  'tutorial_step_completed',
  'quest_completed',
  'battle_started',
  'battle_finished',
  'purchase_attempt',
  'purchase_success',
  'purchase_fail',
  'portal_entered',
  'boss_defeated',
  'alliance_joined',
  'market_trade',
  'session_start',
  'session_end',
];

class AnalyticsService {
  constructor({
    mixpanelToken,
    amplitudeApiKey,
    mixpanelEndpoint,
    amplitudeEndpoint,
    propertyTtlDays = 30,
    allowedEvents = DEFAULT_ALLOWED_EVENTS,
  } = {}) {
    this.logger = getLogger({ module: 'analytics-service' });
    this.mixpanelToken = mixpanelToken || process.env.MIXPANEL_TOKEN;
    this.amplitudeApiKey = amplitudeApiKey || process.env.AMPLITUDE_API_KEY;
    this.mixpanelEndpoint = mixpanelEndpoint || process.env.MIXPANEL_PROXY_URL || 'https://api.mixpanel.com/track';
    this.amplitudeEndpoint = amplitudeEndpoint || process.env.AMPLITUDE_PROXY_URL || 'https://api2.amplitude.com/2/httpapi';
    this.allowedEvents = allowedEvents;
    this.propertyTtlMs = (Number(process.env.ANALYTICS_PROPERTY_TTL_DAYS) || propertyTtlDays) * 24 * 60 * 60 * 1000;
    this.userPropertiesCache = new Map();
    this.sandboxMode = process.env.ANALYTICS_SANDBOX === 'true';
  }

  shouldTrack(consent = {}) {
    if (process.env.ANALYTICS_DISABLED === 'true') return false;
    if (consent.optOut || consent.status === 'denied') return false;
    return true;
  }

  sanitizeProperties(properties = {}) {
    return Object.entries(properties).reduce((acc, [key, value]) => {
      if (value === undefined) return acc;
      acc[key] = value;
      return acc;
    }, {});
  }

  mergeUserProperties(userId, userProperties = {}, ttlMs = this.propertyTtlMs) {
    if (!userId) return {};
    const now = Date.now();
    const existing = this.userPropertiesCache.get(userId) || [];
    const active = existing.filter((entry) => entry.expiresAt > now);
    const nextProps = { ...this.flattenProperties(active), ...userProperties };

    const refreshedEntries = Object.entries(userProperties).map(([key, value]) => ({
      key,
      value,
      expiresAt: now + ttlMs,
    }));

    this.userPropertiesCache.set(userId, [...active, ...refreshedEntries]);
    return nextProps;
  }

  flattenProperties(entries = []) {
    return entries.reduce((acc, entry) => ({
      ...acc,
      [entry.key]: entry.value,
    }), {});
  }

  async trackEvent({
    userId,
    anonymousId,
    eventName,
    properties = {},
    userProperties = {},
    consent = {},
  }) {
    if (!eventName || !this.allowedEvents.includes(eventName)) {
      this.logger.warn({ eventName }, 'Blocked analytics event (not in allowlist)');
      return { skipped: true, reason: 'not_allowed' };
    }

    if (!this.shouldTrack(consent)) {
      return { skipped: true, reason: 'opt_out' };
    }

    const sanitizedProps = this.sanitizeProperties({
      ...properties,
      source: properties.source || 'backend',
      anonymized_ip: '0.0.0.0',
    });

    const mergedUserProps = this.mergeUserProperties(userId || anonymousId, userProperties);
    const eventPayload = {
      userId: userId || null,
      anonymousId: anonymousId || null,
      eventName,
      properties: sanitizedProps,
      userProperties: mergedUserProps,
    };

    if (this.sandboxMode) {
      this.logger.info({ eventPayload }, 'Analytics sandbox mode - payload logged only');
      return { sandbox: true };
    }

    await Promise.all([
      this.sendToMixpanel(eventPayload),
      this.sendToAmplitude(eventPayload),
    ]);

    return { delivered: true };
  }

  async sendToMixpanel({ userId, anonymousId, eventName, properties, userProperties }) {
    if (!this.mixpanelToken) return;
    const payload = {
      event: eventName,
      properties: {
        token: this.mixpanelToken,
        distinct_id: userId || anonymousId || `anon-${crypto.randomUUID()}`,
        time: Date.now(),
        $ip: '0.0.0.0',
        ...properties,
        ...userProperties,
      },
    };

    try {
      await axios.post(this.mixpanelEndpoint, payload, { timeout: 3000 });
    } catch (error) {
      this.logger.warn({ err: error, eventName }, 'Mixpanel proxy call failed');
    }
  }

  async sendToAmplitude({ userId, anonymousId, eventName, properties, userProperties }) {
    if (!this.amplitudeApiKey) return;
    const event = {
      user_id: userId ? String(userId) : undefined,
      device_id: anonymousId || `anon-${crypto.randomUUID()}`,
      event_type: eventName,
      ip: '0.0.0.0',
      time: Date.now(),
      event_properties: properties,
      user_properties: userProperties,
      insert_id: crypto.randomUUID(),
    };

    try {
      await axios.post(
        this.amplitudeEndpoint,
        { events: [event], options: { min_id_length: 1 } },
        { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': this.amplitudeApiKey }, timeout: 3000 },
      );
    } catch (error) {
      this.logger.warn({ err: error, eventName }, 'Amplitude proxy call failed');
    }
  }
}

let instance;

function getAnalyticsService(options) {
  if (!instance) {
    instance = new AnalyticsService(options);
  }
  return instance;
}

module.exports = {
  AnalyticsService,
  getAnalyticsService,
  DEFAULT_ALLOWED_EVENTS,
};