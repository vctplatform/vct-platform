// ════════════════════════════════════════
// VCT Platform — k6 Load Test
// Sustained traffic simulation: ramp up → sustained → ramp down
// Usage: k6 run tests/load/load.js
// ════════════════════════════════════════

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:18080';
const API_TOKEN = __ENV.API_TOKEN || '';

// Custom metrics
const errorRate = new Rate('vct_errors');
const apiLatency = new Trend('vct_api_latency', true);
const requestCount = new Counter('vct_requests');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 VUs
    { duration: '5m', target: 50 },   // Hold 50 VUs
    { duration: '2m', target: 100 },  // Ramp to 100 VUs
    { duration: '5m', target: 100 },  // Hold 100 VUs
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],        // <5% errors
    http_req_duration: ['p(95)<2000'],     // p95 < 2s
    'http_req_duration{group:::API Read}': ['p(95)<1000'],
    'http_req_duration{group:::Auth Flow}': ['p(95)<500'],
    vct_errors: ['rate<0.05'],
    vct_api_latency: ['p(99)<3000'],
  },
};

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (API_TOKEN) h['Authorization'] = `Bearer ${API_TOKEN}`;
  return h;
}

export default function () {
  group('Health', () => {
    const res = http.get(`${BASE_URL}/healthz`);
    check(res, { 'health ok': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    requestCount.add(1);
  });

  group('API Read', () => {
    // List endpoints (pagination)
    const endpoints = [
      '/api/v1/tournaments?page=1&limit=20',
      '/api/v1/athletes?page=1&limit=20',
      '/api/v1/clubs?page=1&limit=20',
      '/api/v1/categories',
    ];

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(`${BASE_URL}${endpoint}`, { headers: headers() });
    check(res, {
      'read: status ok': (r) => [200, 401].includes(r.status),
      'read: latency < 2s': (r) => r.timings.duration < 2000,
    });
    errorRate.add(res.status >= 500);
    apiLatency.add(res.timings.duration);
    requestCount.add(1);
  });

  group('Auth Flow', () => {
    // Login attempt
    const loginPayload = JSON.stringify({
      email: `loadtest_${__VU}@vct.test`,
      password: 'LoadTest123!',
    });
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
      headers: headers(),
    });
    check(res, {
      'auth: response received': (r) => r.status > 0,
      'auth: latency < 1s': (r) => r.timings.duration < 1000,
    });
    apiLatency.add(res.timings.duration);
    requestCount.add(1);
  });

  group('Search', () => {
    const queries = ['Nguyen', 'CLB', 'Vo Co Truyen', 'HCM'];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const res = http.get(`${BASE_URL}/api/v1/search?q=${encodeURIComponent(q)}`, {
      headers: headers(),
    });
    check(res, {
      'search: response': (r) => r.status > 0,
    });
    apiLatency.add(res.timings.duration);
    requestCount.add(1);
  });

  sleep(Math.random() * 2 + 0.5); // 0.5-2.5s think time
}
