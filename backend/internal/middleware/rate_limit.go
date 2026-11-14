package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"compliancehub-backend/internal/cache"

	"github.com/redis/go-redis/v9"
)

// InMemoryRateLimiter provides reliable local fallback when Redis is unreachable
type InMemoryRateLimiter struct {
	mu       sync.Mutex
	attempts map[string][]time.Time
	limit    int
	window   time.Duration
}

func NewInMemoryRateLimiter(limit int, window time.Duration) *InMemoryRateLimiter {
	rl := &InMemoryRateLimiter{
		attempts: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}

	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			rl.cleanup()
		}
	}()

	return rl
}

func (rl *InMemoryRateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	var valid []time.Time
	for _, t := range rl.attempts[key] {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.limit {
		rl.attempts[key] = valid
		return false
	}

	rl.attempts[key] = append(valid, now)
	return true
}

func (rl *InMemoryRateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)
	for key, times := range rl.attempts {
		var valid []time.Time
		for _, t := range times {
			if t.After(cutoff) {
				valid = append(valid, t)
			}
		}
		if len(valid) == 0 {
			delete(rl.attempts, key)
		} else {
			rl.attempts[key] = valid
		}
	}
}

// Fallback memory rate limiters
var (
	memAuthLimiter    = NewInMemoryRateLimiter(10, 1*time.Minute)
	memPublicLimiter  = NewInMemoryRateLimiter(15, 1*time.Minute)
	memUploadLimiter  = NewInMemoryRateLimiter(20, 1*time.Hour)
	memGeneralLimiter = NewInMemoryRateLimiter(120, 1*time.Minute)
)

// Legacy alias for backwards compatibility
var AuthLimiter = memAuthLimiter

// CheckSlidingWindowRateLimit evaluates requests using Redis ZSET with atomic pipelining
func CheckSlidingWindowRateLimit(
	ctx context.Context,
	redisKey string,
	limit int,
	window time.Duration,
	memFallback *InMemoryRateLimiter,
) (allowed bool, remaining int, retryAfterSec int) {
	c := cache.DefaultClient

	retrySec := int(window.Seconds())
	if retrySec <= 0 {
		retrySec = 1
	}

	if c == nil || !c.IsAvailable() {
		// Fallback to local memory limiter
		ok := memFallback.Allow(redisKey)
		if ok {
			return true, 1, 0
		}
		return false, 0, retrySec
	}

	now := time.Now().UnixNano()
	cutoff := now - window.Nanoseconds()
	nowMember := strconv.FormatInt(now, 10)

	pipe := c.Ping
	_ = pipe // prevent unused

	// Redis Pipelined sliding-window execution
	pipeCmds, err := c.Pipelined(ctx, func(p redis.Pipeliner) error {
		// 1. Remove expired entries older than the sliding window
		p.ZRemRangeByScore(ctx, redisKey, "-inf", strconv.FormatInt(cutoff, 10))
		// 2. Count current elements in window
		p.ZCard(ctx, redisKey)
		// 3. Add current timestamp
		p.ZAdd(ctx, redisKey, redis.Z{Score: float64(now), Member: nowMember})
		// 4. Set expiration on the ZSET to automatically clean up inactive keys
		p.Expire(ctx, redisKey, window+time.Minute)
		return nil
	})

	if err != nil {
		// Fail-open to in-memory fallback on Redis error
		ok := memFallback.Allow(redisKey)
		if ok {
			return true, 1, 0
		}
		return false, 0, retrySec
	}

	// Read ZCard result
	cardCmd, ok := pipeCmds[1].(*redis.IntCmd)
	if !ok {
		return true, 1, 0
	}

	currentCount, _ := cardCmd.Result()
	if currentCount > int64(limit) {
		// Over limit: remove newly added entry to preserve accurate counter
		go func() {
			bgCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			_ = c.ZRem(bgCtx, redisKey, nowMember)
		}()
		return false, 0, retrySec
	}

	rem := limit - int(currentCount)
	if rem < 0 {
		rem = 0
	}
	return true, rem, 0
}

func getClientIP(r *http.Request) string {
	clientIP := r.Header.Get("X-Forwarded-For")
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}
	if strings.Contains(clientIP, ",") {
		clientIP = strings.TrimSpace(strings.Split(clientIP, ",")[0])
	}
	if strings.Contains(clientIP, ":") {
		// Strip port if present
		parts := strings.Split(clientIP, ":")
		if len(parts) == 2 {
			clientIP = parts[0]
		}
	}
	return clientIP
}

// RateLimitAuth: Tier 1 (10 attempts / minute / IP)
func RateLimitAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)
		key := fmt.Sprintf("chub:%s:auth:global:ratelimit:auth:%s", cache.GetEnvNamespace(), ip)

		allowed, remaining, retryAfter := CheckSlidingWindowRateLimit(r.Context(), key, 10, 1*time.Minute, memAuthLimiter)
		w.Header().Set("X-RateLimit-Limit", "10")
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))

		if !allowed {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":       "Too many authentication attempts. Please wait a moment before trying again.",
				"retry_after": retryAfter,
			})
			return
		}

		next(w, r)
	}
}

// RateLimitPublic: Tier 2 (15 requests / minute / IP)
func RateLimitPublic(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)
		key := fmt.Sprintf("chub:%s:auth:global:ratelimit:public:%s", cache.GetEnvNamespace(), ip)

		allowed, remaining, retryAfter := CheckSlidingWindowRateLimit(r.Context(), key, 15, 1*time.Minute, memPublicLimiter)
		w.Header().Set("X-RateLimit-Limit", "15")
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))

		if !allowed {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":       "Too many requests from this IP. Please wait before retrying.",
				"retry_after": retryAfter,
			})
			return
		}

		next(w, r)
	}
}

// RateLimitTenantUploads: Tier 3 (20 uploads / hour / tenant)
func RateLimitTenantUploads(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tenantCtx := GetTenantContext(r)
		tenantID := "global"
		if tenantCtx != nil && tenantCtx.TenantID != "" {
			tenantID = tenantCtx.TenantID
		}

		key := fmt.Sprintf("chub:%s:auth:tenant:%s:ratelimit:upload", cache.GetEnvNamespace(), tenantID)

		allowed, remaining, retryAfter := CheckSlidingWindowRateLimit(r.Context(), key, 20, 1*time.Hour, memUploadLimiter)
		w.Header().Set("X-RateLimit-Limit", "20")
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))

		if !allowed {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":       "Tenant document upload quota reached (maximum 20 uploads per hour).",
				"retry_after": retryAfter,
			})
			return
		}

		next(w, r)
	}
}

// RateLimitGeneralAPI: Tier 4 (120 requests / minute / user)
func RateLimitGeneralAPI(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetUserFromContext(r)
		identifier := getClientIP(r)
		if user != nil && user.ID != "" {
			identifier = user.ID
		}

		key := fmt.Sprintf("chub:%s:auth:user:%s:ratelimit:api", cache.GetEnvNamespace(), identifier)

		allowed, remaining, retryAfter := CheckSlidingWindowRateLimit(r.Context(), key, 120, 1*time.Minute, memGeneralLimiter)
		w.Header().Set("X-RateLimit-Limit", "120")
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))

		if !allowed {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":       "API rate limit exceeded (120 requests per minute).",
				"retry_after": retryAfter,
			})
			return
		}

		next(w, r)
	}
}
