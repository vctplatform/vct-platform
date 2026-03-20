// ════════════════════════════════════════
// VCT Platform — k6 WebSocket Test
// Real-time scoring simulation
// Usage: k6 run tests/load/websocket.js
// ════════════════════════════════════════

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const WS_URL = __ENV.WS_URL || 'ws://localhost:18080/ws';

const wsErrors = new Rate('ws_errors');
const msgLatency = new Trend('ws_msg_latency', true);
const msgCount = new Counter('ws_messages');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // 20 concurrent WS connections
    { duration: '2m', target: 50 },    // Ramp to 50
    { duration: '2m', target: 50 },    // Sustain
    { duration: '1m', target: 0 },     // Close
  ],
  thresholds: {
    ws_errors: ['rate<0.05'],
    ws_msg_latency: ['p(95)<500'],
  },
};

export default function () {
  const start = Date.now();

  const res = ws.connect(WS_URL, {}, function (socket) {
    socket.on('open', () => {
      // Subscribe to a tournament channel
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: `tournament:${Math.floor(Math.random() * 10) + 1}`,
      }));
    });

    socket.on('message', (msg) => {
      const latency = Date.now() - start;
      msgLatency.add(latency);
      msgCount.add(1);

      try {
        const data = JSON.parse(msg);
        check(data, {
          'ws: has type': (d) => d.type !== undefined,
        });
      } catch (e) {
        wsErrors.add(1);
      }
    });

    socket.on('error', () => {
      wsErrors.add(1);
    });

    // Simulate scoring events
    for (let i = 0; i < 5; i++) {
      sleep(2 + Math.random() * 3); // 2-5s between scores
      socket.send(JSON.stringify({
        type: 'score_update',
        match_id: `match_${__VU}`,
        athlete_id: `athlete_${i}`,
        score: (Math.random() * 10).toFixed(1),
        timestamp: new Date().toISOString(),
      }));
    }

    sleep(5); // Hold connection
    socket.close();
  });

  check(res, {
    'ws: connected': (r) => r && r.status === 101,
  });
  wsErrors.add(!res || res.status !== 101);
}
