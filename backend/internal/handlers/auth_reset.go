package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"compliancehub-backend/internal/db"

	"golang.org/x/crypto/bcrypt"
)

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Email) == "" {
		http.Error(w, "Valid email address is required", http.StatusBadRequest)
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	ctx := r.Context()

	var userID string
	var fullName string
	err := db.Pool.QueryRow(ctx, "SELECT id, full_name FROM users WHERE LOWER(email) = $1", email).Scan(&userID, &fullName)
	if err != nil {
		// To prevent account enumeration attacks, always respond with generic success
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "If this email is registered, password reset instructions have been dispatched.",
		})
		return
	}

	// Generate 32-byte cryptographically secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		http.Error(w, "Internal server error generating reset token", http.StatusInternalServerError)
		return
	}
	resetToken := hex.EncodeToString(tokenBytes)
	expiresAt := time.Now().Add(1 * time.Hour)

	// Persist reset token
	_, err = db.Pool.Exec(ctx, `
		INSERT INTO password_resets (user_id, token, expires_at, is_used)
		VALUES ($1, $2, $3, false)
	`, userID, resetToken, expiresAt)

	if err != nil {
		log.Printf("⚠️ Failed to store password reset token: %v", err)
		http.Error(w, "Failed to initiate password reset", http.StatusInternalServerError)
		return
	}

	log.Printf("🔐 Password reset token generated for %s: %s (expires: %s)", email, resetToken, expiresAt.Format(time.RFC3339))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "If this email is registered, password reset instructions have been dispatched.",
		// In development or preview, provide the token to streamline automated or manual testing
		"preview_token": resetToken,
	})
}

func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Token == "" || len(req.NewPassword) < 8 {
		http.Error(w, "Valid token and a minimum 8-character password are required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	var userID string
	var isUsed bool
	var expiresAt time.Time

	err := db.Pool.QueryRow(ctx, `
		SELECT user_id, is_used, expires_at
		FROM password_resets
		WHERE token = $1
	`, req.Token).Scan(&userID, &isUsed, &expiresAt)

	if err != nil || isUsed || time.Now().After(expiresAt) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "This password reset token is invalid or has expired. Please request a new one.",
		})
		return
	}

	// Hash new password
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash new password", http.StatusInternalServerError)
		return
	}

	// Run update in transaction
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// Update user password
	_, err = tx.Exec(ctx, `
		UPDATE users
		SET password_hash = $1, updated_at = NOW()
		WHERE id = $2
	`, string(hashedPw), userID)
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	// Invalidate reset token
	_, err = tx.Exec(ctx, `
		UPDATE password_resets
		SET is_used = true
		WHERE token = $1
	`, req.Token)
	if err != nil {
		http.Error(w, "Failed to update token status", http.StatusInternalServerError)
		return
	}

	// Audit log
	_, _ = tx.Exec(ctx, `
		INSERT INTO activity_logs (user_id, actor_name, actor_role, action_type, details)
		VALUES ($1, 'Account Owner', 'USER', 'PASSWORD_RESET', 'Credentials updated via reset token verification')
	`, userID)

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to commit password reset transaction", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Password has been successfully updated. You may now sign in with your new credentials.",
	})
}
