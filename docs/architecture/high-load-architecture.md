# VCT Platform: High-Load Architecture (MCR)

**Status:** Proposed  
**Date:** March 2026  
**Authors:** VCT Solution Architect (vct-sa), VCT DevOps (vct-devops)

## 1. Context and Problem Statement
The VCT Platform is anticipating significant traffic spikes, specifically during National Tournaments where tens of thousands of users will simultaneously view real-time scores, leaderboards, and tournament brackets. The system must be designed to handle Millions of Concurrent Requests (MCR) without degrading performance or dropping requests.

Current architecture utilizes Go (Backend), Next.js (Frontend), and PostgreSQL (Neon), but requires explicit guidelines to ensure it is fully stateless, distributed, and scalable.

## 2. High-Load Principles

1. **Stateless Compute**: All API servers (Go) and Frontend middleware (Next.js) MUST be 100% stateless. No in-memory sessions; no local file writes. 
2. **Push over Pull**: Use WebSockets/SSE for real-time updates rather than client-side polling.
3. **Async Everything**: Any heavy computation (e.g., bracket generation, complex PDF exports) must be offloaded to background workers via a message queue (NATS JetStream).
4. **Cache First**: Database is the last line of defense. All read-heavy operations must be cached.
5. **Horizontal Scalability**: The infrastructure must be able to add instances dynamically (Horizontal Pod Autoscaler or Serverless compute) within seconds.

## 3. Architecture Layers

### 3.1 Edge Layer (Cloudflare / Vercel Edge)
- **Global CDN**: Cache static assets (images, CSS, JS) at edge nodes.
- **DDoS Protection & Rate Limiting**: Block abusive traffic before it hits the compute layer.
- **Edge Caching via Vercel**: Next.js App Router utilizes ISR (Incremental Static Regeneration) to cache pages like `Tournaments List` or `Leaderboards` for a set TTL (Time To Live).

### 3.2 Compute Layer (Go API)
- **Stateless Handlers**: JWT-based authentication ensures the API does not need to look up session state in a database for every request.
- **Containerization**: Deploy via Docker on Kubernetes or Serverless platforms (Fly.io/Render) with auto-scaling configured based on CPU/RAM thresholds.
- **Load Balancing**: Distribute traffic evenly across healthy pods.

### 3.3 Caching Layer (Redis)
- **Centralized Cache**: Redis Cluster handles session data (if required), rate limiting counters, and caches heavy aggregation queries.
- **Cache-Aside Pattern**: 
  1. Go backend checks Redis for `match:123:score`.
  2. If Cache Miss, query DB, then write to Redis with a TTL.
  3. On score update, emit event to invalidate cache and broadcast via WebSocket.

### 3.4 Asynchronous Message Queue (NATS JetStream)
- **Event-Driven Workflows**: Example: `ScoreSubmitted` event.
  1. API receives score -> validates -> publishes to NATS -> Returns 202 Accepted.
  2. Background Worker consumes NATS message -> updates DB -> triggers cache invalidation -> broadcasts to WebSocket clients.

### 3.5 Database Layer (PostgreSQL - Neon Serverless)
- **Connection Pooling**: Use PgBouncer to limit maximum physical connections to the DB, funneling thousands of logical Go connections into a safe pool.
- **Read Replicas**: Separate Write load (Master node) from Read load (Replica nodes). Queries for leaderboards point to Read Replicas.
- **Serverless Scaling**: Neon dynamically scales CPU/Memory for the Postgres instance during sudden traffic spikes without manual intervention.

## 4. Risks and Mitigations
- **Cache Stampede**: When a popular cache key expires, thousands of requests might hit the DB simultaneously.
  - *Mitigation*: Implement probabilistic early expiration or a distributed lock (e.g., Redis Redlock) to ensure only one worker regenerates the cache.
- **Eventual Consistency**: Asynchronous writes mean the client might see stale data for a few milliseconds.
  - *Mitigation*: Optimistic UI updates on the frontend (Next.js) coupled with real-time websocket pushes for correction.

## 5. Consequences
By adopting this architecture, the VCT Platform ensures maximum uptime during peak loads. However, it introduces operational complexity: developers must explicitly handle cache invalidation, design idempotent workers, and avoid relying on synchronous DB transactions for high-throughput flows.
