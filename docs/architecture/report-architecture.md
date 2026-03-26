# 19. Reporting & Export Architecture

**Core Principle**: "Extracting and shaping data is computationally heavy. Large datasets must never crash the UI, and they must never OOM the server."

---

## 1. Asynchronous Generation Rule (The 500-Row Limit)

### 1.1 Synchronous Exports
- Any CSV/Excel export containing **fewer than 500 rows**, or a simple single-page PDF (like an individual Invoice or Certificate), may be generated synchronously.
- The Go Backend can return the file directly over the HTTP response stream (with correct `Content-Disposition` headers).

### 1.2 Asynchronous Exports
- Any report exceeding **500 rows**, complex aggregated analytics (e.g., federation-wide year-end statistics), or bulk certificate generations (e.g., printing ID cards for 1,000 athletes) **MUST** be offloaded to a Background Worker.
- **Workflow**:
  1. The UI sends the export request.
  2. The Backend validates access and dispatches an event via NATS (`reporting.export.requested`).
  3. The Backend responds to the UI with `202 Accepted` and a `job_id`.
  4. The UI displays a "Generating..." state (e.g., a toast notification overlay).
  5. The Background Worker processes the file, uploads it to File Storage (MinIO/S3), and dispatches a completion event (`reporting.export.completed`).
  6. The UI receives real-time notification via WebSocket that the file is ready to download.

---

## 2. Stream, Don't Buffer (Memory Protection)

When generating massive CSV or Excel files in the Go Backend:
- It is **strictly forbidden** to execute a query, load 50,000 Go structs into an array (RAM), and then write them to a file. This leads to Out-Of-Memory (OOM) crashes under load.
- **Standard Practice (Streaming)**:
  - You must use `rows, err := db.Query(ctx, ...)` and iterate using `for rows.Next()`.
  - Inside the loop, immediately serialize the single row to CSV/Excel and flush it to the `io.Writer`.

---

## 3. File Storage & Delivery (The Presigned Link)

- **Zero Binary Transit:** The Go application server must never hold large generated report files on local disk (beyond `/tmp/` staging).
- Generated reports are streamed directly into MinIO/S3 private buckets.
- **Delivery Validation:** Users download the report via a dynamically generated **Presigned S3 URL** with a strict expiration mechanism (e.g., valid for 5 minutes). Direct binary distribution across the VCT Gateway is banned to save HTTP bandwidth.

---

## 4. PDF Generation Standardization

- **The HTML-to-PDF Rule:** For certificates, ID cards, and invoices, the platform avoids hardcoding X/Y PDF coordinates using Go libraries like `gofpdf`, as it is incredibly brittle to design changes.
- **Workflow:**
  - Create a standard HTML/Tailwind template.
  - Inject data into the template.
  - Pass the HTML to a headless rendering microservice (e.g., Gotenberg, Playwright/Puppeteer cluster) to generate pixel-perfect PDFs.

---

## 5. Watermarking & Audit Trails

- **Traceability:** Massive exports of sensitive data (e.g., full Athlete Registries, financial ledgers) present a data-leak risk.
- **Mandate:** The export service must insert hidden metadata or subtle watermarks (e.g., in PDF footers or as a hidden Excel sheet property) containing:
  - `Exported_By_User_ID`
  - `Timestamp_UTC`
  - `Audit_Hash`
- All generation requests must be logged in the centralized Audit Log.
