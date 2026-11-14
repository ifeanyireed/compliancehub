package middleware

import (
	"context"
	"testing"
	"time"
)

func TestInMemoryRateLimiter(t *testing.T) {
	limiter := NewInMemoryRateLimiter(5, 100*time.Millisecond)

	key := "test-client-1"

	// First 5 attempts should succeed
	for i := 1; i <= 5; i++ {
		if !limiter.Allow(key) {
			t.Fatalf("Attempt %d should be allowed", i)
		}
	}

	// 6th attempt within window must be rejected
	if limiter.Allow(key) {
		t.Fatal("6th attempt should be rejected by rate limiter")
	}

	// Distinct client key must not be affected (tenant/client isolation)
	otherKey := "test-client-2"
	if !limiter.Allow(otherKey) {
		t.Fatal("Client 2 should have independent quota")
	}

	// Wait for window to expire
	time.Sleep(120 * time.Millisecond)

	// After window expires, should be allowed again
	if !limiter.Allow(key) {
		t.Fatal("Attempt after window expiration should be allowed")
	}
}

func TestCheckSlidingWindowRateLimitFallback(t *testing.T) {
	mem := NewInMemoryRateLimiter(3, 100*time.Millisecond)
	ctx := context.Background()

	// When Redis is unconfigured or unavailable, CheckSlidingWindowRateLimit must seamlessly use memFallback
	allowed, _, _ := CheckSlidingWindowRateLimit(ctx, "test:key:ip1", 3, 100*time.Millisecond, mem)
	if !allowed {
		t.Fatal("First request should be allowed")
	}

	allowed, _, _ = CheckSlidingWindowRateLimit(ctx, "test:key:ip1", 3, 100*time.Millisecond, mem)
	if !allowed {
		t.Fatal("Second request should be allowed")
	}

	allowed, _, _ = CheckSlidingWindowRateLimit(ctx, "test:key:ip1", 3, 100*time.Millisecond, mem)
	if !allowed {
		t.Fatal("Third request should be allowed")
	}

	// 4th request must be rate limited
	allowed, rem, retryAfter := CheckSlidingWindowRateLimit(ctx, "test:key:ip1", 3, 100*time.Millisecond, mem)
	if allowed {
		t.Fatal("4th request should be rejected")
	}
	if rem != 0 {
		t.Errorf("Expected remaining 0, got %d", rem)
	}
	if retryAfter == 0 {
		t.Errorf("Expected positive retryAfter, got %d", retryAfter)
	}
}
