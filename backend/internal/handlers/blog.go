package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/models"
)

func ListBlogPosts(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	category := r.URL.Query().Get("category")
	status := r.URL.Query().Get("status")

	query := `SELECT id, title, slug, excerpt, content, author_name, author_role, author_avatar, category, tags, read_time, status, cover_image, published_at, created_at 
	          FROM blog_posts WHERE 1=1`
	var args []interface{}
	argIdx := 1

	if category != "" && category != "All" {
		query += ` AND category = $` + string(rune('0'+argIdx))
		args = append(args, category)
		argIdx++
	}

	if status != "" {
		query += ` AND status = $` + string(rune('0'+argIdx))
		args = append(args, status)
		argIdx++
	} else if !strings.Contains(r.URL.Path, "/admin/") {
		query += ` AND status = 'PUBLISHED'`
	}

	query += ` ORDER BY published_at DESC`

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []models.BlogPost
	for rows.Next() {
		var p models.BlogPost
		if err := rows.Scan(
			&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content,
			&p.AuthorName, &p.AuthorRole, &p.AuthorAvatar, &p.Category,
			&p.Tags, &p.ReadTime, &p.Status, &p.CoverImage,
			&p.PublishedAt, &p.CreatedAt,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		posts = append(posts, p)
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func GetBlogPostBySlug(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Extract slug from URL path
	parts := strings.Split(r.URL.Path, "/")
	slug := parts[len(parts)-1]

	var p models.BlogPost
	query := `SELECT id, title, slug, excerpt, content, author_name, author_role, author_avatar, category, tags, read_time, status, cover_image, published_at, created_at 
	          FROM blog_posts WHERE slug = $1 LIMIT 1`

	err := db.Pool.QueryRow(ctx, query, slug).Scan(
		&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content,
		&p.AuthorName, &p.AuthorRole, &p.AuthorAvatar, &p.Category,
		&p.Tags, &p.ReadTime, &p.Status, &p.CoverImage,
		&p.PublishedAt, &p.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Article not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func CreateBlogPost(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var p models.BlogPost
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if p.Slug == "" {
		p.Slug = strings.ToLower(strings.ReplaceAll(p.Title, " ", "-"))
	}
	if p.ReadTime == "" {
		p.ReadTime = "5 min read"
	}
	if p.Status == "" {
		p.Status = "PUBLISHED"
	}
	if p.CoverImage == "" {
		p.CoverImage = "/article_professional.jpg"
	}

	query := `INSERT INTO blog_posts (title, slug, excerpt, content, author_name, author_role, author_avatar, category, tags, read_time, status, cover_image)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, published_at, created_at`

	err := db.Pool.QueryRow(ctx, query,
		p.Title, p.Slug, p.Excerpt, p.Content,
		p.AuthorName, p.AuthorRole, p.AuthorAvatar, p.Category,
		p.Tags, p.ReadTime, p.Status, p.CoverImage,
	).Scan(&p.ID, &p.PublishedAt, &p.CreatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func ListCategories(w http.ResponseWriter, r *http.Request) {
	categories := []string{
		"Taxation & FIRS",
		"Data Privacy & NDPA",
		"Corporate & CAC",
		"AML & SCUML",
		"Labour & Pension",
		"Immigration & Expatriate",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}
