package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
	"compliancehub-backend/internal/models"
)

func ListTenantObligations(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	authority := r.URL.Query().Get("authority")
	status := r.URL.Query().Get("status")

	query := `
		SELECT id, tenant_id, obligation_id, title, authority, TO_CHAR(due_date, 'YYYY-MM-DD'),
		       status, estimated_penalty_ngn, assigned_to, responsible_expert_id, is_urgent,
		       completed_at, created_at
		FROM tenant_obligations
		WHERE tenant_id = $1
	`
	args := []interface{}{tenantCtx.TenantID}

	if authority != "" && authority != "All" {
		query += " AND authority = $2"
		args = append(args, authority)
	}

	if status != "" && status != "All" {
		argIndex := len(args) + 1
		query += " AND status = $" + string(rune('0'+argIndex))
		args = append(args, status)
	}

	query += " ORDER BY is_urgent DESC, due_date ASC"

	rows, err := db.Pool.Query(r.Context(), query, args...)
	if err != nil {
		http.Error(w, "Failed to fetch obligations: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var obligations []models.TenantObligation
	for rows.Next() {
		var o models.TenantObligation
		var completedAt *time.Time
		if err := rows.Scan(
			&o.ID, &o.TenantID, &o.ObligationID, &o.Title, &o.Authority, &o.DueDate,
			&o.Status, &o.EstimatedPenaltyNGN, &o.AssignedTo, &o.ResponsibleExpertID,
			&o.IsUrgent, &completedAt, &o.CreatedAt,
		); err == nil {
			o.CompletedAt = completedAt
			obligations = append(obligations, o)
		}
	}

	if obligations == nil {
		obligations = []models.TenantObligation{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(obligations)
}

func CreateCustomObligation(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	if tenantCtx.Role == "VIEWER" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Forbidden: Read-only viewers cannot create or schedule statutory deadlines",
		})
		return
	}

	var req struct {
		Title               string  `json:"title"`
		Authority           string  `json:"authority"`
		DueDate             string  `json:"due_date"`
		EstimatedPenaltyNGN float64 `json:"estimated_penalty_ngn"`
		IsUrgent            bool    `json:"is_urgent"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.Title == "" || req.Authority == "" || req.DueDate == "" {
		http.Error(w, "Title, authority, and due date are required", http.StatusBadRequest)
		return
	}

	var newID string
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
		VALUES ($1, $2, $3, $4, 'PENDING', $5, $6)
		RETURNING id
	`, tenantCtx.TenantID, req.Title, req.Authority, req.DueDate, req.EstimatedPenaltyNGN, req.IsUrgent).Scan(&newID)

	if err != nil {
		http.Error(w, "Failed to create obligation: "+err.Error(), http.StatusInternalServerError)
		return
	}

	user := middleware.GetUserFromContext(r)
	actorName := "Operator"
	var userID *string
	if user != nil {
		actorName = user.FullName
		userID = &user.ID
	}

	_, _ = db.Pool.Exec(r.Context(), `
		INSERT INTO activity_logs (tenant_id, user_id, actor_name, actor_role, action_type, details)
		VALUES ($1, $2, $3, $4, 'CREATE_OBLIGATION', $5)
	`, tenantCtx.TenantID, userID, actorName, tenantCtx.Role, "Scheduled regulatory deadline: "+req.Title)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      newID,
		"message": "Obligation scheduled successfully",
	})
}

func CompleteObligation(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	if !tenantCtx.CanApproveFiling("hubcalendar") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Forbidden: Sign-off and statutory filing completion requires OWNER, ADMIN, COMPLIANCE_LEAD, or delegated filing sign-off permission",
		})
		return
	}

	// Extract obligation ID from path /api/v1/calendar/obligations/{id}/complete
	path := r.URL.Path
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	obligationID := parts[3]

	var req struct {
		EvidenceDocID string `json:"evidence_doc_id"`
		Notes         string `json:"notes"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	result, err := db.Pool.Exec(r.Context(), `
		UPDATE tenant_obligations
		SET status = 'FILED', completed_at = NOW(), is_urgent = false
		WHERE id = $1 AND tenant_id = $2
	`, obligationID, tenantCtx.TenantID)

	if err != nil || result.RowsAffected() == 0 {
		http.Error(w, "Obligation not found or update failed", http.StatusNotFound)
		return
	}

	user := middleware.GetUserFromContext(r)
	actorName := "Compliance Lead"
	var actorID *string
	if user != nil {
		actorName = user.FullName
		actorID = &user.ID
	}

	_, _ = db.Pool.Exec(r.Context(), `
		INSERT INTO activity_logs (tenant_id, user_id, actor_name, actor_role, action_type, details)
		VALUES ($1, $2, $3, 'LEAD', 'COMPLETE_OBLIGATION', $4)
	`, tenantCtx.TenantID, actorID, actorName, "Marked obligation as filed and verified")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Obligation marked as completed",
	})
}
