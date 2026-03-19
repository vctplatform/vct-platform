FROM postgres:17-alpine

# Install extensions for VCT Platform
# ltree, pg_trgm, btree_gist are included in postgresql17-contrib (pre-installed on Alpine)
# pgvector requires separate installation
RUN apk add --no-cache postgresql17-pg_trgm

# Copy initialization SQL
COPY init.sql /docker-entrypoint-initdb.d/00_init.sql

# Copy production config (used when started with -c config_file=...)
COPY postgresql.conf /etc/postgresql/postgresql.conf
