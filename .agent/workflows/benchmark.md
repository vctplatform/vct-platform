---
description: Run performance benchmarks for Go backend — handler throughput, database queries, and memory profiling
---

// turbo-all

## Steps

1. Run Go benchmarks (existing)
```bash
cd backend && go test ./... -bench=. -benchmem -count=3 -run=^$ -timeout 5m
```

2. Profile handler latency (if benchmark tests exist)
```bash
cd backend && go test ./internal/httpapi/ -bench=BenchmarkHandler -benchmem -count=5 -run=^$
```

3. Generate CPU profile (for deep analysis)
```bash
cd backend && go test ./internal/httpapi/ -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof -run=^$
```

4. Analyze CPU profile
```bash
cd backend && go tool pprof -top cpu.prof
```

5. Analyze memory profile
```bash
cd backend && go tool pprof -top mem.prof
```

6. Report results
- Compare against previous benchmarks (if available)
- Flag any regression > 10% in throughput or memory
- Document hotspots from pprof output
