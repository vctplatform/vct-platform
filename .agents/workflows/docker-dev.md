---
description: Start full development environment with Docker Compose + backend + frontend
---

// turbo-all

## Steps

1. Start infrastructure services (PostgreSQL, Redis, Meilisearch, MinIO, NATS)
```bash
docker-compose up -d
```

2. Wait for services to be healthy
```bash
docker-compose ps
```

3. Start the Go backend server
```bash
npm run dev:backend
```

4. Start the Next.js web frontend
```bash
npm run dev:web
```
