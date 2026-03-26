---
name: vct-file-storage
description: S3-compatible file storage for VCT Platform using MinIO — file upload/download, image handling, document storage, and CDN patterns.
---

# VCT Platform File Storage (MinIO/S3)

> **When to activate**: Implementing file uploads, image management, document storage, athlete photos, certificate PDFs, or any binary asset handling.
>
> ⚠️ **Status**: Adapter stub exists at `backend/internal/adapter/minio/` — implementation pending.

---

> 🚨 **MANDATORY COMPLIANCE**: You must strictly enforce the rules defined in `docs/architecture/file-storage-architecture.md`. Base64 payloads are banned. Large binary streams must bypass the Go Backend using **Presigned URLs** directly to MinIO.


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture

```
Frontend (File Upload UI)
    ↓ multipart/form-data
Backend Handler
    ↓
Storage Service (domain layer)
    ↓
MinIO Adapter (adapter layer)
    ↓
MinIO Server (S3-compatible, port 9000)
    │
    ├── Bucket: vct-avatars       (athlete photos)
    ├── Bucket: vct-documents     (official docs, PDFs)
    ├── Bucket: vct-certificates  (cert images)
    └── Bucket: vct-media         (general uploads)
```

### Config
```env
VCT_MINIO_ENDPOINT=localhost:9000
VCT_MINIO_ACCESS_KEY=minioadmin
VCT_MINIO_SECRET_KEY=minioadmin
VCT_MINIO_USE_SSL=false
VCT_MINIO_REGION=ap-southeast-1
```

---

## 2. Bucket Strategy

| Bucket | Content | Max Size | Allowed Types |
|--------|---------|----------|--------------|
| `vct-avatars` | Athlete/user photos | 5MB | jpg, png, webp |
| `vct-documents` | Official documents, regulations | 20MB | pdf, docx, xlsx |
| `vct-certificates` | Belt certificates, awards | 10MB | pdf, png, jpg |
| `vct-media` | General uploads, gallery | 50MB | jpg, png, mp4, webp |

---

## 3. Upload API Design

### Backend Endpoints
```
POST   /api/v1/files/upload          # Upload file (multipart)
GET    /api/v1/files/{id}            # Get file metadata
GET    /api/v1/files/{id}/download   # Download file (presigned URL)
DELETE /api/v1/files/{id}            # Soft delete
GET    /api/v1/files?entity_type=athlete&entity_id={id}  # List files for entity
```

### Upload Flow
```go
func (s *Server) handleFileUpload(w http.ResponseWriter, r *http.Request) {
    // 1. Parse multipart form (max 50MB)
    r.ParseMultipartForm(50 << 20)
    file, header, _ := r.FormFile("file")
    defer file.Close()
    
    // 2. Validate file type and size
    // 3. Generate unique object key: {bucket}/{entity_type}/{entity_id}/{uuid}.{ext}
    // 4. Upload to MinIO
    // 5. Save metadata to PostgreSQL
    // 6. Return file metadata with presigned URL
}
```

### File Metadata (PostgreSQL)
```sql
CREATE TABLE platform.files (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID REFERENCES core.tenants(id),
    entity_type  VARCHAR(50),        -- 'athlete', 'tournament', 'document'
    entity_id    UUID,               -- Related entity
    bucket       VARCHAR(100),
    object_key   VARCHAR(500),       -- Full path in MinIO
    filename     VARCHAR(255),       -- Original filename
    content_type VARCHAR(100),
    size_bytes   BIGINT,
    uploaded_by  UUID,
    created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Presigned URLs

```go
// Generate time-limited download URL (1 hour)
func (a *MinIOAdapter) GetPresignedURL(bucket, key string) (string, error) {
    url, err := a.client.PresignedGetObject(ctx, bucket, key, time.Hour, nil)
    return url.String(), err
}
```

### Frontend Usage
```tsx
// Don't store MinIO URL directly — use presigned URL from API
const downloadURL = await apiCall(`/api/v1/files/${fileId}/download`)
window.open(downloadURL.url)
```

---

## 5. Image Processing

```go
// Resize avatar on upload
func processAvatar(file io.Reader) (io.Reader, error) {
    // Resize to 256x256
    // Convert to WebP for smaller size
    // Return processed image
}
```

---

## 6. Frontend Component

```tsx
import { VCT_FileUpload } from '@vct/ui'

<VCT_FileUpload
  accept="image/*"
  maxSize={5 * 1024 * 1024}  // 5MB
  onUpload={async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity_type', 'athlete')
    formData.append('entity_id', athleteId)
    return apiCall('/api/v1/files/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Don't set Content-Type (browser sets boundary)
    })
  }}
/>
```

---

## 7. Implementation Checklist

1. [ ] Implement MinIO adapter in `backend/internal/adapter/minio/`
2. [ ] Add storage service in `backend/internal/domain/storage/`
3. [ ] Create file handler in `backend/internal/httpapi/file_handler.go`
4. [ ] Create `platform.files` migration
5. [ ] Register routes in `server.go`
6. [ ] Add MinIO to `docker-compose.yml`
7. [ ] Create buckets on startup
8. [ ] Frontend: file upload component integration
9. [ ] Image processing (resize, WebP conversion)
10. [ ] Presigned URL generation for downloads

---

## 8. Anti-Patterns

1. ❌ **NEVER** store files in PostgreSQL BLOB — use MinIO
2. ❌ **NEVER** expose MinIO URLs directly — use presigned URLs
3. ❌ **NEVER** skip file type validation (security risk)
4. ❌ **NEVER** allow unlimited upload size
5. ❌ **NEVER** store file content without metadata in PostgreSQL
