# VCT Platform — Disaster Recovery Runbook

## RPO/RTO Targets

| Metric | Staging | Production |
|--------|---------|------------|
| **RPO** (Recovery Point Objective) | 24h | 1h (WAL archiving) |
| **RTO** (Recovery Time Objective) | 4h | 30min |

---

## Scenario 1: Database Corruption / Data Loss

### Immediate Actions
```bash
# 1. Stop write traffic
kubectl scale deployment vct-api -n vct-production --replicas=0

# 2. Identify last good backup
gsutil ls -l gs://vct-platform-backups/dumps/ | sort -k2 | tail -5

# 3. Point-in-Time Recovery (WAL-G)
wal-g backup-fetch /var/lib/postgresql/data LATEST
# Set recovery target in postgresql.conf:
#   recovery_target_time = '2026-03-20 08:00:00 UTC'

# 4. Start PostgreSQL in recovery mode
pg_ctl start -D /var/lib/postgresql/data

# 5. Verify data, then restart API
kubectl scale deployment vct-api -n vct-production --replicas=2
```

### Alternative: pg_dump Restore
```bash
gsutil cp gs://vct-platform-backups/dumps/LATEST.sql.gz /tmp/
gunzip /tmp/LATEST.sql.gz
pg_restore -h vct-postgres -U vct_user -d vct_platform \
  --no-owner --clean --if-exists /tmp/LATEST.sql
```

---

## Scenario 2: Complete Cluster Failure

```bash
# 1. Switch DNS to DR region
gcloud dns record-sets update api.vct-platform.com \
  --zone=vct-platform-zone --type=A \
  --rrdatas="DR_REGION_IP"

# 2. Deploy to DR cluster
kubectl config use-context vct-dr-cluster
helm upgrade --install vct infra/helm/vct-platform \
  --namespace vct-production --create-namespace

# 3. Restore database from cross-region backup
wal-g backup-fetch /var/lib/postgresql/data LATEST

# 4. Verify services
kubectl get pods -n vct-production
curl -f https://api.vct-platform.com/healthz
```

---

## Scenario 3: Single Service Failure

```bash
# Restart specific deployment
kubectl rollout restart deployment/vct-api -n vct-production

# Check pod status
kubectl get pods -l app.kubernetes.io/name=vct-api -n vct-production

# View logs for diagnostics
kubectl logs -l app.kubernetes.io/name=vct-api -n vct-production --tail=100
```

---

## Backup Schedule

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| WAL-G base | Daily 2AM | 7 days | GCS |
| pg_dump | Daily 2AM | 30 dumps | GCS |
| WAL archiving | Continuous | 7 days | GCS |
| Backup verify | Weekly Sun 6AM | 4 results | K8s logs |

---

## DR Drill

Run quarterly:
```bash
make dr-drill              # Full drill on staging
make dr-drill-production   # Production drill (read-only)
```

## Contacts

| Role | Contact |
|------|---------|
| DBA | dba@vct-platform.com |
| DevOps | devops@vct-platform.com |
| On-call | oncall@vct-platform.com |
