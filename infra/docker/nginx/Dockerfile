FROM nginx:1.27-alpine

# Install openssl for self-signed cert generation
RUN apk add --no-cache openssl

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed cert for dev/staging (production uses Let's Encrypt)
RUN openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=VN/ST=HCMC/L=HCMC/O=VCT Platform/OU=Dev/CN=localhost"

# Create ACME challenge directory
RUN mkdir -p /var/www/certbot

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Custom error page
RUN echo '<!DOCTYPE html><html><head><title>VCT Platform</title><style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}div{text-align:center}h1{font-size:3rem;color:#22d3ee}p{color:#94a3b8}</style></head><body><div><h1>⚡ VCT Platform</h1><p>Service temporarily unavailable. Please try again.</p></div></body></html>' > /usr/share/nginx/html/50x.html

EXPOSE 80 443
