# ═══════════════════════════════════════════════════
# VCT Backend — Optimized Production Dockerfile
# For Fly.io (256MB RAM) — stripped binary, alpine
# ═══════════════════════════════════════════════════

# ── Stage 1: Build ──
FROM golang:1.26-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /src

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build with stripped symbols for smaller binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /out/vct-backend ./cmd/server

# ── Stage 2: Runtime (minimal alpine ~5MB) ──
FROM alpine:3.23
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /out/vct-backend /app/vct-backend
EXPOSE 8080
ENTRYPOINT ["/app/vct-backend"]
