package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserContextKey   contextKey = "user_context"
	TenantContextKey contextKey = "tenant_context"
)

type Claims struct {
	UserID     string `json:"user_id"`
	Email      string `json:"email"`
	FullName   string `json:"full_name"`
	SystemRole string `json:"system_role"`
	TenantID   string `json:"tenant_id,omitempty"`
	jwt.RegisteredClaims
}

type TenantContext struct {
	TenantID     string
	Role         string // OWNER, ADMIN, MEMBER, DELEGATED_EXPERT, SYSTEM_ADMIN, COMPLIANCE_LEAD, VIEWER
	IsExternal   bool
	EngagementID *string
	Permissions  map[string]models.EngagementPermission
}

// CanManageWorkspace checks if the user has administrative governance authority over the workspace
func (tc *TenantContext) CanManageWorkspace() bool {
	if tc == nil {
		return false
	}
	role := strings.ToUpper(tc.Role)
	return role == "SYSTEM_ADMIN" || role == "OWNER" || role == "ADMIN"
}

// CanManageWorkforce checks if the user has authority to register employees and vendor compliance records
func (tc *TenantContext) CanManageWorkforce() bool {
	if tc == nil {
		return false
	}
	role := strings.ToUpper(tc.Role)
	return role == "SYSTEM_ADMIN" || role == "OWNER" || role == "ADMIN" || role == "COMPLIANCE_LEAD" || tc.IsExternal
}

// CanDeleteResource checks if the user has permission to delete regulatory documents or records
func (tc *TenantContext) CanDeleteResource() bool {
	if tc == nil {
		return false
	}
	role := strings.ToUpper(tc.Role)
	return role == "SYSTEM_ADMIN" || role == "OWNER" || role == "ADMIN"
}

// CanUploadEvidence checks if the user has permission to upload regulatory evidence
func (tc *TenantContext) CanUploadEvidence(moduleCode string) bool {
	if tc == nil {
		return false
	}
	role := strings.ToUpper(tc.Role)
	if role == "SYSTEM_ADMIN" || role == "OWNER" || role == "ADMIN" || role == "COMPLIANCE_LEAD" || role == "MEMBER" {
		return true
	}
	if role == "VIEWER" {
		return false
	}
	if tc.IsExternal {
		if tc.Permissions == nil || len(tc.Permissions) == 0 {
			return true // default permissive for demo seeds if permissions not yet granularly configured
		}
		if perm, ok := tc.Permissions[strings.ToLower(moduleCode)]; ok {
			return perm.CanUpload
		}
		return true
	}
	return false
}

// CanApproveFiling checks if the user has authority to complete or sign off on statutory filings
func (tc *TenantContext) CanApproveFiling(moduleCode string) bool {
	if tc == nil {
		return false
	}
	role := strings.ToUpper(tc.Role)
	if role == "SYSTEM_ADMIN" || role == "OWNER" || role == "ADMIN" || role == "COMPLIANCE_LEAD" {
		return true
	}
	if role == "VIEWER" || role == "MEMBER" {
		return false
	}
	if tc.IsExternal {
		if tc.Permissions == nil || len(tc.Permissions) == 0 {
			return true
		}
		if perm, ok := tc.Permissions[strings.ToLower(moduleCode)]; ok {
			return perm.CanApprove
		}
		return true
	}
	return false
}

// CanExport checks if the user has authorization to export audit logs or regulatory report summaries
func (tc *TenantContext) CanExport(moduleCode string) bool {
	if tc == nil {
		return false
	}
	role := strings.ToUpper(tc.Role)
	if role == "SYSTEM_ADMIN" || role == "OWNER" || role == "ADMIN" || role == "COMPLIANCE_LEAD" {
		return true
	}
	if tc.IsExternal {
		if tc.Permissions == nil || len(tc.Permissions) == 0 {
			return true
		}
		if perm, ok := tc.Permissions[strings.ToLower(moduleCode)]; ok {
			return perm.CanExport
		}
		return true
	}
	return false
}

func isProduction() bool {
	env := strings.ToLower(os.Getenv("APP_ENV"))
	if env == "" {
		env = strings.ToLower(os.Getenv("ENV"))
	}
	return env == "production" || env == "prod"
}

func getTokenTTL() time.Duration {
	ttlHoursStr := os.Getenv("TOKEN_TTL_HOURS")
	if ttlHoursStr != "" {
		if hours, err := strconv.Atoi(ttlHoursStr); err == nil && hours > 0 {
			return time.Duration(hours) * time.Hour
		}
	}
	return 72 * time.Hour // 3 days default in production
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "compliancehub_default_secret_change_me_in_production"
	}
	return []byte(secret)
}

func GenerateToken(user models.User, defaultTenantID string) (string, error) {
	expirationTime := time.Now().Add(getTokenTTL())
	claims := &Claims{
		UserID:     user.ID,
		Email:      user.Email,
		FullName:   user.FullName,
		SystemRole: user.SystemRole,
		TenantID:   defaultTenantID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "compliancehub.ng",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}

	if claims.Issuer != "compliancehub.ng" {
		return nil, errors.New("invalid token issuer")
	}

	if claims.UserID == "" {
		return nil, errors.New("invalid token user payload")
	}

	return claims, nil
}

// RequireAuth ensures a valid JWT bearer token is present
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			// Check demo token bypass for frontend preview ONLY in non-production
			if !isProduction() {
				demoRole := r.Header.Get("X-Demo-Role")
				if demoRole != "" {
					user := getDemoUser(demoRole)
					if user != nil {
						ctx := context.WithValue(r.Context(), UserContextKey, user)
						next(w, r.WithContext(ctx))
						return
					}
				}
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Authorization header required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid Authorization header format"})
			return
		}

		tokenStr := parts[1]

		// Support demo tokens for instant client-side testing ONLY in non-production
		if !isProduction() && strings.HasPrefix(tokenStr, "demo-token-") {
			role := strings.ToUpper(strings.TrimPrefix(tokenStr, "demo-token-"))
			user := getDemoUser(role)
			if user != nil {
				ctx := context.WithValue(r.Context(), UserContextKey, user)
				next(w, r.WithContext(ctx))
				return
			}
		}

		claims, err := ValidateToken(tokenStr)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Token is invalid or expired"})
			return
		}

		user := &models.User{
			ID:         claims.UserID,
			Email:      claims.Email,
			FullName:   claims.FullName,
			SystemRole: claims.SystemRole,
		}

		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next(w, r.WithContext(ctx))
	}
}

// RequireSystemRole ensures the user is authenticated and possesses one of the allowed global system roles (e.g., ADMIN, STAFF)
func RequireSystemRole(allowedRoles ...string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			user := GetUserFromContext(r)
			if user == nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized: Authentication required"})
				return
			}

			userRole := strings.ToUpper(user.SystemRole)
			for _, allowed := range allowedRoles {
				if userRole == strings.ToUpper(allowed) {
					next(w, r)
					return
				}
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{
				"error": fmt.Sprintf("Forbidden: This action requires one of the following system roles: %s", strings.Join(allowedRoles, ", ")),
			})
		})
	}
}

// RequireTenant resolves the requested tenant and ensures the user is authorized
func RequireTenant(next http.HandlerFunc) http.HandlerFunc {
	return RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		user := GetUserFromContext(r)
		if user == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		tenantID := r.Header.Get("X-Tenant-ID")
		if tenantID == "" {
			tenantID = r.URL.Query().Get("tenant_id")
		}

		// If no tenant is explicitly specified, use the default seeded PayWave workspace for seamless usability
		if tenantID == "" {
			tenantID = "55555555-5555-5555-5555-555555555501"
		}

		// Super admin has universal access
		if user.SystemRole == "ADMIN" || user.SystemRole == "STAFF" {
			tenantCtx := &TenantContext{
				TenantID:   tenantID,
				Role:       "SYSTEM_ADMIN",
				IsExternal: false,
			}
			ctx := context.WithValue(r.Context(), TenantContextKey, tenantCtx)
			next(w, r.WithContext(ctx))
			return
		}

		// 1. Check direct tenant membership
		var role string
		err := db.Pool.QueryRow(r.Context(), `
			SELECT role FROM tenant_members 
			WHERE tenant_id = $1 AND user_id = $2
		`, tenantID, user.ID).Scan(&role)

		if err == nil {
			tenantCtx := &TenantContext{
				TenantID:   tenantID,
				Role:       role,
				IsExternal: false,
			}
			ctx := context.WithValue(r.Context(), TenantContextKey, tenantCtx)
			next(w, r.WithContext(ctx))
			return
		}

		// 2. Check delegated professional engagement
		var engagementID string
		err = db.Pool.QueryRow(r.Context(), `
			SELECT e.id FROM engagements e
			JOIN professional_profiles p ON e.professional_id = p.id
			WHERE e.tenant_id = $1 AND p.user_id = $2 AND e.status = 'ACTIVE'
		`, tenantID, user.ID).Scan(&engagementID)

		if err == nil {
			permissions := make(map[string]models.EngagementPermission)
			permRows, pErr := db.Pool.Query(r.Context(), `
				SELECT id, engagement_id, module_code, can_view, can_upload, can_approve, can_export
				FROM engagement_permissions
				WHERE engagement_id = $1
			`, engagementID)
			if pErr == nil {
				defer permRows.Close()
				for permRows.Next() {
					var p models.EngagementPermission
					if err := permRows.Scan(&p.ID, &p.EngagementID, &p.ModuleCode, &p.CanView, &p.CanUpload, &p.CanApprove, &p.CanExport); err == nil {
						permissions[strings.ToLower(p.ModuleCode)] = p
					}
				}
			}

			tenantCtx := &TenantContext{
				TenantID:     tenantID,
				Role:         "DELEGATED_EXPERT",
				IsExternal:   true,
				EngagementID: &engagementID,
				Permissions:  permissions,
			}
			ctx := context.WithValue(r.Context(), TenantContextKey, tenantCtx)
			next(w, r.WithContext(ctx))
			return
		}

		// Allow demo users access to seeded PayWave workspace ONLY in non-production preview mode
		if !isProduction() && tenantID == "55555555-5555-5555-5555-555555555501" {
			tenantCtx := &TenantContext{
				TenantID:   tenantID,
				Role:       "OWNER",
				IsExternal: false,
			}
			ctx := context.WithValue(r.Context(), TenantContextKey, tenantCtx)
			next(w, r.WithContext(ctx))
			return
		}

		// Access denied
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Access to tenant workspace denied or revoked",
		})
	})
}

func GetUserFromContext(r *http.Request) *models.User {
	if val := r.Context().Value(UserContextKey); val != nil {
		if user, ok := val.(*models.User); ok {
			return user
		}
	}
	return nil
}

func GetTenantContext(r *http.Request) *TenantContext {
	if val := r.Context().Value(TenantContextKey); val != nil {
		if tc, ok := val.(*TenantContext); ok {
			return tc
		}
	}
	return nil
}

func getDemoUser(role string) *models.User {
	switch strings.ToUpper(role) {
	case "BUSINESS":
		return &models.User{
			ID:         "33333333-3333-3333-3333-333333333301",
			Email:      "adaeze@paywave.ng",
			FullName:   "Adaeze Nwosu",
			Title:      "Managing Director",
			SystemRole: "USER",
		}
	case "EXPERT":
		return &models.User{
			ID:         "33333333-3333-3333-3333-333333333302",
			Email:      "tunde@bakarecompliance.com",
			FullName:   "Tunde Bakare, CAMS",
			Title:      "Senior AML & Regulatory Officer",
			SystemRole: "USER",
		}
	case "AGENCY":
		return &models.User{
			ID:         "33333333-3333-3333-3333-333333333303",
			Email:      "chiamaka@apexcompliance.ng",
			FullName:   "Chiamaka Eze",
			Title:      "Principal Partner",
			SystemRole: "USER",
		}
	case "STAFF":
		return &models.User{
			ID:         "33333333-3333-3333-3333-333333333304",
			Email:      "bsanwo@compliancehub.ng",
			FullName:   "Babajide Sanwo",
			Title:      "Senior Compliance Support Specialist",
			SystemRole: "STAFF",
		}
	case "ADMIN":
		return &models.User{
			ID:         "33333333-3333-3333-3333-333333333305",
			Email:      "admin@compliancehub.ng",
			FullName:   "Dr. Olumide Adeleke",
			Title:      "Super Administrator",
			SystemRole: "ADMIN",
		}
	default:
		return nil
	}
}
