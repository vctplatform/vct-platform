---
description: Backup database before critical operations (migrations, bulk updates)
---

## Steps

1. Verify database connection
```bash
cd backend && go run ./cmd/migrate status
```

2. Create a timestamped backup via pg_dump
```bash
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"; pg_dump $env:VCT_POSTGRES_URL --format=custom --file="backups/vct_backup_$timestamp.dump"
```

3. Verify backup file was created
```bash
Get-ChildItem backups/*.dump | Sort-Object LastWriteTime -Descending | Select-Object -First 3
```

4. (Optional) Create a Neon branch snapshot for point-in-time restore
```
If using Neon: Create a branch from the current state via Neon Console or CLI
neonctl branches create --name "backup-$timestamp" --project-id $VCT_NEON_PROJECT_ID
```

5. Report backup status and file size
