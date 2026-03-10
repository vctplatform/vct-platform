# Auth API Contract

## Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/revoke`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/audit`

## Login Request

```json
{
  "username": "admin",
  "password": "Admin@123",
  "role": "admin",
  "tournamentCode": "VCT-2026",
  "operationShift": "sang"
}
```

## Login/Refresh Response

```json
{
  "token": "<access>",
  "accessToken": "<access>",
  "refreshToken": "<refresh>",
  "tokenType": "Bearer",
  "expiresAt": "2026-03-09T03:00:00Z",
  "refreshExpiresAt": "2026-03-16T03:00:00Z",
  "user": {
    "id": "u-admin",
    "username": "admin",
    "displayName": "Quản trị hệ thống",
    "role": "admin"
  },
  "tournamentCode": "VCT-2026",
  "operationShift": "sang"
}
```

## Revoke Request

```json
{
  "refreshToken": "optional",
  "accessToken": "optional",
  "revokeAll": false,
  "reason": "optional"
}
```

## Audit Access Policy

- Allow `admin` and `btc` roles.
- Reject all other roles with forbidden error.

## Error Mapping

- `ErrBadRequest` -> `400`
- `ErrInvalidCredentials` -> `401`
- `ErrUnauthorized` -> `401`
- `ErrForbidden` -> `403`
