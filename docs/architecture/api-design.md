# VCT Platform — API Design

## Base URL

```
Production: https://api.vctplatform.vn/api/v1
Staging:    https://staging-api.vctplatform.vn/api/v1
Local:      http://localhost:8080/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token (JWT from Supabase):

```
Authorization: Bearer <token>
```

## Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "TOURNAMENT_NOT_FOUND",
    "message": "Giải đấu không tồn tại",
    "details": {}
  }
}
```

## API Endpoints

### Tournaments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tournaments` | List tournaments |
| POST | `/tournaments` | Create tournament |
| GET | `/tournaments/:id` | Get tournament detail |
| PUT | `/tournaments/:id` | Update tournament |
| GET | `/tournaments/:id/categories` | Get categories |
| GET | `/tournaments/:id/registrations` | Get registrations |

### Athletes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/athletes` | List athletes (filterable) |
| POST | `/athletes` | Create athlete |
| GET | `/athletes/:id` | Get athlete detail |
| PUT | `/athletes/:id` | Update athlete |
| GET | `/athletes/:id/belt-history` | Belt history |
| GET | `/athletes/:id/results` | Competition results |

### Organizations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/federations` | List federations |
| GET | `/clubs` | List clubs |
| GET | `/clubs/:id` | Club detail |
| GET | `/clubs/:id/members` | Club members |

### Scoring
| Method | Path | Description |
|--------|------|-------------|
| POST | `/matches/:id/events` | Record match event |
| GET | `/matches/:id/events` | Get match events |
| GET | `/matches/:id/state` | Get computed match state |

### Rankings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/rankings` | National rankings |
| GET | `/rankings/doi-khang` | Combat rankings |
| GET | `/rankings/quyen` | Forms rankings |
