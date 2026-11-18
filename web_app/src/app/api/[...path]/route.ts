import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import {
  checkRedisHealth,
  rateLimitCheck,
  getCached,
  setCached,
  acquireWebhookIdempotency,
  getGlobalKey,
} from "@/lib/redis";
import {
  verifyJWT,
  signJWT,
  createDemoJWT,
  DEMO_JWT_USERS,
} from "@/lib/jwt";
import {
  getTierLimits,
  normalizePlanTier,
  canUploadDocument,
  canInviteMember,
  hasModuleAccess,
  isTrialActive,
  getDaysRemainingInTrial,
} from "@/lib/SubscriptionHelper";
import { SubscriptionService } from "@/lib/SubscriptionService";

export const dynamic = "force-dynamic";

const DEFAULT_TENANT_ID = "55555555-5555-5555-5555-555555555501";

let schemaMigrated = false;
async function ensureTenantColumns(sql: any) {
  if (schemaMigrated) return;
  try {
    await sql.query(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'ACTIVE';
    `);
    schemaMigrated = true;
  } catch (_) {
    // Non-blocking if table or permission already configured
  }
}

const DEFAULT_FALLBACK_USER = {
  id: "33333333-3333-3333-3333-333333333301",
  email: "adaeze@paywave.ng",
  full_name: "Adaeze Nwosu",
  system_role: "USER" as const,
  role: "BUSINESS",
  tenant_id: DEFAULT_TENANT_ID,
};

function getSql() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(dbUrl);
}

function getTenantId(request: Request): string {
  const url = new URL(request.url);
  return (
    request.headers.get("x-tenant-id") ||
    url.searchParams.get("tenant_id") ||
    DEFAULT_TENANT_ID
  );
}

async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  let token = "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (token) {
    const claims = await verifyJWT(token);
    if (claims && claims.user_id) {
      return {
        id: claims.user_id,
        email: claims.email,
        full_name: claims.full_name,
        system_role: (claims.system_role || "USER") as "ADMIN" | "STAFF" | "USER",
        role: claims.role || (claims.system_role === "ADMIN" ? "ADMIN" : claims.system_role === "STAFF" ? "STAFF" : "BUSINESS"),
        tenant_id: claims.tenant_id || DEFAULT_TENANT_ID,
      };
    }
  }

  // Check headers forwarded by Next.js edge middleware
  const headerUserId = request.headers.get("x-user-id");
  if (headerUserId) {
    const headerEmail = request.headers.get("x-user-email") || "";
    const headerRole = request.headers.get("x-user-role") || "BUSINESS";
    const headerTenant = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    return {
      id: headerUserId,
      email: headerEmail,
      full_name: headerEmail ? headerEmail.split("@")[0] : "Authorized User",
      system_role: (headerRole === "ADMIN" ? "ADMIN" : headerRole === "STAFF" ? "STAFF" : "USER") as "ADMIN" | "STAFF" | "USER",
      role: headerRole,
      tenant_id: headerTenant,
    };
  }

  return null;
}

function slugify(text: string): string {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || `item-${Date.now()}`;
}

async function handleRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const cleanPath = "/" + (path || []).filter(Boolean).join("/");
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  if (method === "OPTIONS") {
    return new NextResponse(null, { status: 200 });
  }

  // Extract client IP for distributed rate limiting
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Tier 1: Auth Rate Limiting (10 requests / minute / IP)
  if (
    cleanPath.startsWith("/v1/auth/login") ||
    cleanPath.startsWith("/v1/auth/register") ||
    cleanPath.startsWith("/v1/auth/forgot-password") ||
    cleanPath.startsWith("/v1/auth/reset-password") ||
    cleanPath.startsWith("/v1/corporate-audit/claim")
  ) {
    const rl = await rateLimitCheck("auth", clientIp);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many authentication attempts. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rl.reset) } }
      );
    }
  }

  // Tier 2: Public Inquiries Rate Limiting (15 requests / minute / IP)
  if (
    cleanPath.startsWith("/support/tickets") ||
    cleanPath.startsWith("/chat/messages") ||
    cleanPath.startsWith("/blog/subscribe")
  ) {
    const rl = await rateLimitCheck("public", clientIp);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before retrying." },
        { status: 429, headers: { "Retry-After": String(rl.reset) } }
      );
    }
  }

  try {
    const sql = getSql();
    const tenantId = getTenantId(request);
    const authUser = await getAuthUser(request);
    const demoUser = authUser || DEFAULT_FALLBACK_USER;

    // ==========================================
    // Health Check with Redis Connectivity Status
    // ==========================================
    if (cleanPath === "/health") {
      const redisHealth = await checkRedisHealth();
      return NextResponse.json({
        status: "ok",
        database: "Neon Lakebase Postgres (connected)",
        redis: redisHealth.message || redisHealth.status,
        service: "ComplianceHub.ng Core API",
      });
    }

    // ==========================================
    // Master Regulatory Frameworks & Obligations (24h Redis Cache)
    // ==========================================
    if (cleanPath === "/v1/frameworks" && method === "GET") {
      const cacheKey = getGlobalKey("shared", "frameworks", "all");
      const cached = await getCached<any[]>(cacheKey);
      if (cached && cached.length > 0) {
        return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
      }

      const frameworks = await sql.query(`
        SELECT id, authority, statute_name, COALESCE(section_reference, '') AS section_reference,
               COALESCE(official_source_url, '') AS official_source_url, frequency,
               COALESCE(applies_to_industries, ARRAY[]::text[]) AS applies_to_industries,
               COALESCE(penalty_formula, '') AS penalty_formula, created_at
        FROM regulatory_frameworks
        ORDER BY authority ASC
      `);

      const obligations = await sql.query(`
        SELECT id, COALESCE(framework_id::text, '') AS framework_id, title, authority, description,
               statutory_ref, default_frequency, COALESCE(required_evidence_type, '') AS required_evidence_type, is_statutory
        FROM obligations
        ORDER BY authority ASC, title ASC
      `);

      const obMap: Record<string, any[]> = {};
      for (const o of (obligations as any[]) || []) {
        if (!obMap[o.framework_id]) obMap[o.framework_id] = [];
        obMap[o.framework_id].push(o);
      }

      const combined = ((frameworks as any[]) || []).map((f: any) => ({
        ...f,
        obligations: obMap[f.id] || [],
      }));

      if (combined.length > 0) {
        await setCached(cacheKey, combined, 86400); // 24 hours
      }

      return NextResponse.json(combined, { headers: { "X-Cache": "MISS" } });
    }

    // ==========================================
    // Paystack Webhook with Distributed Idempotency Lock
    // ==========================================
    if (
      (cleanPath === "/v1/payments/webhook" || cleanPath === "/payments/paystack/webhook") &&
      method === "POST"
    ) {
      const body = await request.json().catch(() => ({}));
      const reference = body?.data?.reference || `evt_${body?.data?.id || Date.now()}`;
      const acquired = await acquireWebhookIdempotency(reference);
      if (!acquired) {
        return NextResponse.json(
          { status: "ignored", message: "Duplicate payment webhook event already handled or in progress" },
          { status: 200 }
        );
      }

      if (body?.event === "charge.success" && reference) {
        await sql.query(
          "UPDATE invoices SET status = 'SETTLED', paid_at = NOW(), payout_ref = $1 WHERE invoice_number = $2 OR id::text = $2",
          [reference, reference]
        );

        const meta = body?.data?.metadata || {};
        const metaTenantId = meta.tenant_id;
        const metaPlan = meta.plan_tier;
        if (metaTenantId && metaPlan) {
          const limits = getTierLimits(metaPlan);
          await sql.query(
            "UPDATE tenants SET plan_tier = $1, updated_at = NOW() WHERE id = $2",
            [limits.name, metaTenantId]
          );
        }
      }
      return NextResponse.json({ status: "success", message: "Paystack webhook processed successfully" });
    }

    // ==========================================
    // Admin Cockpit Routes (Requires Verified ADMIN role)
    // ==========================================
    if (cleanPath.startsWith("/admin/")) {
      const isAuthorizedAdmin = authUser && (authUser.system_role === "ADMIN" || authUser.role === "ADMIN");
      if (!isAuthorizedAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Super Administrator privileges required" },
          { status: 403 }
        );
      }
    }

    if (cleanPath === "/admin/metrics" && method === "GET") {
      const [
        ticketsRes,
        chatsRes,
        tenantsRes,
        expertsRes,
        pendingRes,
        completedRes,
        revRes,
        healthRes,
      ] = await Promise.all([
        sql.query("SELECT COUNT(*)::int AS count FROM support_tickets WHERE status != 'RESOLVED'"),
        sql.query("SELECT COUNT(*)::int AS count FROM chat_sessions WHERE status = 'ACTIVE'"),
        sql.query("SELECT COUNT(*)::int AS count FROM tenants"),
        sql.query("SELECT COUNT(*)::int AS count FROM professional_profiles WHERE verification_status = 'VERIFIED'"),
        sql.query("SELECT COUNT(*)::int AS count FROM tenant_obligations WHERE status = 'PENDING'"),
        sql.query("SELECT COUNT(*)::int AS count FROM tenant_obligations WHERE status = 'FILED'"),
        sql.query("SELECT COALESCE(SUM(amount_ngn), 0)::float8 AS total FROM invoices WHERE status IN ('SETTLED', 'DISBURSED')"),
        sql.query("SELECT COALESCE(AVG(compliance_score), 85.0)::float8 AS avg FROM tenants"),
      ]);

      return NextResponse.json({
        total_companies: Number(tenantsRes[0]?.count ?? 0),
        active_practitioners: Number(expertsRes[0]?.count ?? 0),
        filings_completed: Number(completedRes[0]?.count ?? 0),
        pending_filings: Number(pendingRes[0]?.count ?? 0),
        monthly_revenue_ngn: Number(revRes[0]?.total ?? 0),
        open_support_tickets: Number(ticketsRes[0]?.count ?? 0),
        active_chat_sessions: Number(chatsRes[0]?.count ?? 0),
        compliance_health_rate: Number(healthRes[0]?.avg ?? 85.0),
      });
    }

    if (cleanPath === "/admin/filings" && method === "GET") {
      const rows = await sql.query(`
        SELECT tob.id,
               COALESCE(o.legal_name, t.workspace_name) AS company,
               COALESCE(o.rc_number, 'RC-PENDING') AS rc,
               tob.title AS filing,
               tob.authority,
               tob.status,
               COALESCE(u.full_name, 'Tunde Bakare, CAMS') AS officer,
               TO_CHAR(tob.updated_at, 'YYYY-MM-DD HH24:MI') AS time
        FROM tenant_obligations tob
        JOIN tenants t ON tob.tenant_id = t.id
        LEFT JOIN organisations o ON t.organisation_id = o.id
        LEFT JOIN users u ON tob.assigned_to = u.id
        ORDER BY tob.updated_at DESC
        LIMIT 20
      `);
      return NextResponse.json(rows || []);
    }

    if (cleanPath === "/admin/users" && method === "GET") {
      const rows = await sql.query(`
        SELECT u.id, u.full_name, u.email, u.system_role,
               COALESCE(o.legal_name, 'ComplianceHub Platform') AS company,
               COALESCE(o.rc_number, 'N/A') AS rc_number,
               COALESCE(o.org_type, u.system_role) AS display_role,
               COALESCE(t.plan_tier, 'Standard') AS plan,
               COALESCE(t.compliance_score, 95)::int AS score,
               TO_CHAR(u.created_at, 'YYYY-MM-DD') AS created_at
        FROM users u
        LEFT JOIN tenant_members tm ON u.id = tm.user_id AND tm.is_primary = true
        LEFT JOIN tenants t ON tm.tenant_id = t.id
        LEFT JOIN organisations o ON t.organisation_id = o.id
        ORDER BY u.created_at DESC
        LIMIT 50
      `);

      const users = (rows || []).map((r: any) => {
        let roleLabel = r.display_role;
        if (r.system_role === "ADMIN") roleLabel = "ADMIN";
        else if (r.system_role === "STAFF") roleLabel = "STAFF";
        return {
          id: r.id,
          name: r.full_name,
          email: r.email,
          company: r.company,
          rc_number: r.rc_number,
          role: roleLabel,
          plan: r.plan,
          health: `${r.score}% Compliant`,
          created_at: r.created_at,
          status: "Active",
        };
      });
      return NextResponse.json(users);
    }

    if (cleanPath === "/admin/invoices" && method === "GET") {
      const rows = await sql.query(`
        SELECT id, invoice_number, client_name, amount_ngn::float8 AS amount_ngn, invoice_type, status,
               COALESCE(payout_ref, 'PSTK_TR_PENDING') AS payout_ref,
               TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
               TO_CHAR(created_at, 'YYYY-MM-DD') AS created_at
        FROM invoices
        ORDER BY created_at DESC
        LIMIT 50
      `);

      const invoices = (rows || []).map((r: any) => {
        const amt = Number(r.amount_ngn || 0);
        return {
          id: r.invoice_number,
          client: r.client_name,
          service: `${r.invoice_type} Compliance Retainer`,
          amount_ngn: amt,
          fee_revenue: amt * 0.1,
          expert: "Bakare Compliance Consultancy",
          status: r.status,
          date: r.created_at,
        };
      });
      return NextResponse.json(invoices);
    }

    // ==========================================
    // Auth & Tenants
    // ==========================================
    if (cleanPath === "/v1/auth/login" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = (body.email || "").trim().toLowerCase();

      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      // 1. Check known interactive demo personas
      const demoRoles: Record<string, "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN"> = {
        "adaeze@paywave.ng": "BUSINESS",
        "tunde@bakarecompliance.com": "EXPERT",
        "chiamaka@apexcompliance.ng": "AGENCY",
        "bsanwo@compliancehub.ng": "STAFF",
        "admin@compliancehub.ng": "ADMIN",
      };

      if (demoRoles[email]) {
        const role = demoRoles[email];
        const profile = DEMO_JWT_USERS[role];
        const token = await createDemoJWT(role);
        return NextResponse.json({
          token,
          user: {
            id: profile.user_id,
            email: profile.email,
            full_name: profile.full_name,
            system_role: profile.system_role,
            title: profile.title,
            avatar_url: profile.avatar,
          },
          active_tenant: {
            id: profile.tenant_id,
            workspace_name: profile.company,
            plan_tier: profile.plan_tier,
            compliance_score: 85,
            is_active: true,
          },
          tenants: [
            {
              tenant_id: profile.tenant_id,
              workspace_name: profile.company,
              role: role === "EXPERT" || role === "AGENCY" ? "DELEGATED_EXPERT" : "OWNER",
              plan_tier: profile.plan_tier,
              score: 85,
            },
          ],
        });
      }

      // 2. Query Neon Database for registered user account
      const userRows = await sql.query(`
        SELECT id, email, password_hash, full_name, phone, title, avatar_url, system_role, is_email_verified
        FROM users
        WHERE LOWER(email) = LOWER($1)
      `, [email]);

      if (!userRows || userRows.length === 0) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const dbUser = userRows[0];

      // Verify password if provided
      if (body.password && dbUser.password_hash && dbUser.password_hash !== "hashed_demo_pw") {
        const testHash = crypto.createHash("sha256").update(body.password + "compliancehub_regtech_salt").digest("hex");
        if (testHash !== dbUser.password_hash) {
          return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }
      }

      const tenantRows = await sql.query(`
        SELECT t.id, t.workspace_name, tm.role, t.plan_tier, t.compliance_score
        FROM tenant_members tm
        JOIN tenants t ON tm.tenant_id = t.id
        WHERE tm.user_id = $1
        ORDER BY tm.is_primary DESC, t.created_at ASC
      `, [dbUser.id]);

      const primaryTenant = tenantRows[0] || {
        id: DEFAULT_TENANT_ID,
        workspace_name: "My Enterprise Workspace",
        role: "OWNER",
        plan_tier: "Professional",
        compliance_score: 85,
      };

      const systemRole = dbUser.system_role === "ADMIN" ? "ADMIN" : dbUser.system_role === "STAFF" ? "STAFF" : "USER";
      const userRole = systemRole === "ADMIN" ? "ADMIN" : systemRole === "STAFF" ? "STAFF" : primaryTenant.role || "BUSINESS";

      const token = await signJWT({
        user_id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        system_role: systemRole,
        role: userRole as any,
        tenant_id: primaryTenant.id,
      });

      return NextResponse.json({
        token,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          full_name: dbUser.full_name,
          system_role: dbUser.system_role,
          title: dbUser.title || "Managing Director",
          avatar_url: dbUser.avatar_url || "/character1.jpg",
        },
        active_tenant: {
          id: primaryTenant.id,
          workspace_name: primaryTenant.workspace_name,
          plan_tier: primaryTenant.plan_tier,
          compliance_score: primaryTenant.compliance_score,
          is_active: true,
        },
        tenants: tenantRows || [primaryTenant],
      });
    }

    if (cleanPath === "/v1/auth/me" && method === "GET") {
      if (!authUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      const tenants = await sql.query(
        `SELECT t.id AS tenant_id, t.workspace_name, tm.role, t.plan_tier, t.compliance_score AS score
         FROM tenant_members tm
         JOIN tenants t ON tm.tenant_id = t.id
         WHERE tm.user_id = $1`,
        [authUser.id]
      );
      const activeRows = await sql.query(
        `SELECT t.id, t.organisation_id, t.workspace_name, t.slug, t.plan_tier, t.compliance_score, t.is_active,
                o.legal_name AS organisation_name, COALESCE(o.rc_number, '') AS rc_number, COALESCE(o.industry, '') AS industry
         FROM tenants t
         JOIN organisations o ON t.organisation_id = o.id
         WHERE t.id = $1`,
        [tenantId]
      );
      return NextResponse.json({
        user: authUser,
        active_tenant: activeRows[0] || null,
        tenants: tenants || [],
      });
    }

    if (cleanPath === "/v1/tenants/current") {
      if (method === "GET") {
        const tenantRows = await sql.query(
          `SELECT t.id, t.organisation_id, t.workspace_name, t.slug, t.plan_tier, t.compliance_score, t.is_active,
                  o.legal_name AS organisation_name, COALESCE(o.rc_number, '') AS rc_number, COALESCE(o.industry, '') AS industry,
                  COALESCE(o.address, t.address, '') AS address, COALESCE(o.tin, '') AS tin
           FROM tenants t
           JOIN organisations o ON t.organisation_id = o.id
           WHERE t.id = $1`,
          [tenantId]
        );
        if (!tenantRows || tenantRows.length === 0) {
          return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }
        const [docsRes, empRes, urgentRes] = await Promise.all([
          sql.query("SELECT COUNT(*)::int AS count FROM documents WHERE tenant_id = $1", [tenantId]),
          sql.query("SELECT COUNT(*)::int AS count FROM employees WHERE tenant_id = $1", [tenantId]),
          sql.query("SELECT COUNT(*)::int AS count FROM tenant_obligations WHERE tenant_id = $1 AND is_urgent = true AND status = 'PENDING'", [tenantId]),
        ]);
        return NextResponse.json({
          tenant: tenantRows[0],
          role: "OWNER",
          documents_count: Number(docsRes[0]?.count ?? 0),
          employees_count: Number(empRes[0]?.count ?? 0),
          urgent_deadlines: Number(urgentRes[0]?.count ?? 0),
        });
      }

      if (method === "PATCH" || method === "PUT") {
        const body = await request.json().catch(() => ({}));
        if (body.company_name || body.address) {
          await sql.query(
            `UPDATE tenants
             SET workspace_name = COALESCE(NULLIF($1, ''), workspace_name),
                 address = COALESCE(NULLIF($2, ''), address),
                 updated_at = NOW()
             WHERE id = $3`,
            [body.company_name || "", body.address || "", tenantId]
          );
        }
        await sql.query(
          `UPDATE organisations
           SET legal_name = COALESCE(NULLIF($1, ''), legal_name),
               rc_number = COALESCE(NULLIF($2, ''), rc_number),
               tin = COALESCE(NULLIF($3, ''), tin),
               address = COALESCE(NULLIF($4, ''), address),
               industry = COALESCE(NULLIF($5, ''), industry),
               updated_at = NOW()
           WHERE id = (SELECT organisation_id FROM tenants WHERE id = $6)`,
          [
            body.company_name || "",
            body.rc_number || "",
            body.tin || "",
            body.address || "",
            body.industry || "",
            tenantId,
          ]
        );
        return NextResponse.json({
          success: true,
          message: "Tenant profile successfully updated",
        });
      }
    }

    if (cleanPath === "/v1/tenants" && method === "GET") {
      const rows = await sql.query(`
        SELECT t.id, t.organisation_id, t.workspace_name, t.slug, t.plan_tier, t.compliance_score, t.is_active,
               o.legal_name AS organisation_name, COALESCE(o.rc_number, '') AS rc_number, COALESCE(o.industry, '') AS industry,
               COALESCE(o.address, t.address, '') AS address, COALESCE(o.tin, '') AS tin, t.created_at, t.updated_at
        FROM tenants t
        JOIN organisations o ON t.organisation_id = o.id
        WHERE t.is_active = true
        ORDER BY t.workspace_name ASC
      `);
      return NextResponse.json(rows || []);
    }

    // ==========================================
    // Subscriptions & Quota Enforcement
    // ==========================================
    if (cleanPath === "/v1/subscriptions/usage" && method === "GET") {
      await ensureTenantColumns(sql);
      const tenantRows = await sql.query(
        `SELECT id, workspace_name, plan_tier, trial_ends_at, subscription_status
         FROM tenants WHERE id = $1`,
        [tenantId]
      );
      const tenant = tenantRows[0] || { plan_tier: "Professional", trial_ends_at: null };
      const [docsRes, memRes] = await Promise.all([
        sql.query("SELECT COUNT(*)::int AS count FROM documents WHERE tenant_id = $1", [tenantId]),
        sql.query("SELECT COUNT(*)::int AS count FROM tenant_members WHERE tenant_id = $1", [tenantId]),
      ]);
      const docCount = Number(docsRes[0]?.count ?? 0);
      const memberCount = Number(memRes[0]?.count ?? 1);

      const state = SubscriptionService.computeState({
        rawPlanTier: tenant.plan_tier,
        docCount,
        memberCount,
        trialEndsAt: tenant.trial_ends_at,
      });

      return NextResponse.json({
        success: true,
        tenant_id: tenantId,
        workspace_name: tenant.workspace_name,
        ...state,
      });
    }

    if (cleanPath === "/v1/subscriptions/upgrade" && method === "POST") {
      await ensureTenantColumns(sql);
      const body = await request.json().catch(() => ({}));
      const requestedTier = normalizePlanTier(body.plan_tier);
      const limits = getTierLimits(requestedTier);

      await sql.query(
        `UPDATE tenants
         SET plan_tier = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [limits.name, tenantId]
      );

      return NextResponse.json({
        success: true,
        plan_tier: limits.name,
        message: `Workspace plan upgraded to ${limits.name} successfully`,
      });
    }

    if (cleanPath === "/v1/subscriptions/verify" && method === "POST") {
      await ensureTenantColumns(sql);
      const body = await request.json().catch(() => ({}));
      const reference = body.reference || `paystack_${Date.now()}`;
      const planTier = normalizePlanTier(body.plan_tier || "Professional");
      const limits = getTierLimits(planTier);
      const billingCycle = body.billing_cycle === "annually" ? "annually" : "monthly";
      const amount = billingCycle === "annually" ? limits.annualPriceNgn : limits.monthlyPriceNgn;

      await sql.query(
        `UPDATE tenants
         SET plan_tier = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [limits.name, tenantId]
      );

      const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await sql.query(
        `INSERT INTO invoices (invoice_number, tenant_id, client_name, amount_ngn, invoice_type, status, payout_ref, due_date, paid_at)
         VALUES ($1, $2, $3, $4, 'SUBSCRIPTION', 'SETTLED', $5, CURRENT_DATE, NOW())
         ON CONFLICT (invoice_number) DO NOTHING`,
        [invNum, tenantId, `${limits.name} Plan (${billingCycle})`, amount, reference]
      );

      return NextResponse.json({
        success: true,
        plan_tier: limits.name,
        invoice_number: invNum,
        amount_ngn: amount,
        message: `Subscription successfully activated on ${limits.name} plan`,
      });
    }

    // ==========================================
    // Onboarding & Classification
    // ==========================================
    if (cleanPath === "/v1/onboarding/classify" && method === "POST") {
      await ensureTenantColumns(sql);
      const body = await request.json();

      // 1. Resolve user ID: if unauthenticated, create user account with password or lookup
      let targetUserId = authUser?.id;
      const contactEmail = (body.contact_email || "").trim().toLowerCase();
      const contactName = (body.contact_name || "").trim();
      const password = body.password;
      const phone = body.phone || "";

      if (!targetUserId) {
        if (contactEmail) {
          const existing = await sql.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [contactEmail]);
          if (existing.length > 0) {
            targetUserId = existing[0].id;
          } else {
            const pwHash = password
              ? crypto.createHash("sha256").update(password + "compliancehub_regtech_salt").digest("hex")
              : "hashed_demo_pw";
            const created = await sql.query(
              `INSERT INTO users (email, password_hash, full_name, phone, title, avatar_url, system_role, is_email_verified)
               VALUES ($1, $2, $3, $4, 'Managing Director', '/character1.jpg', 'USER', true)
               RETURNING id, email, full_name, system_role`,
              [contactEmail, pwHash, contactName || body.business_name, phone]
            );
            targetUserId = created[0]?.id;
          }
        } else {
          targetUserId = demoUser.id;
        }
      }

      // 2. Insert Organisation
      const orgRows = await sql.query(
        `INSERT INTO organisations (legal_name, rc_number, org_type, industry, state_of_operation, employee_bracket)
         VALUES ($1, $2, 'BUSINESS', $3, $4, $5)
         RETURNING id`,
        [
          body.business_name,
          body.rc_number || "",
          body.industry || "",
          body.state || "Lagos",
          body.employee_count || "5-14",
        ]
      );
      const orgId = orgRows[0]?.id;
      const slug = `${slugify(body.business_name)}-${Date.now() % 10000}`;

      // 3. Dynamic readiness score calculation
      let score = 92;
      if (body.collects_personal_data) score -= 14;
      if (body.processes_payments) score -= 16;
      if (body.is_dnfbp) score -= 14;
      if (body.engages_vendors) score -= 6;
      if (body.operates_branches) score -= 4;
      const initialScore = Math.max(42, Math.min(94, score));

      // 4. Create Tenant with 14-day Professional Free Trial
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const tenantRows = await sql.query(
        `INSERT INTO tenants (organisation_id, workspace_name, slug, plan_tier, compliance_score, trial_ends_at, subscription_status)
         VALUES ($1, $2, $3, 'Trial', $4, $5, 'ACTIVE')
         RETURNING id`,
        [orgId, body.business_name, slug, initialScore, trialEndsAt]
      );
      const newTenantId = tenantRows[0]?.id;

      // 5. Link Tenant Member as Owner
      await sql.query(
        `INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
         VALUES ($1, $2, 'OWNER', true)
         ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'OWNER'`,
        [newTenantId, targetUserId]
      );

      // 6. Dynamic Seed Statutory Obligations based on Diagnostic Answers
      await sql.query(
        `INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
         VALUES
         ($1, 'Monthly TaxPro-MAX VAT Filing & NRS Remittance', 'FIRS / NRS', CURRENT_DATE + INTERVAL '18 days', 'PENDING', 50000, true),
         ($1, 'CAMA 2020 Annual Returns Preparation & Filing (Form CAC 19)', 'CAC', CURRENT_DATE + INTERVAL '150 days', 'PENDING', 25000, false)`,
        [newTenantId]
      );

      if (body.collects_personal_data) {
        await sql.query(
          `INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
           VALUES ($1, 'NDPA 2023 Statutory Privacy Audit Return & RoPA Registration', 'NDPC', CURRENT_DATE + INTERVAL '45 days', 'PENDING', 1000000, true)`,
          [newTenantId]
        );
      }

      if (body.is_dnfbp) {
        await sql.query(
          `INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
           VALUES ($1, 'SCUML AML/CFT Compliance Certification & Currency Transaction Reports', 'SCUML / EFCC', CURRENT_DATE + INTERVAL '30 days', 'PENDING', 500000, true)`,
          [newTenantId]
        );
      }

      // 7. Generate Signed HS256 JWT Token for immediate session activation
      const userEmail = contactEmail || authUser?.email || "owner@compliancehub.ng";
      const userName = contactName || authUser?.full_name || body.business_name;
      const token = await signJWT({
        user_id: targetUserId || "33333333-3333-3333-3333-333333333301",
        email: userEmail,
        full_name: userName,
        system_role: "USER",
        role: "BUSINESS",
        tenant_id: newTenantId,
      });

      const response = NextResponse.json(
        {
          success: true,
          token,
          user: {
            id: targetUserId,
            email: userEmail,
            name: userName,
            system_role: "USER",
            role: "BUSINESS",
            tenant_id: newTenantId,
          },
          tenant_id: newTenantId,
          organisation_id: orgId,
          workspace_name: body.business_name,
          compliance_score: initialScore,
          plan_tier: "Trial",
          trial_ends_at: trialEndsAt,
          message: "Workspace successfully provisioned with 14-day Professional Free Trial",
        },
        { status: 201 }
      );

      response.cookies.set("compliancehub_token", token, {
        path: "/",
        maxAge: 60 * 60 * 72,
        sameSite: "lax",
      });

      return response;
    }

    // ==========================================
    // Corporate Audit Diagnostic Engine
    // ==========================================
    if (cleanPath === "/v1/corporate-audit/evaluate" && method === "POST") {
      const body = await request.json();
      if (!body.company_name || !body.contact_email) {
        return NextResponse.json({ error: "Company name and contact email are required." }, { status: 400 });
      }

      // 1. Pillar Calculations
      const pillars: Record<string, any> = {};
      const infractions: any[] = [];
      const roadmap: any[] = [];
      let totalPenalty = 0;

      // CAC
      let cacScore = 20;
      let cacPenalty = 0;
      let cacStatus = "COMPLIANT";
      let cacNotice = "Annual returns and statutory filings are up to date under CAMA 2020.";

      if (body.cac_status === "overdue_1yr") {
        cacScore = 10;
        cacPenalty = 75000;
        cacStatus = "WARNING";
        cacNotice = "CAMA 2020 s.377: Form CAC 19 Annual Return overdue for past financial year.";
        infractions.push({
          authority: "CAC",
          title: "Overdue Annual Returns Filing (Form CAC 19)",
          statutory_ref: "CAMA 2020 s.377 & s.378",
          severity: "HIGH",
          penalty_ngn: 75000,
          description: "Failure to submit audited financial statements and annual return within 42 days of the AGM.",
          remedy: "File pending Form CAC 19 along with audited accounts to restore good standing and prevent status downgrade.",
        });
        roadmap.push({
          phase: "30-Day",
          authority: "CAC",
          title: "File Past Year Annual Return (Form CAC 19)",
          action: "Prepare and upload audited balance sheet or small-company financial statements on the CAC CRP portal.",
          statutory_ref: "CAMA 2020 s.377",
          impact: "Eliminates daily default penalty accumulation and maintains active corporate status.",
        });
      } else if (body.cac_status === "overdue_2_3yr") {
        cacScore = 4;
        cacPenalty = 225000;
        cacStatus = "CRITICAL";
        cacNotice = "Multi-year annual return default. Imminent risk of company classification as 'INACTIVE' on the CAC public register.";
        infractions.push({
          authority: "CAC",
          title: "Multi-Year CAMA 2020 Filing Default & Inactive Status Risk",
          statutory_ref: "CAMA 2020 s.377 & s.692",
          severity: "CRITICAL",
          penalty_ngn: 225000,
          description: "The CAC is actively striking off entities with >2 years of consecutive unfiled annual returns from the register of companies.",
          remedy: "Perform emergency regularization: submit back-year filings, updated PSC registers, and pay accumulated late surcharges.",
        });
        roadmap.push({
          phase: "30-Day",
          authority: "CAC",
          title: "Emergency CAC Post-Incorporation Regularization",
          action: "Engage an accredited CAC agent to file back-year returns and update the Register of Persons with Significant Control (PSC).",
          statutory_ref: "CAMA 2020 s.119 & s.377",
          impact: "Averts imminent corporate de-registration and commercial banking restrictions.",
        });
      } else if (body.cac_status === "never_filed") {
        cacScore = 0;
        cacPenalty = 350000;
        cacStatus = "CRITICAL";
        cacNotice = "Entity has accumulated total statutory filing default since incorporation date.";
        infractions.push({
          authority: "CAC",
          title: "Total Annual Return Default Since Incorporation",
          statutory_ref: "CAMA 2020 s.377, s.692",
          severity: "CRITICAL",
          penalty_ngn: 350000,
          description: "No post-incorporation statutory compliance evidence found. Commercial banks will freeze corporate accounts during periodic KYC refreshes.",
          remedy: "Immediate full historical filing package must be drafted and submitted through an accredited corporate secretary.",
        });
        roadmap.push({
          phase: "30-Day",
          authority: "CAC",
          title: "Historical CAC Backlog Filing Package",
          action: "Commission full corporate secretarial audit to file all outstanding returns from incorporation year.",
          statutory_ref: "CAMA 2020 s.377",
          impact: "Clears company record for public procurement, bank facilities, and institutional equity investments.",
        });
      }

      totalPenalty += cacPenalty;
      pillars["cac"] = {
        pillar_name: "Corporate Affairs (CAC)",
        authority: "CAC",
        score: cacScore * 5,
        status: cacStatus,
        penalty_ngn: cacPenalty,
        statutory_ref: "Companies and Allied Matters Act (CAMA 2020)",
        summary_notice: cacNotice,
      };

      // FIRS / Tax
      let taxScore = 20;
      let taxPenalty = 0;
      let taxStatus = "COMPLIANT";
      let taxNotice = "TaxPro-MAX TIN active, monthly VAT/WHT returns and Company Income Tax up to date.";

      if (body.tax_status === "irregular") {
        taxScore = 8;
        taxPenalty = 450000;
        taxStatus = "CRITICAL";
        taxNotice = "Irregular VAT or Withholding Tax filings under TaxPro-MAX and 2026 Tax Act rules.";
        infractions.push({
          authority: "FIRS / State IRS",
          title: "Default in Monthly TaxPro-MAX VAT / WHT Filings",
          statutory_ref: "VATA s.15 & Nigeria Tax Act 2025/2026",
          severity: "CRITICAL",
          penalty_ngn: 450000,
          description: "Monthly VAT default incurs ₦50,000 for the first month and ₦25,000 for each subsequent month of non-remittance, plus 10% penalty and statutory interest.",
          remedy: "Submit reconciliation schedules on TaxPro-MAX and remit unremitted WHT deductions to obtain modern Withholding Tax Credit Notes.",
        });
        roadmap.push({
          phase: "30-Day",
          authority: "FIRS / NRS",
          title: "TaxPro-MAX Monthly VAT & WHT Reconciliation",
          action: "Reconcile sales/invoices on TaxPro-MAX and remit outstanding VAT before the 21st statutory monthly cutoff.",
          statutory_ref: "VATA s.15 & CITA s.55",
          impact: "Halts automatic accumulation of statutory interest and avoids automated TaxPro-MAX system lockouts.",
        });
      } else if (body.tax_status === "not_registered") {
        taxScore = 0;
        taxPenalty = 1500000;
        taxStatus = "CRITICAL";
        taxNotice = "Entity is operating without an active TaxPro-MAX registration or Corporate Tax Clearance.";
        infractions.push({
          authority: "FIRS / NRS",
          title: "Unregistered Corporate Tax Entity (Missing TaxPro-MAX Login)",
          statutory_ref: "CITA s.55 & FIRS Establishment Act",
          severity: "CRITICAL",
          penalty_ngn: 1500000,
          description: "Operating a registered company in Nigeria without TaxPro-MAX registration subjects directors to administrative audits and retroactive back-tax assessments.",
          remedy: "Complete TaxPro-MAX corporate registration, link primary director NIN, and validate JTB Tax Identification Number.",
        });
        roadmap.push({
          phase: "30-Day",
          authority: "FIRS / NRS",
          title: "TaxPro-MAX Corporate Onboarding & TIN Validation",
          action: "Visit nearest FIRS Medium/Small Tax Office (MTO/STO) or onboard via TaxPro-MAX with Certificate of Incorporation.",
          statutory_ref: "CITA s.55",
          impact: "Enables lawful invoicing, government contract bidding, and prevents corporate bank account restriction.",
        });
      } else if (body.tax_status === "pending_audit") {
        taxScore = 5;
        taxPenalty = 2500000;
        taxStatus = "CRITICAL";
        taxNotice = "Company is facing an active FIRS/State IRS tax audit or jeopardy assessment notice.";
        infractions.push({
          authority: "FIRS / SIRS",
          title: "Active Tax Regulatory Audit & Disputed Assessment",
          statutory_ref: "FIRS Establishment Act s.26 & PITA s.58",
          severity: "HIGH",
          penalty_ngn: 2500000,
          description: "Pending notice of tax assessment will crystallize into an enforceable debt within 30 days unless formally objected to with supporting evidence.",
          remedy: "Retain an accredited ICAN/CITN tax practitioner to draft a formal Notice of Objection and prepare audit defense working papers.",
        });
        roadmap.push({
          phase: "30-Day",
          authority: "FIRS / SIRS",
          title: "Lodge Formal Notice of Objection to Tax Assessment",
          action: "Submit documented objection within statutory 30-day window with evidence of prior remittances and audited financials.",
          statutory_ref: "FIRS Act s.26",
          impact: "Stays enforcement action and prevents final and conclusive assessment status.",
        });
      }

      totalPenalty += taxPenalty;
      pillars["tax"] = {
        pillar_name: "Tax & Fiscal Remittances (FIRS / State IRS)",
        authority: "FIRS / NRS",
        score: taxScore * 5,
        status: taxStatus,
        penalty_ngn: taxPenalty,
        statutory_ref: "Companies Income Tax Act & Nigeria Tax Act 2025/2026",
        summary_notice: taxNotice,
      };

      // NDPC / Data Privacy
      let privacyScore = 20;
      let privacyPenalty = 0;
      let privacyStatus = "COMPLIANT";
      let privacyNotice = "Data protection compliance framework maintained under NDPA 2023.";

      const isDCMI = body.collects_personal_data && (body.estimated_data_subjects === "10k-100k" || body.estimated_data_subjects === "100k+" || body.processes_payments);

      if (body.collects_personal_data) {
        if (body.privacy_status === "no_framework") {
          if (isDCMI) {
            privacyScore = 0;
            privacyPenalty = 5000000;
            privacyStatus = "CRITICAL";
            privacyNotice = "Critical Default: Qualified as Data Controller of Major Importance (DCMI) without mandatory RoPA, DPO, or DPCO audit return.";
            infractions.push({
              authority: "NDPC",
              title: "Unregistered DCMI & Failure to File Statutory Annual DPCO Audit Return",
              statutory_ref: "NDPA 2023 s.32, s.44 & s.48",
              severity: "CRITICAL",
              penalty_ngn: 5000000,
              description: "Section 48 of the NDPA 2023 imposes statutory fines up to ₦10,000,000 or 2% of annual gross turnover on major controllers failing to file annual audit returns by March 15.",
              remedy: "Designate a Data Protection Officer (DPO), establish a Record of Processing Activities (RoPA), and retain a licensed DPCO to file the statutory audit.",
            });
            roadmap.push({
              phase: "30-Day",
              authority: "NDPC",
              title: "Designate DPO & Formalize Record of Processing Activities (RoPA)",
              action: "Map all consumer data flows, storage locations, lawful bases, and cross-border transfers into a formal RoPA register.",
              statutory_ref: "NDPA 2023 s.32 & s.44",
              impact: "Satisfies fundamental legal prerequisites for NDPC compliance.",
            });
            roadmap.push({
              phase: "60-Day",
              authority: "NDPC",
              title: "Commission Annual Statutory Audit via Licensed DPCO",
              action: "Retain an accredited Data Protection Compliance Organisation (DPCO) on HubExperts to conduct external audit and file with NDPC.",
              statutory_ref: "NDPA 2023 s.48",
              impact: "Protects entity from multi-million Naira enforcement penalties and public regulatory sanctions.",
            });
          } else {
            privacyScore = 6;
            privacyPenalty = 750000;
            privacyStatus = "WARNING";
            privacyNotice = "Personal data processed without published Privacy Notice, consent protocols, or data retention schedules.";
          }
        } else if (body.privacy_status === "internal_only") {
          if (isDCMI) {
            privacyScore = 10;
            privacyPenalty = 2500000;
            privacyStatus = "WARNING";
            privacyNotice = "Internal data privacy guidelines exist, but statutory external DPCO annual audit return has not been submitted to the NDPC.";
            infractions.push({
              authority: "NDPC",
              title: "Unfiled Statutory Annual DPCO Audit Return (DCMI Requirement)",
              statutory_ref: "NDPA 2023 s.48",
              severity: "HIGH",
              penalty_ngn: 2500000,
              description: "Internal privacy policies are insufficient for Data Controllers of Major Importance; statutory law mandates an external audit verified by a licensed DPCO.",
              remedy: "Submit evidence pack to a licensed DPCO for formal sign-off and filing before the statutory annual cutoff.",
            });
          } else {
            privacyScore = 16;
            privacyNotice = "Basic data privacy protocols in place for standard data controller.";
          }
        }
      } else {
        privacyStatus = "EXEMPT";
        privacyNotice = "Business indicates no collection or automated processing of third-party personal data.";
      }

      totalPenalty += privacyPenalty;
      pillars["ndpc"] = {
        pillar_name: "Data Protection & Privacy (NDPC)",
        authority: "NDPC",
        score: privacyScore * 5,
        status: privacyStatus,
        penalty_ngn: privacyPenalty,
        statutory_ref: "Nigeria Data Protection Act (NDPA 2023)",
        summary_notice: privacyNotice,
      };

      // SCUML / AML
      let scumlScore = 20;
      let scumlPenalty = 0;
      let scumlStatus = "COMPLIANT";
      let scumlNotice = "Anti-Money Laundering compliance maintained under MLA 2022.";

      if (body.is_dnfbp) {
        if (body.scuml_status === "not_registered") {
          scumlScore = 0;
          scumlPenalty = 5000000;
          scumlStatus = "CRITICAL";
          scumlNotice = "Critical Default: Designated Non-Financial Business or Profession (DNFBP) operating without mandatory SCUML Registration.";
          infractions.push({
            authority: "SCUML / NFIU",
            title: "Unregistered DNFBP Under Money Laundering Act 2022",
            statutory_ref: "MLA 2022 s.6, s.11 & s.17",
            severity: "CRITICAL",
            penalty_ngn: 5000000,
            description: "Operating a designated business without SCUML registration triggers immediate bank account restrictions (Post-No-Debit) and fines up to ₦25,000,000.",
            remedy: "Submit SCUML registration dossier, appoint a dedicated AML Compliance Officer, and adopt an AML/CFT manual.",
          });
          roadmap.push({
            phase: "30-Day",
            authority: "SCUML",
            title: "Apply for Official SCUML Registration Certificate",
            action: "Assemble CAC documentation, Tax Clearance Certificate, and professional certifications to submit via the SCUML portal.",
            statutory_ref: "MLA 2022 s.6",
            impact: "Protects corporate bank accounts from NFIU Post-No-Debit orders.",
          });
        } else if (body.scuml_status === "pending") {
          scumlScore = 10;
          scumlPenalty = 250000;
          scumlStatus = "WARNING";
          scumlNotice = "SCUML application pending review; operational AML policies must be formally adopted.";
        }
      } else {
        scumlStatus = "EXEMPT";
        scumlNotice = "Entity operations do not fall under statutory DNFBP classifications under MLA 2022.";
      }

      totalPenalty += scumlPenalty;
      pillars["scuml"] = {
        pillar_name: "Anti-Money Laundering & CFT (SCUML / NFIU)",
        authority: "SCUML",
        score: scumlScore * 5,
        status: scumlStatus,
        penalty_ngn: scumlPenalty,
        statutory_ref: "Money Laundering (Prevention and Prohibition) Act 2022",
        summary_notice: scumlNotice,
      };

      // Labor / PENCOM / ITF
      let laborScore = 20;
      let laborPenalty = 0;
      let laborStatus = "COMPLIANT";
      let laborNotice = "Employee pensions, ITF, and statutory workplace insurance up to date.";

      const isMicro = body.employee_bracket === "1-4";
      if (!isMicro) {
        if (body.pension_status === "not_enrolled") {
          laborScore = 2;
          laborPenalty = 1800000;
          laborStatus = "CRITICAL";
          laborNotice = "Failure to establish mandatory Contributory Pension Scheme (CPS), 1% ITF payroll levy, and NSITF workplace compensation.";
          infractions.push({
            authority: "PENCOM / ITF / NSITF",
            title: "Unenrolled Contributory Pension Scheme & Unremitted Payroll Levies",
            statutory_ref: "Pension Reform Act 2014 s.11 & ITF Act Cap I9",
            severity: "CRITICAL",
            penalty_ngn: 1800000,
            description: "Employers with 5+ staff must remit 10% employer + 8% employee pension monthly, plus 1% annual payroll contribution to ITF.",
            remedy: "Register corporate code with licensed PFAs, calculate back contributions, and secure annual PENCOM and ITF Certificates of Clearance.",
          });
          roadmap.push({
            phase: "30-Day",
            authority: "PENCOM",
            title: "Set Up Contributory Pension Scheme with Licensed PFAs",
            action: "Collect RSA PINs from all eligible employees and execute employer contribution agreements with accredited Pension Fund Administrators.",
            statutory_ref: "PRA 2014 s.11",
            impact: "Stops the 2% compound monthly surcharge on unpaid pension obligations.",
          });
        } else if (body.pension_status === "pending_remittance") {
          laborScore = 9;
          laborPenalty = 650000;
          laborStatus = "WARNING";
          laborNotice = "PFA accounts set up, but monthly remittances or annual clearance certificates are currently in arrears.";
        }
      } else {
        laborStatus = "EXEMPT";
        laborNotice = "Micro-enterprise (1-4 staff) exempt from mandatory Contributory Pension Scheme and 1% ITF levy.";
      }

      totalPenalty += laborPenalty;
      pillars["labor"] = {
        pillar_name: "Labor, Pension & Social Security (PENCOM/ITF/NSITF)",
        authority: "PENCOM / ITF",
        score: laborScore * 5,
        status: laborStatus,
        penalty_ngn: laborPenalty,
        statutory_ref: "Pension Reform Act 2014 & Industrial Training Fund Act",
        summary_notice: laborNotice,
      };

      // Governance & Sectoral
      const governanceScore = body.employee_bracket === "50-249" || body.employee_bracket === "250+" ? 15 : 20;
      pillars["governance"] = {
        pillar_name: "Sectoral Licensing & Governance (NCCG / Regulators)",
        authority: "FRCN / Sectoral",
        score: governanceScore * 5,
        status: "COMPLIANT",
        penalty_ngn: 0,
        statutory_ref: "Nigerian Code of Corporate Governance 2018",
        summary_notice: "Corporate structure complies with Nigerian Code of Corporate Governance (NCCG) guidelines.",
      };

      // Calculate Weighted Health Index
      let weightedScore = cacScore + taxScore + privacyScore + scumlScore + laborScore;
      if (weightedScore > 100) weightedScore = 100;
      if (weightedScore < 10) weightedScore = 10;

      let riskLevel = "MODERATE HEALTH";
      if (weightedScore < 50) {
        riskLevel = "CRITICAL REGULATORY EXPOSURE";
      } else if (weightedScore < 75) {
        riskLevel = "SUBSTANTIAL COMPLIANCE DEFICIT";
      } else if (weightedScore >= 90) {
        riskLevel = "STATUTORY EXCELLENCE";
      }

      const reportToken = `audit-${crypto.randomBytes(8).toString("hex")}`;
      const reportURL = `https://compliancehub.ng/corporate-audit/report/${reportToken}`;
      const claimURL = `https://compliancehub.ng/corporate-audit/report/${reportToken}?claim=1`;

      // Persist to Neon DB
      try {
        await sql.query(
          `INSERT INTO corporate_audits (
            report_token, company_name, rc_number, entity_type, incorporation_year,
            state_of_operation, industry_sector, industry_subcategory, employee_bracket,
            turnover_bracket, operates_branches, has_foreign_ownership,
            collects_personal_data, estimated_data_subjects, processes_payments, is_dnfbp,
            active_vendor_count, cac_status, tax_status, pension_status, privacy_status,
            scuml_status, compliance_score, risk_level, total_penalty_exposure_ngn,
            pillar_breakdown, infractions, recommendations,
            contact_name, contact_email, contact_phone, contact_title, service_preference
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12,
            $13, $14, $15, $16,
            $17, $18, $19, $20, $21,
            $22, $23, $24, $25,
            $26, $27, $28,
            $29, $30, $31, $32, $33
          )`,
          [
            reportToken,
            body.company_name,
            body.rc_number || "",
            body.entity_type || "LTD",
            body.incorporation_year || 2020,
            body.state_of_operation || "Lagos",
            body.industry_sector || "ICT & Software",
            body.industry_subcategory || "",
            body.employee_bracket || "5-14",
            body.turnover_bracket || "25m-100m",
            Boolean(body.operates_branches),
            Boolean(body.has_foreign_ownership),
            Boolean(body.collects_personal_data),
            body.estimated_data_subjects || "<1k",
            Boolean(body.processes_payments),
            Boolean(body.is_dnfbp),
            Number(body.active_vendor_count || 0),
            body.cac_status || "up_to_date",
            body.tax_status || "active_cleared",
            body.pension_status || "active_pfa",
            body.privacy_status || "internal_only",
            body.scuml_status || "not_applicable",
            weightedScore,
            riskLevel,
            totalPenalty,
            JSON.stringify(pillars),
            JSON.stringify(infractions),
            JSON.stringify(roadmap),
            body.contact_name || "Managing Director",
            body.contact_email,
            body.contact_phone || "",
            body.contact_title || "Executive Director",
            body.service_preference || "hybrid",
          ]
        );
      } catch (dbErr) {
        console.warn("Notice: Audit record persistence fallback:", dbErr);
      }

      return NextResponse.json(
        {
          report_token: reportToken,
          company_name: body.company_name,
          rc_number: body.rc_number,
          compliance_score: weightedScore,
          risk_level: riskLevel,
          total_penalty_exposure: totalPenalty,
          pillars,
          infractions,
          roadmap,
          contact_name: body.contact_name,
          contact_email: body.contact_email,
          report_url: reportURL,
          claim_url: claimURL,
          created_at: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // GET /v1/corporate-audit/report/:token
    if (cleanPath.startsWith("/v1/corporate-audit/report/") && method === "GET") {
      const token = cleanPath.replace("/v1/corporate-audit/report/", "").trim();
      const rows = await sql.query(
        `SELECT id, company_name, rc_number, compliance_score, risk_level,
                total_penalty_exposure_ngn::float8 AS total_penalty_exposure,
                pillar_breakdown, infractions, recommendations,
                contact_name, contact_email, created_at
         FROM corporate_audits
         WHERE report_token = $1`,
        [token]
      );

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "Audit report not found" }, { status: 404 });
      }

      const r = rows[0];
      return NextResponse.json({
        id: r.id,
        report_token: token,
        company_name: r.company_name,
        rc_number: r.rc_number,
        compliance_score: r.compliance_score,
        risk_level: r.risk_level,
        total_penalty_exposure: r.total_penalty_exposure,
        pillars: typeof r.pillar_breakdown === "string" ? JSON.parse(r.pillar_breakdown) : r.pillar_breakdown,
        infractions: typeof r.infractions === "string" ? JSON.parse(r.infractions) : r.infractions,
        roadmap: typeof r.recommendations === "string" ? JSON.parse(r.recommendations) : r.recommendations,
        contact_name: r.contact_name,
        contact_email: r.contact_email,
        report_url: `https://compliancehub.ng/corporate-audit/report/${token}`,
        claim_url: `https://compliancehub.ng/corporate-audit/report/${token}?claim=1`,
        created_at: r.created_at,
      });
    }

    // POST /v1/corporate-audit/claim
    if (cleanPath === "/v1/corporate-audit/claim" && method === "POST") {
      const body = await request.json();
      if (!body.report_token || !body.password) {
        return NextResponse.json({ error: "Report token and password are required" }, { status: 400 });
      }

      const auditRows = await sql.query(
        `SELECT id, company_name, rc_number, state_of_operation, industry_sector,
                employee_bracket, contact_email, contact_name, compliance_score, infractions
         FROM corporate_audits
         WHERE report_token = $1`,
        [body.report_token]
      );

      if (!auditRows || auditRows.length === 0) {
        return NextResponse.json({ error: "Corporate audit not found" }, { status: 404 });
      }

      const audit = auditRows[0];
      const email = (body.email || audit.contact_email).toLowerCase().trim();
      const fullName = body.full_name || audit.contact_name;

      // Create Organisation
      const orgRows = await sql.query(
        `INSERT INTO organisations (legal_name, rc_number, org_type, industry, state_of_operation, employee_bracket)
         VALUES ($1, $2, 'BUSINESS', $3, $4, $5)
         RETURNING id`,
        [audit.company_name, audit.rc_number || "", audit.industry_sector || "", audit.state_of_operation || "Lagos", audit.employee_bracket || "5-14"]
      );
      const orgId = orgRows[0]?.id;
      const slug = `${slugify(audit.company_name)}-${Date.now() % 10000}`;

      // Create Tenant
      const tenantRows = await sql.query(
        `INSERT INTO tenants (organisation_id, workspace_name, slug, plan_tier, compliance_score)
         VALUES ($1, $2, $3, 'Business', $4)
         RETURNING id`,
        [orgId, audit.company_name, slug, audit.compliance_score]
      );
      const newTenantId = tenantRows[0]?.id;

      // Link User as Owner
      await sql.query(
        `INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
         VALUES ($1, $2, 'OWNER', true)
         ON CONFLICT (tenant_id, user_id) DO NOTHING`,
        [newTenantId, demoUser.id]
      );

      // Seed obligations from audit infractions
      const infractionsList = typeof audit.infractions === "string" ? JSON.parse(audit.infractions) : (audit.infractions || []);
      for (let i = 0; i < infractionsList.length; i++) {
        const inf = infractionsList[i];
        await sql.query(
          `INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
           VALUES ($1, $2, $3, CURRENT_DATE + (INTERVAL '14 days' * $4), 'PENDING', $5, true)`,
          [newTenantId, inf.title, inf.authority, i + 1, inf.penalty_ngn || 50000]
        );
      }

      // Default VAT obligation
      await sql.query(
        `INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
         VALUES ($1, 'Monthly TaxPro-MAX VAT Filing (2026 Transition Window)', 'FIRS / NRS', CURRENT_DATE + INTERVAL '18 days', 'PENDING', 50000, true)
         ON CONFLICT DO NOTHING`,
        [newTenantId]
      );

      // Link audit to tenant
      await sql.query(
        `UPDATE corporate_audits
         SET tenant_id = $1, claimed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [newTenantId, audit.id]
      );

      return NextResponse.json(
        {
          success: true,
          token: "demo-token-business",
          tenant_id: newTenantId,
          workspace_slug: slug,
          company_name: audit.company_name,
          user: {
            id: demoUser.id,
            email: email,
            full_name: fullName,
            role: "BUSINESS",
          },
          message: "HubBusiness workspace provisioned successfully with seeded statutory obligations.",
        },
        { status: 201 }
      );
    }

    // ==========================================
    // HubCalendar: Statutory Deadlines
    // ==========================================
    if (cleanPath === "/v1/calendar/obligations") {
      if (method === "GET") {
        const authority = searchParams.get("authority") || "";
        const status = searchParams.get("status") || "";
        let query = `
          SELECT id, tenant_id, obligation_id, title, authority,
                 TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
                 status, estimated_penalty_ngn::float8 AS estimated_penalty_ngn,
                 assigned_to, responsible_expert_id, is_urgent,
                 completed_at, created_at
          FROM tenant_obligations
          WHERE tenant_id = $1
        `;
        const args: any[] = [tenantId];
        if (authority && authority !== "All") {
          args.push(authority);
          query += ` AND authority = $${args.length}`;
        }
        if (status && status !== "All") {
          args.push(status);
          query += ` AND status = $${args.length}`;
        }
        query += " ORDER BY is_urgent DESC, due_date ASC";
        const rows = await sql.query(query, args);
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const rows = await sql.query(
          `INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
           VALUES ($1, $2, $3, $4, 'PENDING', $5, $6)
           RETURNING id`,
          [
            tenantId,
            body.title,
            body.authority,
            body.due_date,
            Number(body.estimated_penalty_ngn || 0),
            Boolean(body.is_urgent),
          ]
        );
        return NextResponse.json(
          { id: rows[0]?.id, message: "Obligation scheduled successfully" },
          { status: 201 }
        );
      }
    }

    if (
      cleanPath.startsWith("/v1/calendar/obligations/") &&
      cleanPath.endsWith("/complete") &&
      method === "POST"
    ) {
      const parts = cleanPath.split("/").filter(Boolean);
      const obligationId = parts[3];
      await sql.query(
        `UPDATE tenant_obligations
         SET status = 'FILED', completed_at = NOW(), is_urgent = false
         WHERE id = $1 AND tenant_id = $2`,
        [obligationId, tenantId]
      );
      return NextResponse.json({
        success: true,
        message: "Obligation marked as completed",
      });
    }

    // ==========================================
    // HubDocs: Cloudinary Evidence Vault
    // ==========================================
    if (cleanPath === "/v1/documents/upload-signature" && method === "POST") {
      // 1. Quota Hard-Block Check
      const [tenantRows, countRows] = await Promise.all([
        sql.query("SELECT plan_tier, trial_ends_at FROM tenants WHERE id = $1", [tenantId]),
        sql.query("SELECT COUNT(*)::int AS count FROM documents WHERE tenant_id = $1", [tenantId]),
      ]);
      const currentTier = tenantRows[0]?.plan_tier || "Starter";
      const docCount = Number(countRows[0]?.count ?? 0);
      const quotaCheck = SubscriptionService.evaluateDocumentUpload(docCount, currentTier);
      if (quotaCheck.blocked) {
        return NextResponse.json(
          {
            error: quotaCheck.error,
            code: quotaCheck.code,
            limit: quotaCheck.limit,
            current: quotaCheck.current,
          },
          { status: 402 }
        );
      }

      const body = await request.json().catch(() => ({}));
      const cleanFileName = String(body.file_name || "document").replace(/\s+/g, "_");
      const timestamp = Math.floor(Date.now() / 1000);
      const publicId = `${cleanFileName}_${timestamp}`;
      const folder = `compliancehub/tenants/${tenantId}`;

      const cldUrl = process.env.CLOUDINARY_URL || "cloudinary://843881634745644:f10bR34lPm4mYEbtrcIhB0eIcLQ@yugcjpau";
      const parsed = new URL(cldUrl);
      const apiKey = parsed.username || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "843881634745644";
      const apiSecret = parsed.password || "f10bR34lPm4mYEbtrcIhB0eIcLQ";
      const cloudName = parsed.hostname || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "yugcjpau";

      const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(toSign).digest("hex");

      return NextResponse.json({
        signature,
        timestamp,
        api_key: apiKey,
        cloud_name: cloudName,
        folder,
        public_id: publicId,
      });
    }

    if (cleanPath === "/v1/documents") {
      if (method === "GET") {
        const category = searchParams.get("category") || "";
        let query = `
          SELECT d.id, d.tenant_id, d.name, d.category, d.cloudinary_public_id, d.cloudinary_secure_url,
                 d.file_format, d.file_size_bytes::int8 AS file_size_bytes, d.version, d.verification_status,
                 TO_CHAR(d.expiry_date, 'YYYY-MM-DD') AS expiry_date, d.is_expiring_soon, d.uploaded_by,
                 COALESCE(u.full_name, 'Workspace Admin') AS uploaded_by_name,
                 d.verified_by, d.verified_at, d.created_at, d.updated_at
          FROM documents d
          LEFT JOIN users u ON d.uploaded_by = u.id
          WHERE d.tenant_id = $1
        `;
        const args: any[] = [tenantId];
        if (category && category !== "All") {
          args.push(category);
          query += ` AND d.category = $2`;
        }
        query += " ORDER BY d.created_at DESC";
        const rows = await sql.query(query, args);
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        // Quota Hard-Block Check
        const [tenantRows, countRows] = await Promise.all([
          sql.query("SELECT plan_tier, trial_ends_at FROM tenants WHERE id = $1", [tenantId]),
          sql.query("SELECT COUNT(*)::int AS count FROM documents WHERE tenant_id = $1", [tenantId]),
        ]);
        const currentTier = tenantRows[0]?.plan_tier || "Starter";
        const docCount = Number(countRows[0]?.count ?? 0);
        const quotaCheck = SubscriptionService.evaluateDocumentUpload(docCount, currentTier);
        if (quotaCheck.blocked) {
          return NextResponse.json(
            {
              error: quotaCheck.error,
              code: quotaCheck.code,
              limit: quotaCheck.limit,
              current: quotaCheck.current,
            },
            { status: 402 }
          );
        }

        const body = await request.json();
        const version = body.version || "v1.0";
        const fileFormat = body.file_format || "pdf";
        let rows;
        if (body.expiry_date) {
          rows = await sql.query(
            `INSERT INTO documents (
               tenant_id, name, category, cloudinary_public_id, cloudinary_secure_url,
               file_format, file_size_bytes, version, verification_status, expiry_date, uploaded_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'VERIFIED', $9, $10)
             RETURNING id`,
            [
              tenantId,
              body.name,
              body.category,
              body.cloudinary_public_id,
              body.cloudinary_secure_url,
              fileFormat,
              Number(body.file_size_bytes || 0),
              version,
              body.expiry_date,
              demoUser.id,
            ]
          );
        } else {
          rows = await sql.query(
            `INSERT INTO documents (
               tenant_id, name, category, cloudinary_public_id, cloudinary_secure_url,
               file_format, file_size_bytes, version, verification_status, uploaded_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'VERIFIED', $9)
             RETURNING id`,
            [
              tenantId,
              body.name,
              body.category,
              body.cloudinary_public_id,
              body.cloudinary_secure_url,
              fileFormat,
              Number(body.file_size_bytes || 0),
              version,
              demoUser.id,
            ]
          );
        }
        return NextResponse.json(
          { id: rows[0]?.id, message: "Document registered and secured in Cloudinary evidence vault" },
          { status: 201 }
        );
      }
    }

    if (cleanPath.startsWith("/v1/documents/") && method === "DELETE") {
      const parts = cleanPath.split("/").filter(Boolean);
      const docId = parts[2];
      await sql.query("DELETE FROM documents WHERE id = $1 AND tenant_id = $2", [docId, tenantId]);
      return NextResponse.json({ success: true });
    }

    // ==========================================
    // Practice & Marketplace
    // ==========================================
    if (cleanPath === "/v1/professionals" && method === "GET") {
      const spec = searchParams.get("specialisation") || "";
      const specKey = (!spec || spec === "All") ? "all" : spec.toLowerCase();
      const cacheKey = getGlobalKey("experts", "profile", specKey);

      const cached = await getCached<any[]>(cacheKey);
      if (cached && cached.length > 0) {
        return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
      }

      let query = `
        SELECT p.id, p.user_id, p.firm_name, p.qualification, p.years_experience,
               p.specialisations, p.hourly_rate_ngn::float8 AS hourly_rate_ngn,
               p.monthly_retainer_ngn::float8 AS monthly_retainer_ngn, p.bio,
               p.verification_status, p.active_clients_count,
               u.full_name, u.email, COALESCE(u.avatar_url, '/character1.jpg') AS avatar_url, p.created_at
        FROM professional_profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.verification_status = 'VERIFIED'
      `;
      const args: any[] = [];
      if (spec && spec !== "All") {
        args.push(spec);
        query += ` AND $1 = ANY(p.specialisations)`;
      }
      query += " ORDER BY p.active_clients_count DESC, p.years_experience DESC";
      const rows = await sql.query(query, args);

      if (rows && rows.length > 0) {
        await setCached(cacheKey, rows, 1800); // 30 minutes
      }

      return NextResponse.json(rows || [], { headers: { "X-Cache": "MISS" } });
    }

    if (cleanPath === "/v1/practice/clients") {
      if (method === "GET") {
        const profRows = await sql.query(
          "SELECT id FROM professional_profiles WHERE user_id = $1",
          [demoUser.id]
        );
        const profId = profRows[0]?.id || "66666666-6666-6666-6666-666666666601";
        const rows = await sql.query(
          `SELECT e.id AS engagement_id, e.tenant_id, t.workspace_name AS company_name,
                  COALESCE(o.rc_number, 'RC-PENDING') AS rc_number,
                  COALESCE(o.industry, 'General Commerce') AS industry,
                  t.compliance_score, e.engagement_type, e.scope_summary,
                  e.monthly_fee_ngn::float8 AS monthly_fee_ngn,
                  e.status, TO_CHAR(e.start_date, 'YYYY-MM-DD') AS start_date,
                  (SELECT COUNT(*)::int FROM tenant_obligations to2 WHERE to2.tenant_id = t.id AND to2.is_urgent = true AND to2.status = 'PENDING') AS urgent_count
           FROM engagements e
           JOIN tenants t ON e.tenant_id = t.id
           JOIN organisations o ON t.organisation_id = o.id
           WHERE e.professional_id = $1 AND e.status = 'ACTIVE'
           ORDER BY t.compliance_score ASC`,
          [profId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const rc = body.rc_number || `RC-${Math.floor(Date.now() / 1000) % 1000000 + 1000000}`;
        const industry = body.industry || "Financial Services";
        const fee = Number(body.monthly_fee || 250000);

        const orgRows = await sql.query(
          `INSERT INTO organisations (legal_name, trade_name, rc_number, org_type, industry, state_of_operation, employee_bracket)
           VALUES ($1, $1, $2, 'BUSINESS', $3, 'Lagos State', '51-200')
           RETURNING id`,
          [body.legal_name, rc, industry]
        );
        const orgId = orgRows[0]?.id;
        const slug = `${slugify(body.legal_name)}-${Date.now() % 1000}`;
        const tenantRows = await sql.query(
          `INSERT INTO tenants (organisation_id, workspace_name, slug, plan_tier, compliance_score, is_active)
           VALUES ($1, $2, $3, 'Professional', 75, true)
           RETURNING id`,
          [orgId, body.legal_name, slug]
        );
        const newTenantId = tenantRows[0]?.id;
        const profRows = await sql.query(
          "SELECT id FROM professional_profiles WHERE user_id = '33333333-3333-3333-3333-333333333303'"
        );
        const profId = profRows[0]?.id || "66666666-6666-6666-6666-666666666602";
        await sql.query(
          `INSERT INTO engagements (tenant_id, professional_id, engagement_type, scope_summary, monthly_fee_ngn, start_date, status)
           VALUES ($1, $2, 'FULL_RETAINER', 'Comprehensive statutory compliance oversight across CAMA 2020, NDPA 2023, and FIRS TaxPro-MAX.', $3, CURRENT_DATE, 'ACTIVE')`,
          [newTenantId, profId, fee]
        );
        return NextResponse.json(
          {
            success: true,
            tenant_id: newTenantId,
            org_id: orgId,
            client_name: body.legal_name,
            message: "Client workspace created and engagement linked successfully",
          },
          { status: 201 }
        );
      }
    }

    if (cleanPath === "/v1/practice/tasks") {
      if (method === "GET") {
        const profRows = await sql.query(
          "SELECT id FROM professional_profiles WHERE user_id = $1",
          [demoUser.id]
        );
        const profId = profRows[0]?.id || "66666666-6666-6666-6666-666666666601";
        const rows = await sql.query(
          `SELECT to2.id, to2.tenant_id, t.workspace_name AS client_name, to2.title, to2.authority,
                  TO_CHAR(to2.due_date, 'YYYY-MM-DD') AS due_date, to2.status, to2.is_urgent,
                  to2.estimated_penalty_ngn::float8 AS estimated_penalty_ngn
           FROM tenant_obligations to2
           JOIN engagements e ON to2.tenant_id = e.tenant_id
           JOIN tenants t ON e.tenant_id = t.id
           WHERE e.professional_id = $1 AND e.status = 'ACTIVE' AND to2.status = 'PENDING'
           ORDER BY to2.is_urgent DESC, to2.due_date ASC
           LIMIT 20`,
          [profId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const auth = body.authority || "Statutory Filing";
        const dueDate = body.due_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
        const rows = await sql.query(
          `INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, is_urgent, estimated_penalty_ngn)
           VALUES ($1, $2, $3, $4::date, 'PENDING', $5, 50000.00)
           RETURNING id`,
          [body.tenant_id, body.title, auth, dueDate, Boolean(body.is_urgent)]
        );
        return NextResponse.json(
          { id: rows[0]?.id, success: true, message: "Task lodged in client workspace" },
          { status: 201 }
        );
      }
    }

    if (cleanPath.startsWith("/v1/practice/tasks/") && ["PATCH", "PUT", "POST"].includes(method)) {
      const parts = cleanPath.split("/").filter(Boolean);
      const taskId = parts[3];
      const body = await request.json().catch(() => ({}));
      const status = body.status || "FILED";
      await sql.query(
        `UPDATE tenant_obligations SET status = $1, is_urgent = false, updated_at = NOW() WHERE id = $2`,
        [status, taskId]
      );
      return NextResponse.json({ success: true, message: "Task updated successfully" });
    }

    if (cleanPath === "/v1/practice/team") {
      if (method === "GET") {
        const rows = await sql.query(`
          SELECT p.id, u.full_name AS name, COALESCE(u.avatar_url, '/character1.jpg') AS avatar,
                 COALESCE(p.firm_name, 'Senior Compliance Officer') AS role,
                 p.active_clients_count AS assigned_clients_count,
                 COALESCE(p.qualification, 'Regulatory Specialist') AS qual,
                 p.specialisations
          FROM professional_profiles p
          JOIN users u ON p.user_id = u.id
          WHERE p.verification_status = 'VERIFIED'
          ORDER BY p.active_clients_count DESC
        `);
        const team = (rows || []).map((r: any) => {
          const count = Number(r.assigned_clients_count || 0);
          return {
            id: r.id,
            name: r.name,
            avatar: r.avatar,
            role: r.role,
            assigned_clients_count: count,
            speciality: Array.isArray(r.specialisations) && r.specialisations.length > 0 ? r.specialisations[0] : r.qual,
            utilisation: `${65 + ((count * 6) % 35)}%`,
          };
        });
        return NextResponse.json(team);
      }

      if (method === "POST") {
        const body = await request.json();
        const existing = await sql.query("SELECT id FROM users WHERE email = $1", [body.email]);
        let userId = existing[0]?.id;
        if (!userId) {
          const created = await sql.query(
            `INSERT INTO users (email, password_hash, full_name, title, avatar_url, system_role, is_email_verified)
             VALUES ($1, 'hashed_demo_pw', $2, $3, '/character2.jpg', 'EXPERT', true)
             RETURNING id`,
            [body.email, body.full_name, body.role || "Compliance Associate"]
          );
          userId = created[0]?.id;
        }
        const spec = body.specialisation || "CAMA 2020 & NDPA 2023";
        const rate = Number(body.hourly_rate || 25000);
        const profRows = await sql.query(
          `INSERT INTO professional_profiles (user_id, firm_name, qualification, years_experience, specialisations, hourly_rate_ngn, monthly_retainer_ngn, bio, verification_status, active_clients_count)
           VALUES ($1, 'Apex Compliance Advisory Partners Ltd', 'BL, CDPO', 5, ARRAY[$2::text], $3, 200000.00, 'Associate Compliance Practitioner at Apex Advisory', 'VERIFIED', 2)
           ON CONFLICT (user_id) DO UPDATE SET specialisations = ARRAY[$2::text]
           RETURNING id`,
          [userId, spec, rate]
        );
        return NextResponse.json(
          {
            success: true,
            user_id: userId,
            professional_id: profRows[0]?.id,
            message: "Associate onboarded to Apex Advisory Agency",
          },
          { status: 201 }
        );
      }
    }

    if (cleanPath === "/v1/engagements" && method === "GET") {
      const rows = await sql.query(
        `SELECT e.id, e.tenant_id, e.professional_id, e.engagement_type,
                e.scope_summary, e.monthly_fee_ngn::float8 AS monthly_fee_ngn,
                TO_CHAR(e.start_date, 'YYYY-MM-DD') AS start_date,
                TO_CHAR(e.end_date, 'YYYY-MM-DD') AS end_date, e.status,
                u.full_name AS professional_name, COALESCE(u.avatar_url, '/character1.jpg') AS avatar_url,
                COALESCE(p.firm_name, 'Independent Advisory') AS firm_name,
                COALESCE(p.qualification, 'CAMS') AS qualification,
                p.specialisations
         FROM engagements e
         JOIN professional_profiles p ON e.professional_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE e.tenant_id = $1
         ORDER BY e.created_at DESC`,
        [tenantId]
      );
      return NextResponse.json(rows || []);
    }

    if (
      cleanPath.startsWith("/v1/engagements/") &&
      cleanPath.endsWith("/revoke") &&
      method === "POST"
    ) {
      const parts = cleanPath.split("/").filter(Boolean);
      const engagementId = parts[2];
      await sql.query(
        `UPDATE engagements SET status = 'TERMINATED', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
        [engagementId, tenantId]
      );
      return NextResponse.json({
        success: true,
        message: "Professional access revoked immediately across all tenant systems",
      });
    }

    // ==========================================
    // Activity Logs & Tenant Members
    // ==========================================
    if (cleanPath === "/v1/activity-logs") {
      if (method === "GET") {
        const rows = await sql.query(
          `SELECT id, tenant_id, user_id, actor_name, actor_role, action_type, details, ip_address, created_at
           FROM activity_logs
           WHERE tenant_id = $1 OR tenant_id IS NULL
           ORDER BY created_at DESC
           LIMIT 50`,
          [tenantId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const rows = await sql.query(
          `INSERT INTO activity_logs (tenant_id, actor_name, actor_role, action_type, details, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING id, tenant_id, user_id, actor_name, actor_role, action_type, details, ip_address, created_at`,
          [
            tenantId,
            body.actor_name || "Compliance Operator",
            body.actor_role || "Officer",
            body.action_type,
            body.details,
          ]
        );
        return NextResponse.json(rows[0] || {}, { status: 201 });
      }
    }

    if (cleanPath === "/v1/tenant-members") {
      if (method === "GET") {
        const rows = await sql.query(
          `SELECT tm.id, tm.tenant_id, tm.user_id, tm.role, tm.is_primary,
                  u.full_name, u.email, u.phone, u.title, u.avatar_url, tm.created_at
           FROM tenant_members tm
           JOIN users u ON tm.user_id = u.id
           WHERE tm.tenant_id = $1
           ORDER BY tm.is_primary DESC, tm.created_at ASC`,
          [tenantId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        // Seat Quota Hard-Block Check
        const [tenantRows, memberCountRows] = await Promise.all([
          sql.query("SELECT plan_tier, trial_ends_at FROM tenants WHERE id = $1", [tenantId]),
          sql.query("SELECT COUNT(*)::int AS count FROM tenant_members WHERE tenant_id = $1", [tenantId]),
        ]);
        const currentTier = tenantRows[0]?.plan_tier || "Starter";
        const memberCount = Number(memberCountRows[0]?.count ?? 1);
        const quotaCheck = SubscriptionService.evaluateSeatInvite(memberCount, currentTier);
        if (quotaCheck.blocked) {
          return NextResponse.json(
            {
              error: quotaCheck.error,
              code: quotaCheck.code,
              limit: quotaCheck.limit,
              current: quotaCheck.current,
            },
            { status: 402 }
          );
        }

        const body = await request.json();
        const role = body.role || "MEMBER";
        const existing = await sql.query("SELECT id FROM users WHERE email = $1", [body.email]);
        let userId = existing[0]?.id;
        if (!userId) {
          const created = await sql.query(
            `INSERT INTO users (email, password_hash, full_name, title, avatar_url, system_role, is_email_verified)
             VALUES ($1, 'hashed_demo_pw', $2, $3, '/character1.jpg', 'USER', true)
             RETURNING id`,
            [body.email, body.full_name, body.title || "Compliance Officer"]
          );
          userId = created[0]?.id;
        }
        const memberRows = await sql.query(
          `INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
           VALUES ($1, $2, $3, false)
           ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role
           RETURNING id`,
          [tenantId, userId, role]
        );
        return NextResponse.json(
          {
            success: true,
            member_id: memberRows[0]?.id,
            user_id: userId,
            email: body.email,
            role,
          },
          { status: 201 }
        );
      }
    }

    // ==========================================
    // Commercial & Invoices & Reports
    // ==========================================
    if (cleanPath === "/v1/invoices") {
      if (method === "GET") {
        const rows = await sql.query(
          `SELECT id, invoice_number, tenant_id, client_name, amount_ngn::float8 AS amount_ngn,
                  invoice_type, status, payout_ref, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
                  paid_at, created_at
           FROM invoices
           WHERE tenant_id = $1 OR tenant_id IS NULL
           ORDER BY created_at DESC
           LIMIT 50`,
          [tenantId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const dueDate = body.due_date || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        const rows = await sql.query(
          `INSERT INTO invoices (invoice_number, tenant_id, client_name, amount_ngn, invoice_type, status, due_date)
           VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
           RETURNING id`,
          [invNum, tenantId, body.client_name, Number(body.amount_ngn), body.invoice_type || "RETAINER", dueDate]
        );
        return NextResponse.json(
          {
            id: rows[0]?.id,
            invoice_number: invNum,
            status: "PENDING",
            message: "Invoice generated successfully",
          },
          { status: 201 }
        );
      }
    }

    if (cleanPath === "/v1/reports/digest" && method === "GET") {
      const [tenantRows, docsRes, tasksRes, empRes, vendRes, amlRes] = await Promise.all([
        sql.query(
          `SELECT t.workspace_name, COALESCE(o.rc_number, 'RC-PENDING') AS rc_number, t.compliance_score
           FROM tenants t
           JOIN organisations o ON t.organisation_id = o.id
           WHERE t.id = $1`,
          [tenantId]
        ),
        sql.query("SELECT COUNT(*)::int AS count FROM documents WHERE tenant_id = $1 AND verification_status = 'VERIFIED'", [tenantId]),
        sql.query("SELECT COUNT(*)::int AS count FROM tenant_obligations WHERE tenant_id = $1 AND status = 'PENDING'", [tenantId]),
        sql.query("SELECT COUNT(*)::int AS count FROM employees WHERE tenant_id = $1", [tenantId]),
        sql.query("SELECT COUNT(*)::int AS count FROM vendors WHERE tenant_id = $1", [tenantId]),
        sql.query("SELECT COUNT(*)::int AS count FROM aml_cases WHERE tenant_id = $1 AND status != 'CLEARED'", [tenantId]),
      ]);

      const t = tenantRows[0] || { workspace_name: "PayWave Technologies Ltd", rc_number: "RC-1894231", compliance_score: 85 };
      const score = Number(t.compliance_score ?? 85);

      return NextResponse.json({
        tenant_id: tenantId,
        workspace_name: t.workspace_name,
        rc_number: t.rc_number,
        compliance_score: score,
        verified_docs: Number(docsRes[0]?.count ?? 0),
        pending_tasks: Number(tasksRes[0]?.count ?? 0),
        total_employees: Number(empRes[0]?.count ?? 0),
        total_vendors: Number(vendRes[0]?.count ?? 0),
        open_aml_cases: Number(amlRes[0]?.count ?? 0),
        generated_at: new Date().toISOString(),
        statutory_reports: [
          {
            id: "rep-01",
            title: "Consolidated Compliance Health & Readiness Report",
            description: `Executive board summary of company compliance readiness score (${score}%), open statutory tasks, and legal exposure.`,
            file_type: "Executive Dossier PDF (14 Pages)",
            statutory_authority: "Board & Regulators",
            status: "Ready",
          },
          {
            id: "rep-02",
            title: "CAC Annual Return & Status Package (CAMA 2020)",
            description: "Bundled Statement of Affairs, Form CAC 07 status report, and beneficial ownership filings ready for statutory lodgement.",
            file_type: "Statutory Bundle PDF + ZIP",
            statutory_authority: "Corporate Affairs Commission",
            status: "Ready",
          },
          {
            id: "rep-03",
            title: "NDPC Statutory Privacy Audit Evidence Pack (NDPA 2023)",
            description: "Complete Record of Processing Activities (RoPA), Data Protection Officer appointment proof, and technical security measures.",
            file_type: "Licensed DPCO Audit Pack",
            statutory_authority: "Nigeria Data Protection Commission",
            status: "Ready",
          },
          {
            id: "rep-04",
            title: "SCUML AML/CFT Inspection & KYC Register",
            description: "Customer due diligence audit logs, PEP screening receipts, and Anti-Money Laundering policy acknowledged by directors.",
            file_type: "NFIU / SCUML Inspection Dossier",
            statutory_authority: "SCUML / EFCC",
            status: "Ready",
          },
          {
            id: "rep-05",
            title: "Immutable Activity & Security Event Audit Log",
            description: "Cryptographically hashed audit trail of every document upload, permission modification, and user login.",
            file_type: "Encrypted CSV / JSON Audit Log",
            statutory_authority: "Statutory Auditors",
            status: "Ready",
          },
        ],
      });
    }

    // ==========================================
    // Workforce: Employees & Vendors
    // ==========================================
    if (cleanPath === "/v1/people/employees") {
      if (method === "GET") {
        const rows = await sql.query(
          `SELECT id, tenant_id, full_name, email, role_title, department,
                  TO_CHAR(employment_date, 'YYYY-MM-DD') AS employment_date,
                  pension_pfa, pension_rsa_pin,
                  ndpa_training_completed, aml_training_completed,
                  compliance_clearance_status, created_at
           FROM employees
           WHERE tenant_id = $1
           ORDER BY created_at DESC`,
          [tenantId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const rows = await sql.query(
          `INSERT INTO employees (
             tenant_id, full_name, email, role_title, department,
             pension_pfa, pension_rsa_pin, ndpa_training_completed, aml_training_completed,
             compliance_clearance_status
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'VERIFIED')
           RETURNING id`,
          [
            tenantId,
            body.full_name,
            body.email,
            body.role_title,
            body.department || "Operations",
            body.pension_pfa || "",
            body.pension_rsa_pin || "",
            Boolean(body.ndpa_training_completed),
            Boolean(body.aml_training_completed),
          ]
        );
        return NextResponse.json(
          { id: rows[0]?.id, message: "Employee compliance record established" },
          { status: 201 }
        );
      }
    }

    if (cleanPath === "/v1/vendors") {
      if (method === "GET") {
        const rows = await sql.query(
          `SELECT id, tenant_id, company_name, rc_number, tin, vendor_category,
                  risk_level, tcc_verified, dpa_signed,
                  TO_CHAR(last_assessment_date, 'YYYY-MM-DD') AS last_assessment_date,
                  compliance_score, created_at
           FROM vendors
           WHERE tenant_id = $1
           ORDER BY compliance_score DESC`,
          [tenantId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const rows = await sql.query(
          `INSERT INTO vendors (
             tenant_id, company_name, rc_number, tin, vendor_category,
             risk_level, tcc_verified, dpa_signed, last_assessment_date, compliance_score
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9)
           RETURNING id`,
          [
            tenantId,
            body.company_name,
            body.rc_number || "",
            body.tin || "",
            body.vendor_category,
            body.risk_level || "LOW",
            Boolean(body.tcc_verified),
            Boolean(body.dpa_signed),
            Number(body.compliance_score || 75),
          ]
        );
        return NextResponse.json(
          { id: rows[0]?.id, message: "Vendor compliance record established" },
          { status: 201 }
        );
      }
    }

    // ==========================================
    // Specialist: AML, Privacy RoPA, DSAR
    // ==========================================
    if (cleanPath === "/v1/aml/cases") {
      if (method === "GET") {
        const rows = await sql.query(
          `SELECT id, tenant_id, entity_name, case_type, risk_severity, status,
                  assigned_expert_id, COALESCE(case_notes, '') AS case_notes, created_at, updated_at
           FROM aml_cases
           WHERE tenant_id = $1
           ORDER BY created_at DESC`,
          [tenantId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const rows = await sql.query(
          `INSERT INTO aml_cases (tenant_id, entity_name, case_type, risk_severity, status, case_notes)
           VALUES ($1, $2, $3, $4, 'OPEN', $5)
           RETURNING id`,
          [
            tenantId,
            body.entity_name,
            body.case_type,
            body.risk_severity || "MEDIUM",
            body.case_notes || "",
          ]
        );
        return NextResponse.json(
          { id: rows[0]?.id, message: "AML investigation case opened" },
          { status: 201 }
        );
      }
    }

    if (cleanPath === "/v1/privacy/ropa") {
      if (method === "GET") {
        const rows = await sql.query(
          `SELECT id, tenant_id, activity_name, purpose, data_categories, data_subjects,
                  lawful_basis, retention_period, cross_border_transfer, dpco_audit_ready, created_at
           FROM privacy_processing_activities
           WHERE tenant_id = $1
           ORDER BY created_at DESC`,
          [tenantId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const rows = await sql.query(
          `INSERT INTO privacy_processing_activities (
             tenant_id, activity_name, purpose, data_categories, data_subjects,
             lawful_basis, retention_period, cross_border_transfer, dpco_audit_ready
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            tenantId,
            body.activity_name,
            body.purpose,
            body.data_categories || [],
            body.data_subjects || [],
            body.lawful_basis,
            body.retention_period || "7 Years",
            Boolean(body.cross_border_transfer),
            Boolean(body.dpco_audit_ready),
          ]
        );
        return NextResponse.json(
          { id: rows[0]?.id, message: "NDPA 2023 RoPA record added" },
          { status: 201 }
        );
      }
    }

    if (cleanPath === "/v1/specialist/dsar") {
      if (method === "GET") {
        const rows = await sql.query(
          `SELECT id, tenant_id, subject_name, subject_email, request_type, details, status, deadline, created_at
           FROM dsar_requests
           WHERE tenant_id = $1
           ORDER BY deadline ASC, created_at DESC`,
          [tenantId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const rows = await sql.query(
          `INSERT INTO dsar_requests (tenant_id, subject_name, subject_email, request_type, details, status, deadline)
           VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days')
           RETURNING id`,
          [
            tenantId,
            body.subject_name,
            body.subject_email,
            body.request_type,
            body.details || "",
            body.status || "PENDING",
          ]
        );
        return NextResponse.json(
          { id: rows[0]?.id, message: "Statutory NDPA 2023 DSAR logged successfully" },
          { status: 201 }
        );
      }
    }

    // ==========================================
    // Support Operations & Tickets & Live Chat
    // ==========================================
    if (cleanPath === "/support/kb" && method === "GET") {
      const rows = await sql.query(
        "SELECT id, title, slug, category, excerpt, content, views, updated_at FROM knowledge_articles ORDER BY views DESC"
      );
      return NextResponse.json(rows || []);
    }

    if (cleanPath === "/support/tickets") {
      if (method === "GET") {
        const status = searchParams.get("status") || "";
        const category = searchParams.get("category") || "";
        let query = `
          SELECT id, subject, description, customer_name, customer_email, company_name,
                 rc_number, category, priority, status, COALESCE(assigned_to, '') AS assigned_to,
                 created_at, updated_at
          FROM support_tickets WHERE 1=1
        `;
        const args: any[] = [];
        if (status && status !== "ALL") {
          args.push(status);
          query += ` AND status = $${args.length}`;
        }
        if (category && category !== "ALL") {
          args.push(category);
          query += ` AND category = $${args.length}`;
        }
        query += " ORDER BY updated_at DESC";
        const rows = await sql.query(query, args);
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const id = body.id || `TICK-2026-${Math.floor(100 + Math.random() * 900)}`;
        const priority = body.priority || "MEDIUM";
        const status = body.status || "OPEN";
        const rows = await sql.query(
          `INSERT INTO support_tickets (id, subject, description, customer_name, customer_email, company_name, rc_number, category, priority, status, assigned_to)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id, subject, description, customer_name, customer_email, company_name, rc_number, category, priority, status, COALESCE(assigned_to, '') AS assigned_to, created_at, updated_at`,
          [
            id,
            body.subject,
            body.description,
            body.customer_name,
            body.customer_email,
            body.company_name || "",
            body.rc_number || "",
            body.category || "GENERAL",
            priority,
            status,
            body.assigned_to || "",
          ]
        );
        return NextResponse.json(rows[0] || {}, { status: 201 });
      }
    }

    if (
      cleanPath.startsWith("/support/tickets/") &&
      cleanPath.endsWith("/reply") &&
      method === "POST"
    ) {
      const parts = cleanPath.split("/").filter(Boolean);
      const ticketId = parts[2];
      const body = await request.json();
      const rows = await sql.query(
        `INSERT INTO ticket_replies (ticket_id, sender_name, sender_role, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id, ticket_id, sender_name, sender_role, message, created_at`,
        [ticketId, body.sender_name, body.sender_role || "STAFF", body.message]
      );
      await sql.query("UPDATE support_tickets SET updated_at = NOW() WHERE id = $1", [ticketId]);
      return NextResponse.json(rows[0] || {}, { status: 201 });
    }

    if (cleanPath.startsWith("/support/tickets/")) {
      const parts = cleanPath.split("/").filter(Boolean);
      const ticketId = parts[2];
      if (method === "GET") {
        const ticketRows = await sql.query(
          `SELECT id, subject, description, customer_name, customer_email, company_name,
                  rc_number, category, priority, status, COALESCE(assigned_to, '') AS assigned_to,
                  created_at, updated_at
           FROM support_tickets WHERE id = $1`,
          [ticketId]
        );
        if (!ticketRows || ticketRows.length === 0) {
          return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }
        const replies = await sql.query(
          `SELECT id, ticket_id, sender_name, sender_role, message, created_at
           FROM ticket_replies WHERE ticket_id = $1 ORDER BY created_at ASC`,
          [ticketId]
        );
        return NextResponse.json({ ...ticketRows[0], replies: replies || [] });
      }

      if (method === "PATCH" || method === "PUT") {
        const body = await request.json();
        const rows = await sql.query(
          `UPDATE support_tickets SET
             status = COALESCE(NULLIF($1, ''), status),
             priority = COALESCE(NULLIF($2, ''), priority),
             assigned_to = COALESCE(NULLIF($3, ''), assigned_to),
             updated_at = NOW()
           WHERE id = $4
           RETURNING id, status, priority, assigned_to, updated_at`,
          [body.status || "", body.priority || "", body.assigned_to || "", ticketId]
        );
        return NextResponse.json(rows[0] || {});
      }
    }

    if (cleanPath === "/chat/sessions") {
      if (method === "GET") {
        const rows = await sql.query(`
          SELECT id, visitor_name, visitor_email, COALESCE(visitor_company, '') AS visitor_company,
                 status, COALESCE(assigned_staff, '') AS assigned_staff,
                 COALESCE(last_message, '') AS last_message, created_at, updated_at
          FROM chat_sessions ORDER BY updated_at DESC
        `);
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const id = body.id || `CHAT-${Math.floor(1000 + Math.random() * 9000)}`;
        const visitorName = body.visitor_name || body.user_name || "Visitor";
        const visitorEmail = body.visitor_email || body.user_email || "";
        const visitorCompany = body.visitor_company || body.user_company || "";
        const assignedStaff = body.assigned_staff || "Tunde Bakare, CAMS";
        const rows = await sql.query(
          `INSERT INTO chat_sessions (id, visitor_name, visitor_email, visitor_company, status, assigned_staff, last_message)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, visitor_name, visitor_email, visitor_company, status, assigned_staff, last_message, created_at, updated_at`,
          [id, visitorName, visitorEmail, visitorCompany, body.status || "ACTIVE", assignedStaff, body.last_message || ""]
        );
        const welcomeMsg = `Hello ${visitorName}! Welcome to ComplianceHub live support. How can we assist with your CAC, TaxPro-MAX, or NDPA compliance today?`;
        await sql.query(
          `INSERT INTO chat_messages (session_id, sender, sender_name, text) VALUES ($1, 'staff', $2, $3)`,
          [id, assignedStaff, welcomeMsg]
        );
        return NextResponse.json(rows[0] || {}, { status: 201 });
      }
    }

    if (cleanPath === "/chat/messages") {
      if (method === "GET") {
        const sessionId = searchParams.get("session_id") || "";
        if (!sessionId) {
          return NextResponse.json({ error: "session_id is required" }, { status: 400 });
        }
        const rows = await sql.query(
          `SELECT id, session_id, sender, sender_name, text, created_at
           FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
          [sessionId]
        );
        return NextResponse.json(rows || []);
      }

      if (method === "POST") {
        const body = await request.json();
        const text = body.text || body.message || "";
        const sender = body.sender || (body.sender_role === "STAFF" || body.sender_role === "ADMIN" ? "staff" : "user");
        const rows = await sql.query(
          `INSERT INTO chat_messages (session_id, sender, sender_name, text)
           VALUES ($1, $2, $3, $4)
           RETURNING id, session_id, sender, sender_name, text, created_at`,
          [body.session_id, sender, body.sender_name || "Support", text]
        );
        await sql.query(
          `UPDATE chat_sessions SET last_message = $1, updated_at = NOW() WHERE id = $2`,
          [text, body.session_id]
        );
        return NextResponse.json(rows[0] || {}, { status: 201 });
      }
    }

    // ==========================================
    // Blog Sub-routes (Categories, Tags, Comments, Subscribers)
    // ==========================================
    if (cleanPath.startsWith("/blog/categories/") && method === "DELETE") {
      const parts = cleanPath.split("/").filter(Boolean);
      const id = Number(parts[2]);
      await sql.query("DELETE FROM blog_categories WHERE id = $1", [id]);
      return NextResponse.json({ success: true });
    }

    if (cleanPath.startsWith("/blog/tags/") && method === "DELETE") {
      const parts = cleanPath.split("/").filter(Boolean);
      const id = Number(parts[2]);
      await sql.query("DELETE FROM blog_tags WHERE id = $1", [id]);
      return NextResponse.json({ success: true });
    }

    if (cleanPath.startsWith("/blog/comments/")) {
      const parts = cleanPath.split("/").filter(Boolean);
      const id = Number(parts[2]);
      if (method === "PATCH" || method === "PUT") {
        const body = await request.json().catch(() => ({}));
        await sql.query("UPDATE blog_comments SET status = $1 WHERE id = $2", [
          body.status || "APPROVED",
          id,
        ]);
        return NextResponse.json({ success: true });
      }
      if (method === "DELETE") {
        await sql.query("DELETE FROM blog_comments WHERE id = $1", [id]);
        return NextResponse.json({ success: true });
      }
    }

    if (cleanPath.startsWith("/blog/subscribers/") && method === "DELETE") {
      const parts = cleanPath.split("/").filter(Boolean);
      const id = Number(parts[2]);
      await sql.query("DELETE FROM blog_subscribers WHERE id = $1", [id]);
      return NextResponse.json({ success: true });
    }
  } catch (dbErr: any) {
    console.warn(`[ComplianceHub Next API] Direct Neon handler note on ${cleanPath}:`, dbErr.message);
  }

  // Fallback proxy to Go backend if configured
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/api\/?$/, "").replace(/\/$/, "");
  try {
    const queryStr = url.search || "";
    const proxyHeaders: Record<string, string> = {
      "Content-Type": request.headers.get("content-type") || "application/json",
    };
    const auth = request.headers.get("authorization");
    if (auth) proxyHeaders["Authorization"] = auth;
    const tId = request.headers.get("x-tenant-id");
    if (tId) proxyHeaders["X-Tenant-ID"] = tId;
    const role = request.headers.get("x-demo-role");
    if (role) proxyHeaders["X-Demo-Role"] = role;

    const bodyText = ["POST", "PUT", "PATCH"].includes(method)
      ? await request.text().catch(() => undefined)
      : undefined;

    const res = await fetch(`${backendBase}/api${cleanPath}${queryStr}`, {
      method,
      headers: proxyHeaders,
      body: bodyText,
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
  } catch (proxyErr: any) {
    console.warn(`[ComplianceHub Next API] Backend proxy unreachable for ${cleanPath}:`, proxyErr.message);
  }

  return NextResponse.json({ error: `Route ${cleanPath} unavailable` }, { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
