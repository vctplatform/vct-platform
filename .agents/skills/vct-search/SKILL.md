---
name: vct-search
description: Full-text search integration for VCT Platform using Meilisearch — indexing strategy, search API design, autocomplete, faceted search, and Vietnamese language support.
---

# VCT Platform Search (Meilisearch)

> **When to activate**: Implementing full-text search, autocomplete, fuzzy matching, faceted search, or Vietnamese-language search features.
>
> ⚠️ **Status**: Adapter stub exists at `backend/internal/adapter/meilisearch/` — implementation pending.

---

> 🚨 **MANDATORY COMPLIANCE**: You must strictly enforce the rules defined in `docs/architecture/search-architecture.md`. Wildcard `LIKE '%...%'` queries on large tables are banned. Meilisearch with CDC syncing is the mandatory full-text search engine.


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture

```
Frontend (Search UI)
    ↓ /api/v1/search?q=...
Backend Handler
    ↓
Search Service (domain layer)
    ↓
Meilisearch Adapter (adapter layer)
    ↓
Meilisearch Server (port 7700)
```

### Config
```env
VCT_MEILISEARCH_URL=http://localhost:7700
VCT_MEILISEARCH_API_KEY=your-master-key
```

---

## 2. Indexes

| Index | Source Entity | Searchable Fields | Filterable |
|-------|-------------|-------------------|------------|
| `athletes` | Athlete | name, club_name, province | gender, belt_level, status |
| `tournaments` | Tournament | name, location, organizer | status, year, province |
| `clubs` | Club | name, address, province | status, province_id |
| `techniques` | Technique | name, description, category | type, belt_level |
| `documents` | Document | title, content, author | doc_type, status |

---

## 3. Search API Design

### Backend Endpoint
```
GET /api/v1/search?q={query}&index={index}&limit=20&offset=0&filters=status:active
```

### Response
```json
{
  "hits": [...],
  "query": "nguyễn",
  "processingTimeMs": 2,
  "limit": 20,
  "offset": 0,
  "estimatedTotalHits": 150
}
```

---

## 4. Vietnamese Language Support

Meilisearch supports Vietnamese out-of-the-box. Configuration:

```json
{
  "searchableAttributes": ["name", "description"],
  "displayedAttributes": ["*"],
  "filterableAttributes": ["status", "province", "category"],
  "sortableAttributes": ["created_at", "name"],
  "typoTolerance": {
    "enabled": true,
    "minWordSizeForTypos": { "oneTypo": 3, "twoTypos": 6 }
  }
}
```

### Vietnamese-specific
- Diacritics handling: `nguyễn` matches `nguyen`
- Word tokenization supports Vietnamese compound words
- Fuzzy search with `typoTolerance`

---

## 5. Indexing Strategy

### Real-time Sync
```go
// After entity CRUD, sync to Meilisearch
func (s *Service) Create(entity Entity) error {
    // 1. Save to PostgreSQL
    if err := s.repo.Create(entity); err != nil { return err }
    
    // 2. Index in Meilisearch (async)
    go s.searchAdapter.Index("athletes", entity)
    
    return nil
}
```

### Batch Reindex
```go
// For initial setup or recovery
func (s *SearchService) ReindexAll(ctx context.Context, index string) error {
    entities, _ := s.repo.ListAll(ctx)
    return s.adapter.BulkIndex(index, entities)
}
```

---

## 6. Frontend Integration

```tsx
import { useDebounce } from '../hooks/useDebounce'

function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState([])

  useEffect(() => {
    if (debouncedQuery.length < 2) return
    apiCall(`/api/v1/search?q=${debouncedQuery}&index=athletes`)
      .then(data => setResults(data.hits))
  }, [debouncedQuery])

  return (
    <VCT_Input
      placeholder={t('search.placeholder')}
      value={query}
      onChange={e => setQuery(e.target.value)}
      icon={<VCT_Icons.Search size={16} />}
    />
  )
}
```

---

## 7. Implementation Checklist

1. [ ] Implement Meilisearch adapter in `backend/internal/adapter/meilisearch/`
2. [ ] Add search service in `backend/internal/domain/search/`
3. [ ] Create search handler in `backend/internal/httpapi/search_handler.go`
4. [ ] Register route: `GET /api/v1/search`
5. [ ] Add Meilisearch to `docker-compose.yml`
6. [ ] Create index configuration per entity type
7. [ ] Implement real-time sync on entity CRUD
8. [ ] Add batch reindex admin endpoint
9. [ ] Frontend: search component with debounce
10. [ ] Vietnamese language testing
