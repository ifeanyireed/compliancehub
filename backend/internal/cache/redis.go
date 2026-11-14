package cache

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"
)

// CircuitBreaker tracks Redis connection stability to prevent cascading timeouts
type CircuitBreaker struct {
	mu           sync.RWMutex
	failures     int32
	lastFailure  time.Time
	isOpen       bool
	openUntil    time.Time
	threshold    int32
	window       time.Duration
	resetTimeout time.Duration
}

func newCircuitBreaker() *CircuitBreaker {
	return &CircuitBreaker{
		threshold:    5,
		window:       30 * time.Second,
		resetTimeout: 60 * time.Second,
	}
}

func (cb *CircuitBreaker) CanExecute() bool {
	cb.mu.RLock()
	if !cb.isOpen {
		cb.mu.RUnlock()
		return true
	}
	// Check if cooldown elapsed
	if time.Now().After(cb.openUntil) {
		cb.mu.RUnlock()
		cb.mu.Lock()
		cb.isOpen = false
		atomic.StoreInt32(&cb.failures, 0)
		cb.mu.Unlock()
		return true
	}
	cb.mu.RUnlock()
	return false
}

func (cb *CircuitBreaker) RecordSuccess() {
	if atomic.LoadInt32(&cb.failures) > 0 {
		atomic.StoreInt32(&cb.failures, 0)
	}
}

func (cb *CircuitBreaker) RecordFailure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	now := time.Now()
	if now.Sub(cb.lastFailure) > cb.window {
		cb.failures = 1
	} else {
		cb.failures++
	}
	cb.lastFailure = now

	if cb.failures >= cb.threshold {
		cb.isOpen = true
		cb.openUntil = now.Add(cb.resetTimeout)
		log.Printf("⚠️ Redis Circuit Breaker tripped: %d consecutive failures. Bypassing Redis for %v", cb.failures, cb.resetTimeout)
	}
}

// Client wraps the go-redis client with namespace, resilience, and convenience methods
type Client struct {
	rdb            *redis.Client
	circuitBreaker *CircuitBreaker
	env            string
}

// Global default client instance
var DefaultClient *Client

// GetEnvNamespace returns the deployment environment (prod, staging, dev)
func GetEnvNamespace() string {
	env := strings.ToLower(os.Getenv("REDIS_ENV"))
	if env == "" {
		env = strings.ToLower(os.Getenv("APP_ENV"))
	}
	if env == "" {
		env = strings.ToLower(os.Getenv("ENV"))
	}
	if strings.Contains(env, "dev") {
		return "dev"
	}
	if strings.Contains(env, "stag") {
		return "staging"
	}
	return "prod"
}

// InitRedis parses the connection URL, establishes the connection pool, and initializes circuit breaker
func InitRedis(rawURL string) (*Client, error) {
	if rawURL == "" {
		log.Printf("ℹ️ REDIS_URL not configured: Redis caching will run in fail-open in-memory mode")
		return nil, nil
	}

	opt, err := redis.ParseURL(rawURL)
	if err != nil {
		return nil, fmt.Errorf("invalid REDIS_URL: %w", err)
	}

	// Enable TLS if using rediss scheme or port 6379 on Upstash
	if strings.HasPrefix(rawURL, "rediss://") && opt.TLSConfig == nil {
		opt.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	// Optimize connection pooling for serverless / Render container instances
	opt.PoolSize = 20
	opt.MinIdleConns = 5
	opt.MaxIdleConns = 10
	opt.ConnMaxIdleTime = 5 * time.Minute
	opt.ConnMaxLifetime = 30 * time.Minute
	opt.DialTimeout = 3 * time.Second
	opt.ReadTimeout = 500 * time.Millisecond
	opt.WriteTimeout = 500 * time.Millisecond

	rdb := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	start := time.Now()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️ Warning: Initial Redis Ping failed (%v). Backend will start in fail-open mode.", err)
	} else {
		log.Printf("✅ Upstash Redis connected successfully via TCP (latency: %v)", time.Since(start))
	}

	c := &Client{
		rdb:            rdb,
		circuitBreaker: newCircuitBreaker(),
		env:            GetEnvNamespace(),
	}

	DefaultClient = c
	return c, nil
}

// Close gracefully terminates the connection pool
func (c *Client) Close() error {
	if c != nil && c.rdb != nil {
		return c.rdb.Close()
	}
	return nil
}

// IsAvailable checks if the Redis client is ready and circuit breaker is healthy
func (c *Client) IsAvailable() bool {
	return c != nil && c.rdb != nil && c.circuitBreaker.CanExecute()
}

// Ping checks Redis connectivity and returns latency
func (c *Client) Ping(ctx context.Context) (time.Duration, error) {
	if c == nil || c.rdb == nil {
		return 0, fmt.Errorf("redis client unconfigured")
	}

	start := time.Now()
	err := c.rdb.Ping(ctx).Err()
	latency := time.Since(start)

	if err != nil {
		c.circuitBreaker.RecordFailure()
		return latency, err
	}

	c.circuitBreaker.RecordSuccess()
	return latency, nil
}

// BuildKey constructs the canonical namespace key:
// chub:{environment}:{subsystem}:{scope}:{resource}:{identifier}
func (c *Client) BuildKey(subsystem, scope, resource, identifier string) string {
	env := "prod"
	if c != nil && c.env != "" {
		env = c.env
	} else {
		env = GetEnvNamespace()
	}

	parts := []string{"chub", env, subsystem, scope, resource}
	if identifier != "" {
		parts = append(parts, identifier)
	}
	return strings.Join(parts, ":")
}

// GetTenantKey generates a tenant-scoped deterministic cache key
func (c *Client) GetTenantKey(subsystem, tenantID, resource, identifier string) string {
	return c.BuildKey(subsystem, fmt.Sprintf("tenant_%s", tenantID), resource, identifier)
}

// GetGlobalKey generates a platform-wide global key
func (c *Client) GetGlobalKey(subsystem, resource, identifier string) string {
	return c.BuildKey(subsystem, "global", resource, identifier)
}

// GetJSON retrieves and deserializes JSON from Redis (fail-open)
func (c *Client) GetJSON(ctx context.Context, key string, dest interface{}) error {
	if !c.IsAvailable() {
		return redis.Nil
	}

	val, err := c.rdb.Get(ctx, key).Result()
	if err != nil {
		if err != redis.Nil {
			c.circuitBreaker.RecordFailure()
		}
		return err
	}

	c.circuitBreaker.RecordSuccess()
	return json.Unmarshal([]byte(val), dest)
}

// SetJSON serializes and writes a value with random jitter to prevent cache stampedes
func (c *Client) SetJSON(ctx context.Context, key string, val interface{}, ttl time.Duration) error {
	if !c.IsAvailable() {
		return nil
	}

	bytes, err := json.Marshal(val)
	if err != nil {
		return fmt.Errorf("json marshal error: %w", err)
	}

	// Apply ±10% random jitter
	if ttl > time.Minute {
		jitterSec := int64(float64(ttl.Seconds()) * (rand.Float64()*0.2 - 0.1))
		ttl = time.Duration(ttl.Seconds()+float64(jitterSec)) * time.Second
	}

	err = c.rdb.Set(ctx, key, bytes, ttl).Err()
	if err != nil {
		c.circuitBreaker.RecordFailure()
		return err
	}

	c.circuitBreaker.RecordSuccess()
	return nil
}

// DeleteKey deletes a single key from Redis
func (c *Client) DeleteKey(ctx context.Context, key string) error {
	if !c.IsAvailable() {
		return nil
	}

	err := c.rdb.Del(ctx, key).Err()
	if err != nil {
		c.circuitBreaker.RecordFailure()
		return err
	}
	c.circuitBreaker.RecordSuccess()
	return nil
}

// DeletePattern deletes all keys matching a specific pattern using SCAN (prevents blocking)
func (c *Client) DeletePattern(ctx context.Context, pattern string) error {
	if !c.IsAvailable() {
		return nil
	}

	var cursor uint64
	for {
		keys, nextCursor, err := c.rdb.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			c.circuitBreaker.RecordFailure()
			return err
		}

		if len(keys) > 0 {
			if err := c.rdb.Del(ctx, keys...).Err(); err != nil {
				c.circuitBreaker.RecordFailure()
				return err
			}
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	c.circuitBreaker.RecordSuccess()
	return nil
}

// DeleteTenantPattern deletes all keys belonging to a specific tenant within a subsystem
func (c *Client) DeleteTenantPattern(ctx context.Context, subsystem, tenantID string) error {
	pattern := c.BuildKey(subsystem, fmt.Sprintf("tenant_%s", tenantID), "*", "")
	return c.DeletePattern(ctx, pattern)
}

// AcquireLock implements distributed mutex using SET NX EX
func (c *Client) AcquireLock(ctx context.Context, lockKey string, ttl time.Duration) (bool, error) {
	if !c.IsAvailable() {
		return true, nil // Fail-open to avoid blocking requests
	}

	ok, err := c.rdb.SetNX(ctx, lockKey, "LOCKED", ttl).Result()
	if err != nil {
		c.circuitBreaker.RecordFailure()
		return true, nil // Fail-open
	}

	c.circuitBreaker.RecordSuccess()
	return ok, nil
}

// ReleaseLock releases the acquired lock
func (c *Client) ReleaseLock(ctx context.Context, lockKey string) error {
	if !c.IsAvailable() {
		return nil
	}
	return c.rdb.Del(ctx, lockKey).Err()
}

// HIncrBy increments a hash field atomically (used for blog view buffering)
func (c *Client) HIncrBy(ctx context.Context, key, field string, incr int64) (int64, error) {
	if !c.IsAvailable() {
		return 0, nil
	}

	val, err := c.rdb.HIncrBy(ctx, key, field, incr).Result()
	if err != nil {
		c.circuitBreaker.RecordFailure()
		return 0, err
	}
	c.circuitBreaker.RecordSuccess()
	return val, nil
}

// HGetAll reads all fields from a hash
func (c *Client) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	if !c.IsAvailable() {
		return make(map[string]string), nil
	}

	res, err := c.rdb.HGetAll(ctx, key).Result()
	if err != nil {
		c.circuitBreaker.RecordFailure()
		return nil, err
	}
	c.circuitBreaker.RecordSuccess()
	return res, nil
}

// HDel removes fields from a hash
func (c *Client) HDel(ctx context.Context, key string, fields ...string) error {
	if !c.IsAvailable() || len(fields) == 0 {
		return nil
	}
	return c.rdb.HDel(ctx, key, fields...).Err()
}

// Pipelined executes commands in a Redis pipeline
func (c *Client) Pipelined(ctx context.Context, fn func(redis.Pipeliner) error) ([]redis.Cmder, error) {
	if !c.IsAvailable() {
		return nil, fmt.Errorf("redis unavailable")
	}
	cmds, err := c.rdb.Pipelined(ctx, fn)
	if err != nil {
		c.circuitBreaker.RecordFailure()
		return nil, err
	}
	c.circuitBreaker.RecordSuccess()
	return cmds, nil
}

// ZRem removes members from a sorted set
func (c *Client) ZRem(ctx context.Context, key string, members ...interface{}) error {
	if !c.IsAvailable() || len(members) == 0 {
		return nil
	}
	return c.rdb.ZRem(ctx, key, members...).Err()
}

// BlacklistToken stores a revoked JWT JTI
func (c *Client) BlacklistToken(ctx context.Context, jti string, ttl time.Duration) error {
	if !c.IsAvailable() || jti == "" {
		return nil
	}
	key := c.GetGlobalKey("auth", "blacklist", jti)
	return c.rdb.Set(ctx, key, "REVOKED", ttl).Err()
}

// IsTokenBlacklisted verifies if a token JTI has been revoked
func (c *Client) IsTokenBlacklisted(ctx context.Context, jti string) bool {
	if !c.IsAvailable() || jti == "" {
		return false
	}
	key := c.GetGlobalKey("auth", "blacklist", jti)
	exists, err := c.rdb.Exists(ctx, key).Result()
	if err != nil {
		c.circuitBreaker.RecordFailure()
		return false
	}
	c.circuitBreaker.RecordSuccess()
	return exists > 0
}

// StoreResetToken stores a password reset token mapped to user ID
func (c *Client) StoreResetToken(ctx context.Context, token, userID string, ttl time.Duration) error {
	if !c.IsAvailable() || token == "" {
		return nil
	}
	key := c.GetGlobalKey("auth", "reset_token", token)
	return c.rdb.Set(ctx, key, userID, ttl).Err()
}

// ConsumeResetToken atomically fetches and deletes the reset token (GETDEL)
func (c *Client) ConsumeResetToken(ctx context.Context, token string) (string, error) {
	if !c.IsAvailable() || token == "" {
		return "", redis.Nil
	}
	key := c.GetGlobalKey("auth", "reset_token", token)
	val, err := c.rdb.GetDel(ctx, key).Result()
	if err != nil {
		if err != redis.Nil {
			c.circuitBreaker.RecordFailure()
		}
		return "", err
	}
	c.circuitBreaker.RecordSuccess()
	return val, nil
}
