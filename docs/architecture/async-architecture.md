# VCT Platform Event-Driven & Async Architecture

This document establishes the rules for asynchronous processing, message queues, and background jobs within the VCT Platform, ensuring that the main API remains highly responsive.

## 1. The 2-Second HTTP Rule
- **Blocking Ban**: No HTTP API request shall actively block for more than 2,000 milliseconds. 
- **Offloading**: Heavy operations (e.g., "Generate Match Brackets for 5,000 Athletes", "Send Result Emails to 500 Clubs") MUST be immediately offloaded to a message queue. The API MUST return a `202 Accepted` status with a `task_id` for the client to poll or receive WebSocket updates.

## 2. NATS Pub/Sub / Worker Queues
- **Infrastructure**: The designated event bus broker is `NATS` (or JetStream for persistent Queues).
- **Domain Events**: Services should emit Domain Events (e.g., `TournamentStarted`, `MatchFinished`) rather than directly calling other bounded context services.

## 3. Idempotent Consumers (At-Least-Once Delivery)
- **Message Retry Protection**: Message delivery guarantees are "At Least Once". Therefore, EVERY worker processing a job MUST be fully idempotent. 
- **Execution Locks**: The worker must verify (via database lock or Redis cache) whether it has already processed the specific `event_id`. Processing the same message twice must not result in duplicate emails or corrupted scores.

## 4. Dead Letter Queues (DLQ)
- **Maximum Retries**: A background worker that encounters an error MUST NOT retry infinitely, which risks poisoning the queue.
- **DLQ Routing**: After 3 consecutive exponential-backoff failures, the message MUST be moved to a DLQ (Dead Letter Queue) and trigger a high-priority alert for Administrator/SRE manual inspection.
