#!/usr/bin/env bash
# VCT Platform — SSL Certificate Renewal Script
# Renews Let's Encrypt certificates via Certbot
#
# Usage: ./ssl-renew.sh [domain]
# Requires: certbot running alongside nginx

set -euo pipefail

DOMAIN="${1:-vct-platform.com}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
NGINX_SSL_DIR="/etc/nginx/ssl"

echo "═══════════════════════════════════════"
echo "  VCT SSL Certificate Renewal"
echo "═══════════════════════════════════════"
echo ""
echo "Domain: ${DOMAIN}"
echo "Email:  ${EMAIL}"
echo ""

# ── Check if certs exist ─────────────────────────────────────
if [ -f "${CERT_DIR}/fullchain.pem" ]; then
    echo "Existing certificate found. Attempting renewal..."
    certbot renew --quiet --deploy-hook "nginx -s reload"
    RESULT=$?
else
    echo "No certificate found. Requesting new certificate..."
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        --domain "${DOMAIN}" \
        --domain "www.${DOMAIN}" \
        --non-interactive
    RESULT=$?
fi

if [ ${RESULT} -eq 0 ]; then
    # Copy certs to nginx SSL directory
    if [ -f "${CERT_DIR}/fullchain.pem" ]; then
        cp "${CERT_DIR}/fullchain.pem" "${NGINX_SSL_DIR}/cert.pem"
        cp "${CERT_DIR}/privkey.pem" "${NGINX_SSL_DIR}/key.pem"
        echo "✅ Certificates updated and deployed"
        
        # Reload nginx
        nginx -s reload 2>/dev/null || true
    fi
else
    echo "❌ Certificate renewal/request failed"
    exit 1
fi

# ── Report certificate info ──────────────────────────────────
if [ -f "${NGINX_SSL_DIR}/cert.pem" ]; then
    echo ""
    echo "Certificate details:"
    openssl x509 -in "${NGINX_SSL_DIR}/cert.pem" -noout \
        -subject -issuer -dates 2>/dev/null || true
fi

echo ""
echo "═══════════════════════════════════════"
echo "  SSL renewal complete"
echo "═══════════════════════════════════════"
