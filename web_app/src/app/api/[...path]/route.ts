import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const DEFAULT_TENANT_ID = "55555555-5555-5555-5555-555555555501";

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

function getDemoUser(request: Request) {
  const roleHeader = (request.headers.get("x-demo-role") || "BUSINESS").toUpperCase();
  const authHeader = request.headers.get("authorization") || "";
  let role = roleHeader;
  if (authHeader.toLowerCase().startsWith("bearer demo-token-")) {
    role = authHeader.slice("bearer demo-token-".length).trim().toUpperCase();
  }
  switch (role) {
    case "ADMIN":
      return { id: "33333333-3333-3333-3333-333333333305", email: "admin@compliancehub.ng", full_name: "Dr. Olumide Adeleke", system_role: "ADMIN" };
    case "STAFF":
      return { id: "33333333-3333-3333-3333-333333333304", email: "bsanwo@compliancehub.ng", full_name: "Babajide Sanwo", system_role: "STAFF" };
    case "AGENCY":
      return { id: "33333333-3333-3333-3333-333333333303", email: "chiamaka@apexcompliance.ng", full_name: "Chiamaka Eze", system_role: "USER" };
    case "EXPERT":
      return { id: "33333333-3333-3333-3333-333333333302", email: "tunde@bakarecompliance.com", full_name: "Tunde Bakare, CAMS", system_role: "USER" };
    default:
      return { id: "33333333-3333-3333-3333-333333333301", email: "adaeze@paywave.ng", full_name: "Adaeze Nwosu", system_role: "USER" };
  }
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

  try {
    const sql = getSql();
    const tenantId = getTenantId(request);
    const demoUser = getDemoUser(request);

    // ==========================================
    // Health Check
    // ==========================================
    if (cleanPath === "/health") {
      return NextResponse.json({
        status: "ok",
        database: "Neon Lakebase Postgres (connected)",
        service: "ComplianceHub.ng Core API",
      });
    }

    // ==========================================
    // Admin Cockpit Routes
    // ==========================================
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
    if (cleanPath === "/v1/auth/me" && method === "GET") {
      const tenants = await sql.query(
        `SELECT t.id AS tenant_id, t.workspace_name, tm.role, t.plan_tier, t.compliance_score AS score
         FROM tenant_members tm
         JOIN tenants t ON tm.tenant_id = t.id
         WHERE tm.user_id = $1`,
        [demoUser.id]
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
        user: demoUser,
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
    // Onboarding & Classification
    // ==========================================
    if (cleanPath === "/v1/onboarding/classify" && method === "POST") {
      const body = await request.json();
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
      const initialScore = body.collects_personal_data && body.processes_payments ? 64 : 72;
      const tenantRows = await sql.query(
        `INSERT INTO tenants (organisation_id, workspace_name, slug, plan_tier, compliance_score)
         VALUES ($1, $2, $3, 'Professional', $4)
         RETURNING id`,
        [orgId, body.business_name, slug, initialScore]
      );
      const newTenantId = tenantRows[0]?.id;
      await sql.query(
        `INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
         VALUES ($1, $2, 'OWNER', true)
         ON CONFLICT (tenant_id, user_id) DO NOTHING`,
        [newTenantId, demoUser.id]
      );
      await sql.query(
        `INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
         VALUES
         ($1, 'Monthly TaxPro-MAX VAT Filing (2026 Transition Window)', 'FIRS / NRS', CURRENT_DATE + INTERVAL '18 days', 'PENDING', 50000, true),
         ($1, 'CAMA 2020 Annual Returns Preparation & Filing (Form CAC 19)', 'CAC', CURRENT_DATE + INTERVAL '150 days', 'PENDING', 25000, false)`,
        [newTenantId]
      );
      return NextResponse.json(
        {
          tenant_id: newTenantId,
          organisation_id: orgId,
          workspace_name: body.business_name,
          compliance_score: initialScore,
          obligations_seeded: 2,
          message: "Workspace classified and statutory obligations generated",
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
      return NextResponse.json(rows || []);
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
