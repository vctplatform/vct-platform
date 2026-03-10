# Entity Route Contract

## Route Pattern

- Collection:
  - `GET /api/v1/{entity}`
  - `POST /api/v1/{entity}`
- Record:
  - `GET /api/v1/{entity}/{id}`
  - `PATCH /api/v1/{entity}/{id}`
  - `DELETE /api/v1/{entity}/{id}`
- Collection actions:
  - `PUT /api/v1/{entity}/bulk`
  - `POST /api/v1/{entity}/import`
  - `GET /api/v1/{entity}/export?format=json|csv`

## Supported Entities

- teams
- athletes
- registration
- results
- schedule
- arenas
- referees
- appeals
- weigh-ins
- combat-matches
- form-performances
- content-categories
- referee-assignments
- tournament-config

## Behavior Rules

- Reject unknown entity keys with `404`.
- Reject unsupported methods with `405`.
- Apply auth for entity routes unless `VCT_DISABLE_AUTH_FOR_DATA=true`.
- Keep response body JSON-encoded for both success and error helpers.

## Import/Export Rules

- `import` expects payload:

```json
{
  "items": [
    { "id": "record-1" }
  ]
}
```

- `export` defaults `format=json` when query parameter is missing.
- Reject unsupported format with `400`.
