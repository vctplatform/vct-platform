---
description: Generate API documentation by scanning Go HTTP handlers for route definitions
---

## Steps

1. Scan all handler files for route patterns
```bash
cd backend && Select-String -Path "internal\httpapi\*.go" -Pattern 'HandleFunc|Handle\(' | Select-Object -Property Filename, LineNumber, Line
```

2. Extract route registrations from server.go Handler() method
```bash
cd backend && Select-String -Path "internal\httpapi\server.go" -Pattern '(mux\.Handle|mux\.HandleFunc)\(' | ForEach-Object { $_.Line.Trim() }
```

3. List all handler functions grouped by module
```bash
cd backend && Select-String -Path "internal\httpapi\*_handler.go" -Pattern 'func \(s \*Server\) handle' | ForEach-Object { $_.Line.Trim() }
```

4. Generate API documentation markdown
- For each route: list Method, Path, Handler function, Auth required
- Group by module (auth, athlete, tournament, federation, etc.)
- Include request/response examples from handler code

5. Save to `docs/api/endpoints.md`

6. Update `docs/architecture/api-design.md` if routes have changed
