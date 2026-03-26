package httpapi

import (
	"net/http"
	"os"
	"path/filepath"
)

// handleAPIDocs serves the Scalar API documentation UI.
func (s *Server) handleAPIDocs(w http.ResponseWriter, r *http.Request) {
	html := `<!doctype html>
<html>
  <head>
    <title>VCT Platform API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <!-- Scalar mounts here -->
    <script
      id="api-reference"
      data-url="/api/openapi.yaml">
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(html))
}

// handleAPISpec serves the raw OpenAPI YAML file.
func (s *Server) handleAPISpec(w http.ResponseWriter, r *http.Request) {
	// Simple lookup for the docs file relative to the working directory.
	// In production, you might want to //go:embed this file.
	path := filepath.Join("docs", "openapi.yaml")
	data, err := os.ReadFile(path)
	if err != nil {

		path = filepath.Join("..", "docs", "openapi.yaml")
		data, err = os.ReadFile(path)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài liệu OpenAPI")
			return
		}
	}

	w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
