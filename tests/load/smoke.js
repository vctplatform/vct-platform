// ════════════════════════════════════════
// VCT Platform — k6 Smoke Test
// Quick sanity check: health endpoint + basic CRUD
// Usage: k6 run tests/load/smoke.js
// ════════════════════════════════════════

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:18080';

// Custom metrics
const errorRate = new Rate('vct_errors');
const apiLatency = new Trend('vct_api_latency', true);

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],        // <1% errors
    http_req_duration: ['p(95)<500'],       // p95 < 500ms
    vct_errors: ['rate<0.01'],
    vct_api_latency: ['p(99)<1000'],
  },
};

export default function () {
  // ── Health Check ──────────────────────
  const health = http.get(`${BASE_URL}/healthz`);
  check(health, {
    'health: status 200': (r) => r.status === 200,
    'health: body ok': (r) => r.body && r.body.includes('ok'),
  });
  errorRate.add(health.status !== 200);
  apiLatency.add(health.timings.duration);

  // ── API Version ───────────────────────
  const version = http.get(`${BASE_URL}/api/v1/version`);
  check(version, {
    'version: status 200': (r) => r.status === 200,
  });
  errorRate.add(version.status !== 200);

  // ── Public endpoints ──────────────────
  const tournaments = http.get(`${BASE_URL}/api/v1/tournaments`);
  check(tournaments, {
    'tournaments: status 200|401': (r) => [200, 401].includes(r.status),
    'tournaments: response time < 1s': (r) => r.timings.duration < 1000,
  });
  apiLatency.add(tournaments.timings.duration);

  const athletes = http.get(`${BASE_URL}/api/v1/athletes`);
  check(athletes, {
    'athletes: status 200|401': (r) => [200, 401].includes(r.status),
  });
  apiLatency.add(athletes.timings.duration);

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'tests/load/results/smoke-summary.json': JSON.stringify(data, null, 2),
  };
}

// Inline text summary (k6 built-in)
function textSummary(data, opts) {
  // k6 provides this natively when k6/summary is available
  return JSON.stringify(data.metrics, null, 2);
}
