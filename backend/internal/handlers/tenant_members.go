package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
	"golang.org/x/crypto/bcrypt"
)

type TenantMemberItem struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	UserID    string    `json:"user_id"`
	Role      string    `json:"role"`
	IsPrimary bool      `json:"is_primary"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Phone     *string   `json:"phone,omitempty"`
	Title     *string   `json:"title,omitempty"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type InviteTenantMemberRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Title    string `json:"title,omitempty"`
}

func ListTenantMembers(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant context required", http.StatusBadRequest)
		return
	}

	query := `
		SELECT tm.id, tm.tenant_id, tm.user_id, tm.role, tm.is_primary,
		       u.full_name, u.email, u.phone, u.title, u.avatar_url, tm.created_at
		FROM tenant_members tm
		JOIN users u ON tm.user_id = u.id
		WHERE tm.tenant_id = $1
		ORDER BY tm.is_primary DESC, tm.created_at ASC
	`

	rows, err := db.Pool.Query(r.Context(), query, tenantCtx.TenantID)
	if err != nil {
		http.Error(w, "Failed to query tenant members: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var members []TenantMemberItem
	for rows.Next() {
		var m TenantMemberItem
		if err := rows.Scan(
			&m.ID, &m.TenantID, &m.UserID, &m.Role, &m.IsPrimary,
			&m.FullName, &m.Email, &m.Phone, &m.Title, &m.AvatarURL, &m.CreatedAt,
		); err == nil {
			members = append(members, m)
		}
	}

	if members == nil {
		members = []TenantMemberItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(members)
}

func InviteTenantMember(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant context required", http.StatusBadRequest)
		return
	}

	var req InviteTenantMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.FullName == "" {
		http.Error(w, "Full name and email are required", http.StatusBadRequest)
		return
	}

	role := req.Role
	if role == "" {
		role = "MEMBER"
	}

	ctx := r.Context()

	// Check if user exists or create user
	var userID string
	err := db.Pool.QueryRow(ctx, "SELECT id FROM users WHERE email = $1", req.Email).Scan(&userID)
	if err != nil {
		// Create user with default secure hashed password
		hashed, _ := bcrypt.GenerateFromPassword([]byte("Nigeria2026!Secure"), bcrypt.DefaultCost)
		title := req.Title
		if title == "" {
			title = "Compliance Officer"
		}
		avatar := "/character1.jpg"

		insertUserSQL := `
			INSERT INTO users (email, password_hash, full_name, title, avatar_url, system_role, is_email_verified)
			VALUES ($1, $2, $3, $4, $5, 'USER', true)
			RETURNING id
		`
		err = db.Pool.QueryRow(ctx, insertUserSQL, req.Email, string(hashed), req.FullName, title, avatar).Scan(&userID)
		if err != nil {
			http.Error(w, "Failed to create user record: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// Insert into tenant_members
	var memberID string
	insertMemberSQL := `
		INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
		VALUES ($1, $2, $3, false)
		ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role
		RETURNING id
	`
	err = db.Pool.QueryRow(ctx, insertMemberSQL, tenantCtx.TenantID, userID, role).Scan(&memberID)
	if err != nil {
		http.Error(w, "Failed to link user to tenant: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Also log activity
	_, _ = db.Pool.Exec(ctx, `
		INSERT INTO activity_logs (tenant_id, actor_name, actor_role, action_type, details)
		VALUES ($1, 'Workspace Admin', 'Owner', 'MEMBER_INVITE', $2)
	`, tenantCtx.TenantID, "Invited team member "+req.FullName+" ("+req.Email+") with role "+role)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"member_id": memberID,
		"user_id":   userID,
		"email":     req.Email,
		"role":      role,
	})
}
