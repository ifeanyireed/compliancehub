package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/models"
)

func ListTickets(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	status := r.URL.Query().Get("status")
	category := r.URL.Query().Get("category")

	query := `SELECT id, subject, description, customer_name, customer_email, company_name, rc_number, category, priority, status, COALESCE(assigned_to, ''), created_at, updated_at
	          FROM support_tickets WHERE 1=1`
	var args []interface{}
	argIdx := 1

	if status != "" && status != "ALL" {
		query += fmt.Sprintf(` AND status = $%d`, argIdx)
		args = append(args, status)
		argIdx++
	}

	if category != "" && category != "ALL" {
		query += fmt.Sprintf(` AND category = $%d`, argIdx)
		args = append(args, category)
		argIdx++
	}

	query += ` ORDER BY updated_at DESC`

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tickets []models.SupportTicket
	for rows.Next() {
		var t models.SupportTicket
		if err := rows.Scan(
			&t.ID, &t.Subject, &t.Description, &t.CustomerName, &t.CustomerEmail,
			&t.CompanyName, &t.RCNumber, &t.Category, &t.Priority, &t.Status,
			&t.AssignedTo, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		tickets = append(tickets, t)
	}

	if tickets == nil {
		tickets = []models.SupportTicket{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tickets)
}

func GetTicket(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(r.URL.Path, "/")
	ticketID := parts[len(parts)-1]

	var t models.SupportTicket
	query := `SELECT id, subject, description, customer_name, customer_email, company_name, rc_number, category, priority, status, COALESCE(assigned_to, ''), created_at, updated_at
	          FROM support_tickets WHERE id = $1`

	err := db.Pool.QueryRow(ctx, query, ticketID).Scan(
		&t.ID, &t.Subject, &t.Description, &t.CustomerName, &t.CustomerEmail,
		&t.CompanyName, &t.RCNumber, &t.Category, &t.Priority, &t.Status,
		&t.AssignedTo, &t.CreatedAt, &t.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "Ticket not found", http.StatusNotFound)
		return
	}

	// Fetch replies
	repliesQuery := `SELECT id, ticket_id, sender_name, sender_role, message, created_at 
	                 FROM ticket_replies WHERE ticket_id = $1 ORDER BY created_at ASC`
	rows, err := db.Pool.Query(ctx, repliesQuery, ticketID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var rep models.TicketReply
			if err := rows.Scan(&rep.ID, &rep.TicketID, &rep.SenderName, &rep.SenderRole, &rep.Message, &rep.CreatedAt); err == nil {
				t.Replies = append(t.Replies, rep)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

func CreateTicket(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var t models.SupportTicket
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if t.ID == "" {
		t.ID = fmt.Sprintf("TICK-2026-%03d", rand.Intn(900)+100)
	}
	if t.Priority == "" {
		t.Priority = "MEDIUM"
	}
	if t.Status == "" {
		t.Status = "OPEN"
	}

	query := `INSERT INTO support_tickets (id, subject, description, customer_name, customer_email, company_name, rc_number, category, priority, status, assigned_to)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING created_at, updated_at`

	err := db.Pool.QueryRow(ctx, query,
		t.ID, t.Subject, t.Description, t.CustomerName, t.CustomerEmail,
		t.CompanyName, t.RCNumber, t.Category, t.Priority, t.Status, t.AssignedTo,
	).Scan(&t.CreatedAt, &t.UpdatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(t)
}

func ReplyTicket(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(r.URL.Path, "/")
	ticketID := ""
	for i, part := range parts {
		if part == "tickets" && i+1 < len(parts) {
			ticketID = parts[i+1]
			break
		}
	}

	var rep models.TicketReply
	if err := json.NewDecoder(r.Body).Decode(&rep); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	rep.TicketID = ticketID
	if rep.SenderRole == "" {
		rep.SenderRole = "STAFF"
	}

	query := `INSERT INTO ticket_replies (ticket_id, sender_name, sender_role, message)
	          VALUES ($1, $2, $3, $4) RETURNING id, created_at`

	err := db.Pool.QueryRow(ctx, query, rep.TicketID, rep.SenderName, rep.SenderRole, rep.Message).
		Scan(&rep.ID, &rep.CreatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update ticket timestamp
	db.Pool.Exec(ctx, "UPDATE support_tickets SET updated_at = NOW() WHERE id = $1", ticketID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rep)
}

func UpdateTicketStatus(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(r.URL.Path, "/")
	ticketID := parts[len(parts)-1]

	var payload struct {
		Status     string `json:"status"`
		Priority   string `json:"priority"`
		AssignedTo string `json:"assigned_to"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	query := `UPDATE support_tickets SET 
	          status = COALESCE(NULLIF($1, ''), status),
	          priority = COALESCE(NULLIF($2, ''), priority),
	          assigned_to = COALESCE(NULLIF($3, ''), assigned_to),
	          updated_at = NOW()
	          WHERE id = $4 RETURNING id, status, priority, assigned_to, updated_at`

	var t models.SupportTicket
	err := db.Pool.QueryRow(ctx, query, payload.Status, payload.Priority, payload.AssignedTo, ticketID).
		Scan(&t.ID, &t.Status, &t.Priority, &t.AssignedTo, &t.UpdatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

func ListKnowledgeArticles(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := db.Pool.Query(ctx, "SELECT id, title, slug, category, excerpt, content, views, updated_at FROM knowledge_articles ORDER BY views DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var articles []models.KnowledgeArticle
	for rows.Next() {
		var a models.KnowledgeArticle
		if err := rows.Scan(&a.ID, &a.Title, &a.Slug, &a.Category, &a.Excerpt, &a.Content, &a.Views, &a.UpdatedAt); err == nil {
			articles = append(articles, a)
		}
	}

	if articles == nil {
		articles = []models.KnowledgeArticle{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(articles)
}
