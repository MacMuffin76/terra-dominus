import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';
const DEFAULT_UNIT = Number(__ENV.UNIT_ENTITY_ID || 1);
const tokens = (__ENV.AUTH_TOKENS || __ENV.AUTH_TOKEN || '').split(',').map((t) => t.trim()).filter(Boolean);
const cityIds = (__ENV.CITY_IDS || '').split(',').map((id) => Number(id)).filter(Boolean);
const targetCityIds = (__ENV.TARGET_CITY_IDS || '').split(',').map((id) => Number(id)).filter(Boolean);

const attackLatency = new Trend('raid_attack_latency');
const attackSuccess = new Rate('raid_attack_success');

function pickRandom(arr, fallback) {
  if (arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)];
}

function authHeaders() {
  const token = pickRandom(tokens, '');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function buildAttackPayload() {
  const fromCityId = pickRandom(cityIds, 1);
  const toCityId = pickRandom(targetCityIds, 2);
  return {
    fromCityId,
    toCityId,
    attackType: 'raid',
    units: [
      {
        entityId: DEFAULT_UNIT,
        quantity: 5 + Math.floor(Math.random() * 10),
      },
    ],
  };
}

export const options = {
  scenarios: {
    raid_100: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      stages: [
        { target: 100, duration: '2m' },
        { target: 100, duration: '3m' },
        { target: 0, duration: '30s' },
      ],
      exec: 'runRaid',
    },
    raid_500: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      stages: [
        { target: 500, duration: '3m' },
        { target: 500, duration: '4m' },
        { target: 0, duration: '1m' },
      ],
      exec: 'runRaid',
    },
    raid_1000: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 400,
      stages: [
        { target: 1000, duration: '4m' },
        { target: 1000, duration: '4m' },
        { target: 0, duration: '2m' },
      ],
      exec: 'runRaid',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    raid_attack_success: ['rate>0.95'],
  },
};

export function runRaid() {
  const payload = buildAttackPayload();
  const res = http.post(`${BASE_URL}/combat/attack`, JSON.stringify(payload), { headers: authHeaders() });

  attackLatency.add(res.timings.duration);
  const isSuccess = check(res, {
    'raid accepted': (r) => r.status === 200 || r.status === 201,
  });
  attackSuccess.add(isSuccess);

  // Lecture des attaques en cours pour simuler la consultation du tableau de bord
  const listRes = http.get(`${BASE_URL}/combat/attacks?role=attacker&limit=10`, { headers: authHeaders() });
  check(listRes, {
    'attacks listed': (r) => r.status === 200,
  });

  sleep(1);
}