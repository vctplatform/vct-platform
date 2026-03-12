# VCT Platform — API Route Inventory

> Auto-generated from `server.go`. Use as a base for full OpenAPI spec.

## Health & WebSocket

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/healthz` | ✗ | `handleHealth` | Liveness probe |
| GET | `/api/v1/ws` | JWT (first msg) | `handleWebSocket` | WebSocket scoring channel |

## Auth (`/api/v1/auth/`)

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/api/v1/auth/login` | ✗ | `handleAuthLogin` | Email/password login (rate-limited) |
| POST | `/api/v1/auth/register` | ✗ | `handleAuthRegister` | New user registration (rate-limited) |
| POST | `/api/v1/auth/refresh` | JWT | `handleAuthRefresh` | Refresh access token |
| GET | `/api/v1/auth/me` | JWT | `handleAuthMe` | Current user info |
| POST | `/api/v1/auth/logout` | JWT | `handleAuthLogout` | Revoke refresh token |
| POST | `/api/v1/auth/revoke` | JWT | `handleAuthRevoke` | Revoke any token |
| GET | `/api/v1/auth/audit` | JWT | `handleAuthAudit` | Auth audit log |
| POST | `/api/v1/auth/switch-context` | JWT | `handleAuthSwitchContext` | Switch active org context |
| GET | `/api/v1/auth/my-roles` | JWT | `handleAuthMyRoles` | List user's roles |

## Scoring (`/api/v1/scoring/`)

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| * | `/api/v1/scoring/*` | JWT | `handleScoringRoutes` | Combat/Forms scoring (sub-routes) |

## Public Data (`/api/v1/public/`)

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| * | `/api/v1/public/*` | ✗ | `handlePublicRoutes` | Public tournament data, rankings |

## CRUD Resources

| Method | Base Path | Auth | Handler | Module |
|--------|-----------|------|---------|--------|
| CRUD | `/api/v1/athletes/` | JWT | `handleAthleteRoutes` | Athletes |
| CRUD | `/api/v1/teams/` | JWT | `handleTeamRoutes` | Teams |
| CRUD | `/api/v1/referees/` | JWT | `handleRefereeRoutes` | Referees |
| CRUD | `/api/v1/arenas/` | JWT | `handleArenaRoutes` | Arenas |
| CRUD | `/api/v1/registration/` | JWT | `handleRegistrationRoutes` | Registration |
| CRUD | `/api/v1/tournaments/` | JWT | `handleTournamentRoutes` | Tournaments |
| CRUD | `/api/v1/rankings/` | JWT | `handleRankingRoutes` | Rankings |
| CRUD | `/api/v1/belts/` | JWT | `handleBeltRoutes` | Belt system |
| CRUD | `/api/v1/techniques/` | JWT | `handleTechniqueRoutes` | Techniques |
| CRUD | `/api/v1/transactions/` | JWT | `handleTransactionRoutes` | Transactions |
| CRUD | `/api/v1/budgets` | JWT | `handleBudgetRoutes` | Budgets |
| CRUD | `/api/v1/clubs/` | JWT | `handleClubRoutes` | Clubs |
| CRUD | `/api/v1/members/` | JWT | `handleMemberRoutes` | Members |
| CRUD | `/api/v1/community-events/` | JWT | `handleCommunityEventRoutes` | Events |

## Finance (`/api/v1/finance/`)

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/api/v1/finance/invoices` | JWT | `handleInvoiceList` | List invoices |
| GET | `/api/v1/finance/invoices/{id}` | JWT | `handleInvoiceGet` | Get invoice detail |
| POST | `/api/v1/finance/payments` | JWT | `handlePaymentRecord` | Record payment |
| POST | `/api/v1/finance/payments/{id}` | JWT | `handlePaymentConfirm` | Confirm payment |
| GET | `/api/v1/finance/fee-schedules` | JWT | `handleFeeScheduleList` | List fee schedules |
| GET | `/api/v1/finance/budgets` | JWT | `handleBudgetList` | List budgets |
| GET | `/api/v1/finance/sponsorships/` | JWT | `handleSponsorshipList` | List sponsors |
| POST | `/api/v1/finance/sponsorships` | JWT | `handleSponsorshipCreate` | Add sponsor |

## Tournament Actions (`/api/v1/tournaments-action/`)

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `tournaments-action/open-registration` | JWT | `handleTournamentOpenRegistration` | Open registration |
| POST | `tournaments-action/lock-registration` | JWT | `handleTournamentLockRegistration` | Lock registration |
| POST | `tournaments-action/start` | JWT | `handleTournamentStart` | Start tournament |
| POST | `tournaments-action/end` | JWT | `handleTournamentEnd` | End tournament |
| POST | `tournaments-action/generate-bracket` | JWT | `handleBracketGenerate` | Generate bracket |
| GET | `tournaments-action/brackets` | JWT | `handleBracketGet` | Get bracket |
| POST | `brackets-action/assign-medals` | JWT | `handleAssignMedals` | Assign medals |

## Team Actions

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `teams-action/approve` | JWT | `handleTeamApprove` | Approve team |
| POST | `teams-action/reject` | JWT | `handleTeamReject` | Reject team |
| POST | `teams-action/checkin` | JWT | `handleTeamCheckin` | Check-in team |

## Validation

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/api/v1/registrations/validate` | JWT | `handleRegistrationValidate` | Validate registration |

## Recent Events

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/api/v1/events/recent` | JWT | `handleRecentEvents` | System event feed |

## Catch-All

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| * | `/api/v1/*` | JWT | `handleEntityRoutes` | Dynamic entity CRUD |

---

**Total routes: 48+** (many CRUD routes contain sub-routes handled by path parsing)

**Standard Error Response:**
```json
{
  "code": "VALIDATION_ERROR | NOT_FOUND | DUPLICATE | UNAUTHORIZED | FORBIDDEN | INTERNAL_ERROR | BAD_REQUEST | CONFLICT | RATE_LIMITED",
  "message": "Human-readable message in Vietnamese",
  "details": {}
}
```

Defined in: `httpapi/apierror.go`
