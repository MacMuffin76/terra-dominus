import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';
const METRICS_URL = __ENV.METRICS_URL || 'http://localhost:5000/metrics';
const tokens = (__ENV.AUTH_TOKENS || __ENV.AUTH_TOKEN || '').split(',').map((t) => t.trim()).filter(Boolean);
const cityIds = (__ENV.CITY_IDS || '').split(',').map((id) => Number(id)).filter(Boolean);
const targetCityIds = (__ENV.TARGET_CITY_IDS || '').split(',').map((id) => Number(id)).filter(Boolean);

const jobLatency = new Trend('bullmq_job_enqueue_latency');
const metricsLatency = new Trend('prometheus_scrape_latency');

function pickRandom(arr, fallback) {
  if (arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)];
}

function authHeaders() {
  const token = pickRandom(tokens, '');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function enqueueAttack() {
  const payload = {
    fromCityId: pickRandom(cityIds, 1),
    toCityId: pickRandom(targetCityIds, 2),
    attackType: 'raid',
    units: [{ entityId: 1, quantity: 5 }],
  };
  return http.post(`${BASE_URL}/combat/attack`, JSON.stringify(payload), { headers: authHeaders() });
}

function enqueueTradeConvoy() {
  const payload = {
    fromCityId: pickRandom(cityIds, 1),
    toCityId: pickRandom(targetCityIds, 2),
    resourceType: 'wood',
    quantity: 25,
    durationHours: 1,
  };
  return http.post(`${BASE_URL}/trade/convoys`, JSON.stringify(payload), { headers: authHeaders() });
}

function enqueueProduction() {
  const payload = {
    cityId: pickRandom(cityIds, 1),
    entityId: 1,
    quantity: 5,
  };
  return http.post(`${BASE_URL}/production/start`, JSON.stringify(payload), { headers: authHeaders() });
}

export const options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '3m', target: 400 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const start = Date.now();
  const attackRes = enqueueAttack();
  const tradeRes = enqueueTradeConvoy();
  const prodRes = enqueueProduction();
  jobLatency.add(Date.now() - start);

  check(attackRes, { 'attack job ok': (r) => r.status === 200 || r.status === 201 });
  check(tradeRes, { 'trade job ok': (r) => r.status === 200 || r.status === 201 });
  check(prodRes, { 'production job ok': (r) => r.status === 200 || r.status === 201 });

  const metricsStart = Date.now();
  const metricsRes = http.get(METRICS_URL);
  metricsLatency.add(Date.now() - metricsStart);
  check(metricsRes, { 'metrics exposed': (r) => r.status === 200 });

  sleep(1);
}