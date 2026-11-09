package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

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
		SELECT e.id, e.tenant_id, t.workspace_name, COALESCE(o.rc_number, 'RC-PENDING'), COALESCE(o.industry, 'General Commerce'),
		       t.compliance_score, e.engagement_type, e.scope_summary, e.monthly_fee_ngn,
		       e.status, TO_CHAR(e.start_date, 'YYYY-MM-DD'),
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

type TenantEngagementItem struct {
	ID               string   `json:"id"`
	TenantID         string   `json:"tenant_id"`
	ProfessionalID   string   `json:"professional_id"`
	EngagementType   string   `json:"engagement_type"`
	ScopeSummary     string   `json:"scope_summary"`
	MonthlyFeeNGN    float64  `json:"monthly_fee_ngn"`
	StartDate        string   `json:"start_date"`
	EndDate          *string  `json:"end_date"`
	Status           string   `json:"status"`
	ProfessionalName string   `json:"professional_name"`
	AvatarURL        string   `json:"avatar_url"`
	FirmName         string   `json:"firm_name"`
	Qualification    string   `json:"qualification"`
	Specialisations  []string `json:"specialisations"`
}

func ListTenantEngagements(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	query := `
		SELECT e.id, e.tenant_id, e.professional_id, e.engagement_type,
		       e.scope_summary, e.monthly_fee_ngn, TO_CHAR(e.start_date, 'YYYY-MM-DD'),
		       TO_CHAR(e.end_date, 'YYYY-MM-DD'), e.status,
		       u.full_name, COALESCE(u.avatar_url, '/character1.jpg'),
		       COALESCE(p.firm_name, 'Independent Advisory'), COALESCE(p.qualification, 'CAMS'),
		       p.specialisations
		FROM engagements e
		JOIN professional_profiles p ON e.professional_id = p.id
		JOIN users u ON p.user_id = u.id
		WHERE e.tenant_id = $1
		ORDER BY e.created_at DESC
	`

	rows, err := db.Pool.Query(r.Context(), query, tenantCtx.TenantID)
	if err != nil {
		http.Error(w, "Failed to query engagements: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var engagements []TenantEngagementItem
	for rows.Next() {
		var item TenantEngagementItem
		if err := rows.Scan(
			&item.ID, &item.TenantID, &item.ProfessionalID, &item.EngagementType,
			&item.ScopeSummary, &item.MonthlyFeeNGN, &item.StartDate,
			&item.EndDate, &item.Status,
			&item.ProfessionalName, &item.AvatarURL,
			&item.FirmName, &item.Qualification,
			&item.Specialisations,
		); err == nil {
			engagements = append(engagements, item)
		}
	}

	if engagements == nil {
		engagements = []TenantEngagementItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(engagements)
}

func RevokeEngagement(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	if !tenantCtx.CanManageWorkspace() {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Forbidden: Only workspace owners and administrators can terminate professional engagements",
		})
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

	// Audit trail log
	user := middleware.GetUserFromContext(r)
	actorName := "Administrator"
	var actorID *string
	if user != nil {
		actorName = user.FullName
		actorID = &user.ID
	}
	_, _ = db.Pool.Exec(r.Context(), `
		INSERT INTO activity_logs (tenant_id, user_id, actor_name, actor_role, action_type, details)
		VALUES ($1, $2, $3, $4, 'REVOKE_ENGAGEMENT', $5)
	`, tenantCtx.TenantID, actorID, actorName, tenantCtx.Role, "Terminated delegated compliance officer engagement: "+engagementID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Professional access revoked immediately across all tenant systems",
	})
}

type AgencyTeamMember struct {
	ID                   string `json:"id"`
	Name                 string `json:"name"`
	Avatar               string `json:"avatar"`
	Role                 string `json:"role"`
	AssignedClientsCount int    `json:"assigned_clients_count"`
	Speciality           string `json:"speciality"`
	Utilisation          string `json:"utilisation"`
}

func ListAgencyTeam(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	query := `
		SELECT p.id, u.full_name, COALESCE(u.avatar_url, '/character1.jpg'),
		       COALESCE(p.firm_name, 'Senior Compliance Officer'),
		       p.active_clients_count,
		       COALESCE(p.qualification, 'Regulatory Specialist'),
		       p.specialisations
		FROM professional_profiles p
		JOIN users u ON p.user_id = u.id
		WHERE p.verification_status = 'VERIFIED'
		ORDER BY p.active_clients_count DESC
	`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		http.Error(w, "Failed to query agency team: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var team []AgencyTeamMember
	for rows.Next() {
		var id, name, avatar, role, qual string
		var count int
		var specs []string
		if err := rows.Scan(&id, &name, &avatar, &role, &count, &qual, &specs); err == nil {
			specStr := qual
			if len(specs) > 0 {
				specStr = specs[0]
			}
			util := fmt.Sprintf("%d%%", 65+(count*6)%35)
			team = append(team, AgencyTeamMember{
				ID:                   id,
				Name:                 name,
				Avatar:               avatar,
				Role:                 role,
				AssignedClientsCount: count,
				Speciality:           specStr,
				Utilisation:          util,
			})
		}
	}
	if team == nil {
		team = []AgencyTeamMember{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(team)
}

func UpdatePracticeTask(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	taskID := parts[3]

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.Status == "" {
		req.Status = "FILED"
	}

	_, err := db.Pool.Exec(r.Context(), `
		UPDATE tenant_obligations
		SET status = $1, is_urgent = false, updated_at = NOW()
		WHERE id = $2
	`, req.Status, taskID)

	if err != nil {
		http.Error(w, "Failed to update task: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Task updated successfully",
	})
}

type CreatePracticeTaskRequest struct {
	TenantID   string `json:"tenant_id"`
	Title      string `json:"title"`
	Authority  string `json:"authority"`
	DueDate    string `json:"due_date"`
	IsUrgent   bool   `json:"is_urgent"`
}

func CreatePracticeTask(w http.ResponseWriter, r *http.Request) {
	var req CreatePracticeTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.TenantID == "" || req.Title == "" {
		http.Error(w, "Tenant ID and Task Title are required", http.StatusBadRequest)
		return
	}

	auth := req.Authority
	if auth == "" {
		auth = "Statutory Filing"
	}
	dueDate := req.DueDate
	if dueDate == "" {
		dueDate = time.Now().AddDate(0, 1, 0).Format("2006-01-02")
	}

	var taskID string
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, is_urgent, estimated_penalty_ngn)
		VALUES ($1, $2, $3, $4::date, 'PENDING', $5, 50000.00)
		RETURNING id
	`, req.TenantID, req.Title, auth, dueDate, req.IsUrgent).Scan(&taskID)

	if err != nil {
		http.Error(w, "Failed to create practice task: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Log activity
	_, _ = db.Pool.Exec(r.Context(), `
		INSERT INTO activity_logs (tenant_id, actor_name, actor_role, action_type, details)
		VALUES ($1, 'Apex Advisory Partner', 'Practice Lead', 'TASK_LODGED', $2)
	`, req.TenantID, "LODGED TASK: "+req.Title+" ("+auth+")")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      taskID,
		"success": true,
		"message": "Task lodged in client workspace",
	})
}

type AddAgencyTeamMemberRequest struct {
	FullName       string  `json:"full_name"`
	Email          string  `json:"email"`
	Role           string  `json:"role"`
	Specialisation string  `json:"specialisation"`
	HourlyRate     float64 `json:"hourly_rate"`
}

func AddAgencyTeamMember(w http.ResponseWriter, r *http.Request) {
	var req AddAgencyTeamMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.FullName == "" || req.Email == "" {
		http.Error(w, "Full name and email are required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	var userID string
	err := db.Pool.QueryRow(ctx, "SELECT id FROM users WHERE email = $1", req.Email).Scan(&userID)
	if err != nil {
		hashed, _ := bcrypt.GenerateFromPassword([]byte("Nigeria2026!Secure"), bcrypt.DefaultCost)
		title := req.Role
		if title == "" {
			title = "Compliance Associate"
		}

		err = db.Pool.QueryRow(ctx, `
			INSERT INTO users (email, password_hash, full_name, title, avatar_url, system_role, is_email_verified)
			VALUES ($1, $2, $3, $4, '/character2.jpg', 'EXPERT', true)
			RETURNING id
		`, req.Email, string(hashed), req.FullName, title).Scan(&userID)

		if err != nil {
			http.Error(w, "Failed creating user: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	spec := req.Specialisation
	if spec == "" {
		spec = "CAMA 2020 & NDPA 2023"
	}
	rate := req.HourlyRate
	if rate <= 0 {
		rate = 25000.00
	}

	var profID string
	err = db.Pool.QueryRow(ctx, `
		INSERT INTO professional_profiles (user_id, firm_name, qualification, years_experience, specialisations, hourly_rate_ngn, monthly_retainer_ngn, bio, verification_status, active_clients_count)
		VALUES ($1, 'Apex Compliance Advisory Partners Ltd', 'BL, CDPO', 5, ARRAY[$2], $3, 200000.00, 'Associate Compliance Practitioner at Apex Advisory', 'VERIFIED', 2)
		ON CONFLICT (user_id) DO UPDATE SET specialisations = ARRAY[$2]
		RETURNING id
	`, userID, spec, rate).Scan(&profID)

	if err != nil {
		http.Error(w, "Failed adding to practice team: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":         true,
		"user_id":         userID,
		"professional_id": profID,
		"message":         "Associate onboarded to Apex Advisory Agency",
	})
}

type CreateClientWorkspaceRequest struct {
	LegalName    string  `json:"legal_name"`
	RCNumber     string  `json:"rc_number"`
	Industry     string  `json:"industry"`
	ContactEmail string  `json:"contact_email"`
	MonthlyFee   float64 `json:"monthly_fee"`
}

func CreateClientWorkspace(w http.ResponseWriter, r *http.Request) {
	var req CreateClientWorkspaceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.LegalName == "" {
		http.Error(w, "Legal business name is required", http.StatusBadRequest)
		return
	}

	rc := req.RCNumber
	if rc == "" {
		rc = fmt.Sprintf("RC-%d", time.Now().Unix()%1000000+1000000)
	}
	industry := req.Industry
	if industry == "" {
		industry = "Financial Services"
	}
	fee := req.MonthlyFee
	if fee <= 0 {
		fee = 250000.00
	}

	ctx := r.Context()

	// 1. Create organisation
	var orgID string
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO organisations (legal_name, trade_name, rc_number, org_type, industry, state_of_operation, employee_bracket)
		VALUES ($1, $1, $2, 'BUSINESS', $3, 'Lagos State', '51-200')
		RETURNING id
	`, req.LegalName, rc, industry).Scan(&orgID)

	if err != nil {
		http.Error(w, "Failed to create organisation: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 2. Create tenant
	slug := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(req.LegalName, " ", "-"), ".", "")) + fmt.Sprintf("-%d", time.Now().Unix()%1000)
	var tenantID string
	err = db.Pool.QueryRow(ctx, `
		INSERT INTO tenants (organisation_id, workspace_name, slug, plan_tier, compliance_score, is_active)
		VALUES ($1, $2, $3, 'Professional', 75, true)
		RETURNING id
	`, orgID, req.LegalName, slug).Scan(&tenantID)

	if err != nil {
		http.Error(w, "Failed to create workspace tenant: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 3. Create engagement linking Apex Advisory
	var profID string
	_ = db.Pool.QueryRow(ctx, "SELECT id FROM professional_profiles WHERE user_id = '33333333-3333-3333-3333-333333333303'").Scan(&profID)
	if profID == "" {
		profID = "66666666-6666-6666-6666-666666666602"
	}

	_, _ = db.Pool.Exec(ctx, `
		INSERT INTO engagements (tenant_id, professional_id, engagement_type, scope_summary, monthly_fee_ngn, start_date, status)
		VALUES ($1, $2, 'FULL_RETAINER', 'Comprehensive statutory compliance oversight across CAMA 2020, NDPA 2023, and FIRS TaxPro-MAX.', $3, CURRENT_DATE, 'ACTIVE')
	`, tenantID, profID, fee)

	// 4. Seed initial default obligations
	_, _ = db.Pool.Exec(ctx, `
		INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, is_urgent, estimated_penalty_ngn)
		VALUES
		($1, 'CAMA 2020 Annual Returns Filing (Form CAC 19)', 'CAC', CURRENT_DATE + INTERVAL '60 days', 'PENDING', false, 150000.00),
		($1, 'Monthly VAT & WHT Remittance (TaxPro-MAX)', 'FIRS', CURRENT_DATE + INTERVAL '12 days', 'PENDING', true, 50000.00),
		($1, 'NDPA 2023 Statutory Audit Return Lodgment', 'NDPC', CURRENT_DATE + INTERVAL '90 days', 'PENDING', false, 500000.00)
	`, tenantID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"tenant_id":  tenantID,
		"org_id":     orgID,
		"client_name": req.LegalName,
		"message":    "Client workspace created and engagement linked successfully",
	})
}
