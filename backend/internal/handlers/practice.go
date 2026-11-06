package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
	"compliancehub-backend/internal/models"
)

func ListPractitioners(w http.ResponseWriter, r *http.Request) {
	specialisation := r.URL.Query().Get("specialisation")

	query := `
		SELECT p.id, p.user_id, p.firm_name, p.qualification, p.years_experience,
		       p.specialisations, p.hourly_rate_ngn, p.monthly_retainer_ngn, p.bio,
		       p.verification_status, p.active_clients_count,
		       u.full_name, u.email, COALESCE(u.avatar_url, '/character1.jpg'), p.created_at
		FROM professional_profiles p
		JOIN users u ON p.user_id = u.id
		WHERE p.verification_status = 'VERIFIED'
	`
	args := []interface{}{}

	if specialisation != "" && specialisation != "All" {
		query += " AND $1 = ANY(p.specialisations)"
		args = append(args, specialisation)
	}

	query += " ORDER BY p.active_clients_count DESC, p.years_experience DESC"

	rows, err := db.Pool.Query(r.Context(), query, args...)
	if err != nil {
		http.Error(w, "Failed to query professionals: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var experts []models.ProfessionalProfile
	for rows.Next() {
		var p models.ProfessionalProfile
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.FirmName, &p.Qualification, &p.YearsExperience,
			&p.Specialisations, &p.HourlyRateNGN, &p.MonthlyRetainerNGN, &p.Bio,
			&p.VerificationStatus, &p.ActiveClientsCount,
			&p.FullName, &p.Email, &p.AvatarURL, &p.CreatedAt,
		); err == nil {
			experts = append(experts, p)
		}
	}

	if experts == nil {
		experts = []models.ProfessionalProfile{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(experts)
}

func ListClientWorkspaces(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()

	// Find the professional profile for this user
	var profID string
	err := db.Pool.QueryRow(ctx, `
		SELECT id FROM professional_profiles WHERE user_id = $1
	`, user.ID).Scan(&profID)

	// If demo user or not found, fallback to Tunde Bakare's seeded profile
	if err != nil {
		profID = "66666666-6666-6666-6666-666666666601"
	}

	query := `
		SELECT e.id, e.tenant_id, t.workspace_name, o.rc_number, o.industry,
		       t.compliance_score, e.engagement_type, e.scope_summary, e.monthly_fee_ngn,
		       e.status, e.start_date,
		       (SELECT COUNT(*) FROM tenant_obligations to2 WHERE to2.tenant_id = t.id AND to2.is_urgent = true AND to2.status = 'PENDING') as urgent_count
		FROM engagements e
		JOIN tenants t ON e.tenant_id = t.id
		JOIN organisations o ON t.organisation_id = o.id
		WHERE e.professional_id = $1 AND e.status = 'ACTIVE'
		ORDER BY t.compliance_score ASC
	`

	rows, err := db.Pool.Query(ctx, query, profID)
	if err != nil {
		http.Error(w, "Failed to query client workspaces: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type ClientWorkspaceItem struct {
		EngagementID    string  `json:"engagement_id"`
		TenantID        string  `json:"tenant_id"`
		CompanyName     string  `json:"company_name"`
		RCNumber        string  `json:"rc_number"`
		Industry        string  `json:"industry"`
		ComplianceScore int     `json:"compliance_score"`
		EngagementType  string  `json:"engagement_type"`
		ScopeSummary    string  `json:"scope_summary"`
		MonthlyFeeNGN   float64 `json:"monthly_fee_ngn"`
		Status          string  `json:"status"`
		StartDate       string  `json:"start_date"`
		UrgentCount     int     `json:"urgent_count"`
	}

	var clients []ClientWorkspaceItem
	for rows.Next() {
		var item ClientWorkspaceItem
		if err := rows.Scan(
			&item.EngagementID, &item.TenantID, &item.CompanyName, &item.RCNumber,
			&item.Industry, &item.ComplianceScore, &item.EngagementType, &item.ScopeSummary,
			&item.MonthlyFeeNGN, &item.Status, &item.StartDate, &item.UrgentCount,
		); err == nil {
			clients = append(clients, item)
		}
	}

	if clients == nil {
		clients = []ClientWorkspaceItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(clients)
}

func ListPracticeTasks(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r)
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	var profID string
	err := db.Pool.QueryRow(ctx, "SELECT id FROM professional_profiles WHERE user_id = $1", user.ID).Scan(&profID)
	if err != nil {
		profID = "66666666-6666-6666-6666-666666666601"
	}

	query := `
		SELECT to2.id, to2.tenant_id, t.workspace_name, to2.title, to2.authority,
		       TO_CHAR(to2.due_date, 'YYYY-MM-DD'), to2.status, to2.is_urgent, to2.estimated_penalty_ngn
		FROM tenant_obligations to2
		JOIN engagements e ON to2.tenant_id = e.tenant_id
		JOIN tenants t ON e.tenant_id = t.id
		WHERE e.professional_id = $1 AND e.status = 'ACTIVE' AND to2.status = 'PENDING'
		ORDER BY to2.is_urgent DESC, to2.due_date ASC
		LIMIT 20
	`

	rows, err := db.Pool.Query(ctx, query, profID)
	if err != nil {
		http.Error(w, "Failed to query practice tasks: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type TaskItem struct {
		ID                  string  `json:"id"`
		TenantID            string  `json:"tenant_id"`
		ClientName          string  `json:"client_name"`
		Title               string  `json:"title"`
		Authority           string  `json:"authority"`
		DueDate             string  `json:"due_date"`
		Status              string  `json:"status"`
		IsUrgent            bool    `json:"is_urgent"`
		EstimatedPenaltyNGN float64 `json:"estimated_penalty_ngn"`
	}

	var tasks []TaskItem
	for rows.Next() {
		var t TaskItem
		if err := rows.Scan(
			&t.ID, &t.TenantID, &t.ClientName, &t.Title, &t.Authority,
			&t.DueDate, &t.Status, &t.IsUrgent, &t.EstimatedPenaltyNGN,
		); err == nil {
			tasks = append(tasks, t)
		}
	}

	if tasks == nil {
		tasks = []TaskItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func RevokeEngagement(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	engagementID := parts[3]

	// Immediate revocation
	_, err := db.Pool.Exec(r.Context(), `
		UPDATE engagements
		SET status = 'TERMINATED', updated_at = NOW()
		WHERE id = $1 AND tenant_id = $2
	`, engagementID, tenantCtx.TenantID)

	if err != nil {
		http.Error(w, "Revocation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Professional access revoked immediately across all tenant systems",
	})
}
