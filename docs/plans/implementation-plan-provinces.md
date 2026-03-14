# Implementation Plan: Update Provinces to 34
The user requested updating the administrative data of Vietnam after the latest mergers, bringing the total number of provinces/cities from 63 down to 34.

## Proposed Changes

### Backend Data Seeding
We will update the seed data that provides the list of provinces.

#### [MODIFY] [0040_federation_seed_data.sql](file:///d:/VCT%20PLATFORM/vct-platform/backend/migrations/0040_federation_seed_data.sql)
- Replace the 63 provinces `INSERT INTO federation_provinces` block with the new 34 provinces/cities list.
- We will group them by North, Central, and South regions appropriately.

#### [MODIFY] [seed_federation.go](file:///d:/VCT%20PLATFORM/vct-platform/backend/internal/adapter/seed_federation.go)
- Update the `SeedProvinces()` function to return the 34 merged provinces instead of the old 63 provinces.

### Documentation
#### [NEW] [province-merger-2025.md](file:///d:/VCT%20PLATFORM/vct-platform/docs/business-analysis/province-merger-2025.md)
- Create a document listing the 34 provinces and the context of the change to comply with the new documentation convention.

## Verification Plan
1. **Manual Verification**:
   - Run the backend database migration up/down or reset the database.
   - Run the backend server.
   - Check if the `/api/provinces` endpoint or relevant DB queries return 34 records.
2. **Automated Verification**:
   - Run `go test ./...` in the backend to ensure no seed data tests are broken by this change.
