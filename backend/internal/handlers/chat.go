package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/models"
)

func ListChatSessions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := db.Pool.Query(ctx, `SELECT id, visitor_name, visitor_email, COALESCE(visitor_company, ''), status, COALESCE(assigned_staff, ''), COALESCE(last_message, ''), created_at, updated_at 
	                                 FROM chat_sessions ORDER BY updated_at DESC`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var sessions []models.ChatSession
	for rows.Next() {
		var s models.ChatSession
		if err := rows.Scan(
			&s.ID, &s.VisitorName, &s.VisitorEmail, &s.VisitorCompany,
			&s.Status, &s.AssignedStaff, &s.LastMessage, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sessions = append(sessions, s)
	}

	if sessions == nil {
		sessions = []models.ChatSession{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

func CreateChatSession(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var s models.ChatSession
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if s.VisitorName == "" && s.UserName != "" {
		s.VisitorName = s.UserName
	}
	if s.VisitorEmail == "" && s.UserEmail != "" {
		s.VisitorEmail = s.UserEmail
	}
	if s.VisitorCompany == "" && s.UserCompany != "" {
		s.VisitorCompany = s.UserCompany
	}

	if s.ID == "" {
		s.ID = fmt.Sprintf("CHAT-%04d", rand.Intn(9000)+1000)
	}
	if s.Status == "" {
		s.Status = "ACTIVE"
	}
	if s.AssignedStaff == "" {
		s.AssignedStaff = "Tunde Bakare, CAMS"
	}

	query := `INSERT INTO chat_sessions (id, visitor_name, visitor_email, visitor_company, status, assigned_staff, last_message)
	          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING created_at, updated_at`

	err := db.Pool.QueryRow(ctx, query, s.ID, s.VisitorName, s.VisitorEmail, s.VisitorCompany, s.Status, s.AssignedStaff, s.LastMessage).
		Scan(&s.CreatedAt, &s.UpdatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Insert initial automated welcome message
	welcomeMsg := fmt.Sprintf("Hello %s! Welcome to ComplianceHub live support. How can we assist with your CAC, TaxPro-MAX, or NDPA compliance today?", s.VisitorName)
	db.Pool.Exec(ctx, `INSERT INTO chat_messages (session_id, sender, sender_name, text) VALUES ($1, $2, $3, $4)`,
		s.ID, "staff", s.AssignedStaff, welcomeMsg)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

func GetChatMessages(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		http.Error(w, "session_id is required", http.StatusBadRequest)
		return
	}

	rows, err := db.Pool.Query(ctx, `SELECT id, session_id, sender, sender_name, text, created_at 
	                                 FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`, sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []models.ChatMessage
	for rows.Next() {
		var m models.ChatMessage
		if err := rows.Scan(&m.ID, &m.SessionID, &m.Sender, &m.SenderName, &m.Text, &m.CreatedAt); err == nil {
			messages = append(messages, m)
		}
	}

	if messages == nil {
		messages = []models.ChatMessage{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func SendMessage(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var m models.ChatMessage
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if m.Text == "" && m.Message != "" {
		m.Text = m.Message
	}

	query := `INSERT INTO chat_messages (session_id, sender, sender_name, text)
	          VALUES ($1, $2, $3, $4) RETURNING id, created_at`

	err := db.Pool.QueryRow(ctx, query, m.SessionID, m.Sender, m.SenderName, m.Text).
		Scan(&m.ID, &m.CreatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update last_message and timestamp on session
	db.Pool.Exec(ctx, `UPDATE chat_sessions SET last_message = $1, updated_at = NOW() WHERE id = $2`, m.Text, m.SessionID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(m)
}
