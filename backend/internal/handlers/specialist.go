package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
	"compliancehub-backend/internal/models"
)

func ListAMLCases(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, tenant_id, entity_name, case_type, risk_severity, status,
		       assigned_expert_id, case_notes, created_at, updated_at
		FROM aml_cases
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`, tenantCtx.TenantID)

	if err != nil {
		http.Error(w, "Failed to query AML cases: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var cases []models.AMLCase
	for rows.Next() {
		var c models.AMLCase
		var notes *string
		var expertID *string
		if err := rows.Scan(
			&c.ID, &c.TenantID, &c.EntityName, &c.CaseType, &c.RiskSeverity, &c.Status,
			&expertID, &notes, &c.CreatedAt, &c.UpdatedAt,
		); err == nil {
			c.AssignedExpertID = expertID
			if notes != nil {
				c.CaseNotes = *notes
			}
			cases = append(cases, c)
		}
	}

	if cases == nil {
		cases = []models.AMLCase{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cases)
}

func CreateAMLCase(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	if tenantCtx.Role == "VIEWER" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Forbidden: Read-only viewers cannot open AML compliance investigations",
		})
		return
	}

	var req models.AMLCase
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.EntityName == "" || req.CaseType == "" {
		http.Error(w, "Entity name and case type are required", http.StatusBadRequest)
		return
	}

	if req.RiskSeverity == "" {
		req.RiskSeverity = "MEDIUM"
	}

	var newID string
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO aml_cases (tenant_id, entity_name, case_type, risk_severity, status, case_notes)
		VALUES ($1, $2, $3, $4, 'OPEN', $5)
		RETURNING id
	`, tenantCtx.TenantID, req.EntityName, req.CaseType, req.RiskSeverity, req.CaseNotes).Scan(&newID)

	if err != nil {
		http.Error(w, "Failed to create AML case: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      newID,
		"message": "AML investigation case opened",
	})
}

func ListPrivacyActivities(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, tenant_id, activity_name, purpose, data_categories, data_subjects,
		       lawful_basis, retention_period, cross_border_transfer, dpco_audit_ready, created_at
		FROM privacy_processing_activities
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`, tenantCtx.TenantID)

	if err != nil {
		http.Error(w, "Failed to query RoPA activities: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var activities []models.PrivacyProcessingActivity
	for rows.Next() {
		var a models.PrivacyProcessingActivity
		if err := rows.Scan(
			&a.ID, &a.TenantID, &a.ActivityName, &a.Purpose, &a.DataCategories, &a.DataSubjects,
			&a.LawfulBasis, &a.RetentionPeriod, &a.CrossBorderTransfer, &a.DPCOAuditReady, &a.CreatedAt,
		); err == nil {
			activities = append(activities, a)
		}
	}

	if activities == nil {
		activities = []models.PrivacyProcessingActivity{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activities)
}

func CreatePrivacyActivity(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	if tenantCtx.Role == "VIEWER" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Forbidden: Read-only viewers cannot create NDPA privacy processing records",
		})
		return
	}

	var req models.PrivacyProcessingActivity
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.ActivityName == "" || req.Purpose == "" || req.LawfulBasis == "" {
		http.Error(w, "Activity name, purpose, and lawful basis are required", http.StatusBadRequest)
		return
	}

	var newID string
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO privacy_processing_activities (
			tenant_id, activity_name, purpose, data_categories, data_subjects,
			lawful_basis, retention_period, cross_border_transfer, dpco_audit_ready
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, tenantCtx.TenantID, req.ActivityName, req.Purpose, req.DataCategories, req.DataSubjects,
		req.LawfulBasis, req.RetentionPeriod, req.CrossBorderTransfer, req.DPCOAuditReady).Scan(&newID)

	if err != nil {
		http.Error(w, "Failed to create processing activity: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      newID,
		"message": "NDPA 2023 RoPA record added",
	})
}

type DSARRequestItem struct {
	ID           string    `json:"id"`
	TenantID     string    `json:"tenant_id"`
	SubjectName  string    `json:"subject_name"`
	SubjectEmail string    `json:"subject_email"`
	RequestType  string    `json:"request_type"`
	Details      string    `json:"details"`
	Status       string    `json:"status"`
	Deadline     time.Time `json:"deadline"`
	CreatedAt    time.Time `json:"created_at"`
}

func ListDSARRequests(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	query := `
		SELECT id, tenant_id, subject_name, subject_email, request_type, details, status, deadline, created_at
		FROM dsar_requests
		WHERE tenant_id = $1
		ORDER BY deadline ASC, created_at DESC
	`

	rows, err := db.Pool.Query(r.Context(), query, tenantCtx.TenantID)
	if err != nil {
		http.Error(w, "Failed to query DSAR requests: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var dsars []DSARRequestItem
	for rows.Next() {
		var d DSARRequestItem
		if err := rows.Scan(
			&d.ID, &d.TenantID, &d.SubjectName, &d.SubjectEmail, &d.RequestType, &d.Details, &d.Status, &d.Deadline, &d.CreatedAt,
		); err == nil {
			dsars = append(dsars, d)
		}
	}

	if dsars == nil {
		dsars = []DSARRequestItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dsars)
}

func CreateDSARRequest(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	var req DSARRequestItem
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.SubjectName == "" || req.SubjectEmail == "" || req.RequestType == "" {
		http.Error(w, "Subject name, email, and request type are required", http.StatusBadRequest)
		return
	}

	if req.Status == "" {
		req.Status = "PENDING"
	}

	var newID string
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO dsar_requests (tenant_id, subject_name, subject_email, request_type, details, status, deadline)
		VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days')
		RETURNING id
	`, tenantCtx.TenantID, req.SubjectName, req.SubjectEmail, req.RequestType, req.Details, req.Status).Scan(&newID)

	if err != nil {
		http.Error(w, "Failed to create DSAR request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Log activity
	_, _ = db.Pool.Exec(r.Context(), `
		INSERT INTO activity_logs (tenant_id, actor_name, actor_role, action_type, details)
		VALUES ($1, 'Privacy Officer', 'DPCO Auditor', 'DSAR_LODGED', $2)
	`, tenantCtx.TenantID, "Lodged statutory NDPA DSAR for "+req.SubjectName+" ("+req.RequestType+")")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      newID,
		"message": "Statutory NDPA 2023 DSAR logged successfully",
	})
}
