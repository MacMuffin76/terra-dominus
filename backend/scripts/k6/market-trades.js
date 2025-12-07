import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';
const MARKET_RESOURCE = __ENV.MARKET_RESOURCE || 'wood';
const WRITE_PERCENT = Number(__ENV.WRITE_PERCENT || 30); // % des itérations qui écrivent
const tokens = (__ENV.AUTH_TOKENS || __ENV.AUTH_TOKEN || '').split(',').map((t) => t.trim()).filter(Boolean);
const cityIds = (__ENV.CITY_IDS || '').split(',').map((id) => Number(id)).filter(Boolean);

const writes = new Counter('market_writes');
const reads = new Counter('market_reads');

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

function createOrder() {
  const body = {
    cityId: pickRandom(cityIds, 1),
    orderType: Math.random() > 0.5 ? 'buy' : 'sell',
    resourceType: MARKET_RESOURCE,
    quantity: 50 + Math.floor(Math.random() * 50),
    pricePerUnit: 3 + Math.floor(Math.random() * 5),
  };

  return http.post(`${BASE_URL}/market/orders`, JSON.stringify(body), { headers: authHeaders() });
}

function executeOrder(orderId) {
  return http.post(`${BASE_URL}/market/orders/${orderId}/execute`, null, { headers: authHeaders() });
}

function sendConvoy() {
  const payload = {
    fromCityId: pickRandom(cityIds, 1),
    toCityId: pickRandom(cityIds, 2),
    resourceType: MARKET_RESOURCE,
    quantity: 10 + Math.floor(Math.random() * 40),
    durationHours: 1,
  };
  return http.post(`${BASE_URL}/trade/convoys`, JSON.stringify(payload), { headers: authHeaders() });
}

export const options = {
  vus: 150,
  duration: '6m',
  thresholds: {
    http_req_duration: ['p(95)<300'],
  },
};

export default function () {
  const doWrite = Math.random() * 100 < WRITE_PERCENT;

  if (doWrite) {
    const res = createOrder();
    writes.add(1);
    check(res, { 'order created': (r) => r.status === 200 || r.status === 201 });

    // 1/3 des écritures exécutent la transaction pour tester les verrous
    if (Math.random() > 0.66 && res.status === 201 && res.json('id')) {
      const execRes = executeOrder(res.json('id'));
      check(execRes, { 'order executed': (r) => r.status === 200 || r.status === 201 });
    }

    // Générer des jobs trade pour BullMQ
    const convoyRes = sendConvoy();
    check(convoyRes, { 'convoy sent': (r) => r.status === 200 || r.status === 201 });
  } else {
    const listOrders = http.get(`${BASE_URL}/market/orders?resourceType=${MARKET_RESOURCE}&limit=20`, { headers: authHeaders() });
    const myOrders = http.get(`${BASE_URL}/market/my/orders`, { headers: authHeaders() });
    reads.add(2);
    check(listOrders, { 'orders listed': (r) => r.status === 200 });
    check(myOrders, { 'my orders listed': (r) => r.status === 200 });
  }

  sleep(1);
}