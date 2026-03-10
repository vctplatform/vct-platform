package httpapi

import (
	"encoding/json"
	"net/http"
	"runtime"
	"time"
)

// HealthStatus represents the response from the /healthz endpoint.
type HealthStatus struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Version   string            `json:"version"`
	Uptime    string            `json:"uptime"`
	GoVersion string            `json:"goVersion"`
	Checks    map[string]string `json:"checks"`
}

var serverStartTime = time.Now()

// HandleHealthz returns server health information.
func HandleHealthz(w http.ResponseWriter, r *http.Request) {
	status := HealthStatus{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "1.0.0",
		Uptime:    time.Since(serverStartTime).Round(time.Second).String(),
		GoVersion: runtime.Version(),
		Checks: map[string]string{
			"api": "up",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}
