import axios from 'axios';
import { notifyApiError } from './apiErrorHandler';
import { safeStorage } from './safeStorage';

const apiBaseURL = process.env.REACT_APP_API_URL || '/api/v1';
const DEFAULT_CACHE_TTL = 30 * 1000; // 30s per défaut

const cache = new Map();

const isGetRequest = (config) => (config.method || 'get').toLowerCase() === 'get';

const buildCacheKey = (config) => {
  const paramsKey = config.params ? JSON.stringify(config.params) : '';
  return `${config.baseURL || ''}${config.url}?${paramsKey}`;
};

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = safeStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isGetRequest(config) && config.useCache !== false) {
      const cacheKey = buildCacheKey(config);
      const entry = cache.get(cacheKey);
      const ttl =
        typeof config.cacheTtl === 'number' && config.cacheTtl > 0
          ? config.cacheTtl
          : DEFAULT_CACHE_TTL;

      if (entry && Date.now() - entry.timestamp < ttl) {
        return {
          ...config,
          adapter: () =>
            Promise.resolve({
              ...entry.response,
              config,
              request: {},
            }),
        };
      }

      config.metadata = { ...(config.metadata || {}), cacheKey, cacheTtl: ttl };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (isGetRequest(response.config) && response.config.metadata?.cacheKey) {
      cache.set(response.config.metadata.cacheKey, {
        timestamp: Date.now(),
        response: {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        },
      });
    } else if (!isGetRequest(response.config)) {
      cache.clear();
    }

    return response;
  },
  (error) => {
    if (error?.response?.config?.metadata?.cacheKey) {
      cache.delete(error.response.config.metadata.cacheKey);
    }

    const message = notifyApiError(error);
    return Promise.reject(new Error(message));
  }
);

export const invalidateRequestCache = (matcher) => {
  if (typeof matcher === 'function') {
    Array.from(cache.keys())
      .filter(matcher)
      .forEach((key) => cache.delete(key));
  } else if (typeof matcher === 'string') {
    Array.from(cache.keys())
      .filter((key) => key.includes(matcher))
      .forEach((key) => cache.delete(key));
  } else {
    cache.clear();
  }
};

export default axiosInstance;