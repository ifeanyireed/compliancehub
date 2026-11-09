package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
)

type ActivityLogItem struct {
	ID        string    `json:"id"`
	TenantID  *string   `json:"tenant_id,omitempty"`
	UserID    *string   `json:"user_id,omitempty"`
	ActorName string    `json:"actor_name"`
	ActorRole string    `json:"actor_role"`
	ActionType string   `json:"action_type"`
	Details   string    `json:"details"`
	IPAddress *string   `json:"ip_address,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateActivityLogRequest struct {
	ActionType string `json:"action_type"`
	Details    string `json:"details"`
	ActorName  string `json:"actor_name,omitempty"`
	ActorRole  string `json:"actor_role,omitempty"`
}

func ListActivityLogs(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	tenantID := ""
	if tenantCtx != nil {
		tenantID = tenantCtx.TenantID
	}

	query := `
		SELECT id, tenant_id, user_id, actor_name, actor_role, action_type, details, ip_address, created_at
		FROM activity_logs
	`
	var rowsArgs []interface{}
	if tenantID != "" {
		query += " WHERE tenant_id = $1 OR tenant_id IS NULL"
		rowsArgs = append(rowsArgs, tenantID)
	}
	query += " ORDER BY created_at DESC LIMIT 50"

	rows, err := db.Pool.Query(r.Context(), query, rowsArgs...)
	if err != nil {
		http.Error(w, "Failed to query activity logs: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []ActivityLogItem
	for rows.Next() {
		var l ActivityLogItem
		if err := rows.Scan(
			&l.ID, &l.TenantID, &l.UserID, &l.ActorName, &l.ActorRole, &l.ActionType, &l.Details, &l.IPAddress, &l.CreatedAt,
		); err == nil {
			logs = append(logs, l)
		}
	}

	if logs == nil {
		logs = []ActivityLogItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func CreateActivityLog(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	tenantID := ""
	if tenantCtx != nil {
		tenantID = tenantCtx.TenantID
	}

	var req CreateActivityLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	actorName := req.ActorName
	if actorName == "" {
		actorName = "Compliance Operator"
	}
	actorRole := req.ActorRole
	if actorRole == "" {
		actorRole = "Officer"
	}

	var logItem ActivityLogItem
	insertSQL := `
		INSERT INTO activity_logs (tenant_id, actor_name, actor_role, action_type, details, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, tenant_id, user_id, actor_name, actor_role, action_type, details, ip_address, created_at
	`
	var tID *string
	if tenantID != "" {
		tID = &tenantID
	}

	err := db.Pool.QueryRow(r.Context(), insertSQL, tID, actorName, actorRole, req.ActionType, req.Details).Scan(
		&logItem.ID, &logItem.TenantID, &logItem.UserID, &logItem.ActorName, &logItem.ActorRole, &logItem.ActionType, &logItem.Details, &logItem.IPAddress, &logItem.CreatedAt,
	)
	if err != nil {
		http.Error(w, "Failed to insert activity log: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(logItem)
}
