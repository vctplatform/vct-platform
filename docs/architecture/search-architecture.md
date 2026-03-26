# VCT Platform Search & Indexing Architecture

This document outlines how text search, discovery, and aggregations are performed across the VCT Platform, protecting the primary OLTP PostgreSQL database from devastating full-table scans.

## 1. The Wildcard `LIKE` Ban
- **Strict Prohibition**: Developers MUST NEVER build user-facing search features on large tables using `WHERE document LIKE '%search_term%'` or `ILIKE` clauses. This defeats B-Tree indexes and causes massive I/O spikes.
- **Exception**: Simple exact-match searches or prefix searches on tiny lookup tables (e.g., finding a Province by code) are permitted.

## 2. Meilisearch Synchronization
- **Primary Search Engine**: `Meilisearch` is the officially designated Full-Text Search and faceted filtering engine.
- **Replication**: Bounded contexts that require search (e.g., `AthleteDirectory`, `TournamentHub`) MUST sync their read-models into Meilisearch via CDC (Change Data Capture) or asynchronous Domain Events handlers.
- **Client Queries**: Frontend clients MUST either query Meilisearch directly using a scoped, read-only API key, or route via a thin Go Backend Proxy. Do not proxy heavy search payloads through the Go Database models.

## 3. Search Rate Limiting
- **DDoS Protection**: Search endpoints (Autocomplete, Full-Text Search) are highly susceptible to scraping and denial-of-service attacks.
- **Aggressive Limits**: All search endpoints MUST apply decoupled rate limiting. 

## 4. Typo Tolerance and Vietnamese Language
- The search engine MUST support Vietnamese diacritics ( dấu thanh ) natively, allowing users to search "Nguyen Van A" and still match "Nguyễn Văn A". Meilisearch handles this inherently, but tokenizer configurations must be explicitly defined and tested.
