#!/bin/sh
# Generate userlist.txt for PgBouncer from environment variables
# Usage: entrypoint.sh (runs on container startup)
#
# Reads PGBOUNCER_USER and PGBOUNCER_PASSWORD env vars
# and generates the MD5 auth file that PgBouncer requires.

set -e

USER="${PGBOUNCER_USER:-vct_admin}"
PASS="${PGBOUNCER_PASSWORD:-vct_secret_2026}"

# PgBouncer MD5 format: "user" "md5<md5(password+user)>"
MD5=$(printf '%s%s' "${PASS}" "${USER}" | md5sum | awk '{print $1}')

echo "\"${USER}\" \"md5${MD5}\"" > /etc/pgbouncer/userlist.txt

echo "PgBouncer userlist generated for: ${USER}"

exec pgbouncer /etc/pgbouncer/pgbouncer.ini
