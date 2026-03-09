FROM postgres:18

# Install extensions for VCT Platform
RUN apt-get update && apt-get install -y \
    postgresql-18-pgvector \
    && rm -rf /var/lib/apt/lists/*

COPY init.sql /docker-entrypoint-initdb.d/
