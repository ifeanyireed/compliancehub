package cache

import (
	"context"
	"testing"
	"time"
)

func TestBuildKeyHierarchy(t *testing.T) {
	c := &Client{env: "prod"}

	// 1. Tenant-scoped business key
	tenantKey := c.GetTenantKey("business", "tenant-1234", "calendar", "2026-11")
	expectedTenantKey := "chub:prod:business:tenant_tenant-1234:calendar:2026-11"
	if tenantKey != expectedTenantKey {
		t.Errorf("expected tenant key %q, got %q", expectedTenantKey, tenantKey)
	}

	// 2. Tenant isolation verification: Tenant A != Tenant B
	tenantAKey := c.GetTenantKey("business", "tenant-aaaa", "score", "current")
	tenantBKey := c.GetTenantKey("business", "tenant-bbbb", "score", "current")
	if tenantAKey == tenantBKey {
		t.Fatalf("CRITICAL SECURITY VIOLATION: Tenant A key collided with Tenant B: %s", tenantAKey)
	}

	// 3. Global platform asset key
	globalKey := c.GetGlobalKey("shared", "frameworks", "all")
	expectedGlobalKey := "chub:prod:shared:global:frameworks:all"
	if globalKey != expectedGlobalKey {
		t.Errorf("expected global key %q, got %q", expectedGlobalKey, globalKey)
	}

	// 4. Rate limit key
	rateLimitKey := c.GetGlobalKey("auth", "ratelimit:auth", "102.89.44.12")
	expectedRateLimitKey := "chub:prod:auth:global:ratelimit:auth:102.89.44.12"
	if rateLimitKey != expectedRateLimitKey {
		t.Errorf("expected ratelimit key %q, got %q", expectedRateLimitKey, rateLimitKey)
	}

	// 5. Distributed lock key
	lockKey := c.GetGlobalKey("lock", "idempotency", "pay_91a0")
	expectedLockKey := "chub:prod:lock:global:idempotency:pay_91a0"
	if lockKey != expectedLockKey {
		t.Errorf("expected lock key %q, got %q", expectedLockKey, lockKey)
	}
}

func TestCircuitBreakerResilience(t *testing.T) {
	cb := newCircuitBreaker()
	cb.threshold = 3
	cb.resetTimeout = 100 * time.Millisecond

	if !cb.CanExecute() {
		t.Fatal("Circuit breaker should initially be closed")
	}

	cb.RecordFailure()
	cb.RecordFailure()
	if !cb.CanExecute() {
		t.Fatal("Circuit breaker should still be closed at 2 failures (threshold=3)")
	}

	cb.RecordFailure() // 3rd failure trips the breaker
	if cb.CanExecute() {
		t.Fatal("Circuit breaker should be open after reaching threshold")
	}

	// Wait for cooldown
	time.Sleep(120 * time.Millisecond)

	if !cb.CanExecute() {
		t.Fatal("Circuit breaker should allow execution after reset timeout")
	}
}

func TestFailOpenBehaviorWhenUnconfigured(t *testing.T) {
	// A nil or unconfigured client must fail-open without panics
	var c *Client = nil

	if c.IsAvailable() {
		t.Fatal("Unconfigured client should not report available")
	}

	ctx := context.Background()

	// Locks must fail-open (return true) so unconfigured instances don't deadlock
	ok, err := c.AcquireLock(ctx, "test-lock", time.Minute)
	if !ok || err != nil {
		t.Errorf("Expected fail-open lock acquisition, got ok=%v, err=%v", ok, err)
	}

	// Delete must not panic
	if err := c.DeleteKey(ctx, "non-existent"); err != nil {
		t.Errorf("Expected nil error on fail-open delete, got %v", err)
	}

	// Token blacklist check must return false when unconfigured
	if c.IsTokenBlacklisted(ctx, "some-jti") {
		t.Errorf("Expected unconfigured client to return false for blacklisted token")
	}
}
