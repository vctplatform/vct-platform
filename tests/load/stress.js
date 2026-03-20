// ════════════════════════════════════════
// VCT Platform — k6 Stress Test
// Find the breaking point: aggressive ramp to high concurrency
// Usage: k6 run tests/load/stress.js
// ════════════════════════════════════════

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:18080';

const errorRate = new Rate('vct_errors');
const apiLatency = new Trend('vct_api_latency', true);

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Warm up
    { duration: '2m', target: 200 },   // Ramp to 200
    { duration: '3m', target: 200 },   // Hold 200
    { duration: '2m', target: 500 },   // Ramp to 500
    { duration: '3m', target: 500 },   // Hold 500 (stress zone)
    { duration: '2m', target: 1000 },  // Spike to 1000
    { duration: '1m', target: 1000 },  // Hold 1000 (breaking point?)
    { duration: '2m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_failed: ['rate<0.15'],       // <15% errors at breaking point
    http_req_duration: ['p(95)<5000'],    // p95 < 5s under extreme load
    vct_errors: ['rate<0.20'],
  },
};

export default function () {
  // Mixed read workload
  const endpoints = [
    '/healthz',
    '/api/v1/tournaments',
    '/api/v1/athletes',
    '/api/v1/clubs',
    '/api/v1/categories',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`);

  check(res, {
    'status not 503': (r) => r.status !== 503,
    'latency < 10s': (r) => r.timings.duration < 10000,
  });

  errorRate.add(res.status >= 500);
  apiLatency.add(res.timings.duration);

  sleep(Math.random() * 0.5); // Minimal think time for stress
}
