#!/usr/bin/env bash
# VCT Platform — Generate Self-Signed SSL Certificates for PostgreSQL
# Usage: ./generate-certs.sh [output-dir]
#
# Creates server.crt + server.key for PostgreSQL SSL connections.
# For development and staging only — use proper CA certs in production.

set -euo pipefail

OUTPUT_DIR="${1:-$(dirname "$0")}"
DAYS=365
CN="vct-postgres"
COUNTRY="VN"
STATE="Ho Chi Minh"
ORG="VCT Platform"

echo "=== VCT Platform — SSL Certificate Generator ==="
echo "Output: ${OUTPUT_DIR}"

mkdir -p "${OUTPUT_DIR}"

# Generate private key
openssl genrsa -out "${OUTPUT_DIR}/server.key" 2048

# Set permissions (PostgreSQL requires restrictive perms)
chmod 600 "${OUTPUT_DIR}/server.key"

# Generate self-signed certificate
openssl req -new -x509 \
  -key "${OUTPUT_DIR}/server.key" \
  -out "${OUTPUT_DIR}/server.crt" \
  -days "${DAYS}" \
  -subj "/C=${COUNTRY}/ST=${STATE}/O=${ORG}/CN=${CN}" \
  2>/dev/null

# Copy cert as root CA (self-signed)
cp "${OUTPUT_DIR}/server.crt" "${OUTPUT_DIR}/root.crt"

echo ""
echo "✅ Certificates generated:"
echo "   server.key  — Private key"
echo "   server.crt  — Server certificate (valid ${DAYS} days)"
echo "   root.crt    — Root CA (same as server.crt for self-signed)"
echo ""
echo "To use in PostgreSQL, mount these files and add to postgresql.conf:"
echo "   ssl = on"
echo "   ssl_cert_file = '/etc/postgresql/ssl/server.crt'"
echo "   ssl_key_file  = '/etc/postgresql/ssl/server.key'"
