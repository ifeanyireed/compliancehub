import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || `post-${Date.now()}`;
}

function calculateReadTime(content: string): string {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.floor(words / 200));
  return `${mins} min read`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "PUBLISHED";
  const search = (searchParams.get("search") || "").trim();
  const tag = (searchParams.get("tag") || "").trim();
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const offset = (page - 1) * limit;

  const dbUrl = process.env.DATABASE_URL || "";

  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      let query = `
        SELECT id, title, slug, excerpt, content,
               author_name, author_role, author_avatar, COALESCE(author_bio, '') AS author_bio,
               category, tags, read_time, status, cover_image,
               COALESCE(view_count, 0)::int AS view_count,
               COALESCE(meta_title, '') AS meta_title,
               COALESCE(meta_description, '') AS meta_description,
               COALESCE(canonical_url, '') AS canonical_url,
               COALESCE(og_image, '') AS og_image,
               published_at, created_at, COALESCE(updated_at, created_at) AS updated_at
        FROM blog_posts
        WHERE 1=1
      `;
      const args: any[] = [];

      if (category && category !== "All" && category !== "ALL") {
        args.push(category);
        query += ` AND LOWER(category) = LOWER($${args.length})`;
      }

      if (status && status !== "ALL") {
        args.push(status);
        query += ` AND status = $${args.length}`;
      }

      if (search) {
        args.push(`%${search}%`);
        const idx = args.length;
        query += ` AND (title ILIKE $${idx} OR excerpt ILIKE $${idx} OR content ILIKE $${idx} OR author_name ILIKE $${idx})`;
      }

      if (tag) {
        args.push(tag);
        query += ` AND $${args.length} = ANY(tags)`;
      }

      args.push(limit, offset);
      query += ` ORDER BY COALESCE(published_at, created_at) DESC LIMIT $${args.length - 1} OFFSET $${args.length}`;

      const rows = await sql.query(query, args);
      const formatted = (rows || []).map((r: any) => ({
        ...r,
        view_count: Number(r.view_count || 0),
      }));

      return NextResponse.json(formatted);
    } catch (dbErr: any) {
      console.warn("[Next.js Blog API] Direct Neon query fallback to backend:", dbErr.message);
    }
  }

  // Fallback to Go HTTP backend
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/api\/?$/, "");
  try {
    const q = searchParams.toString();
    const res = await fetch(`${backendBase}/api/blog${q ? `?${q}` : ""}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err: any) {
    console.warn("[Next.js Blog API] Backend fetch failed:", err.message);
  }

  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
  }

  try {
    const sql = neon(dbUrl);
    const body = await request.json();
    const status = body.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
    const rawTitle = String(body.title || "").trim();
    const title = rawTitle || (status === "DRAFT" ? "Untitled Regulatory Dispatch" : "");
    if (!title) {
      return NextResponse.json({ error: "Article title is required" }, { status: 400 });
    }

    const slug = slugify(body.slug || title);
    const content = String(body.content || "");
    const readTime = body.read_time || calculateReadTime(content);
    const coverImage = body.cover_image || "/article_professional.jpg";
    const authorName = body.author_name || "Dr. Olumide Adeleke";
    const authorRole = body.author_role || "Super Administrator & Compliance Director";
    const authorAvatar = body.author_avatar || "";
    const authorBio = body.author_bio || "";
    const category = body.category || "Taxation & FIRS";
    const tags: string[] = Array.isArray(body.tags)
      ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : typeof body.tags === "string"
      ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const rows = await sql.query(
      `INSERT INTO blog_posts (
         title, slug, excerpt, content,
         author_name, author_role, author_avatar, author_bio,
         category, tags, read_time, status, cover_image,
         meta_title, meta_description, canonical_url, og_image,
         view_count, published_at, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 0, NOW(), NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         excerpt = EXCLUDED.excerpt,
         content = EXCLUDED.content,
         author_name = EXCLUDED.author_name,
         author_role = EXCLUDED.author_role,
         author_avatar = EXCLUDED.author_avatar,
         author_bio = EXCLUDED.author_bio,
         category = EXCLUDED.category,
         tags = EXCLUDED.tags,
         read_time = EXCLUDED.read_time,
         status = EXCLUDED.status,
         cover_image = EXCLUDED.cover_image,
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         canonical_url = EXCLUDED.canonical_url,
         og_image = EXCLUDED.og_image,
         updated_at = NOW()
       RETURNING *`,
      [
        title,
        slug,
        body.excerpt || "",
        content,
        authorName,
        authorRole,
        authorAvatar,
        authorBio,
        category,
        tags,
        readTime,
        status,
        coverImage,
        body.meta_title || title,
        body.meta_description || body.excerpt || "",
        body.canonical_url || "",
        body.og_image || coverImage,
      ]
    );

    await sql
      .query(
        "INSERT INTO blog_categories (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
        [category, slugify(category)]
      )
      .catch(() => {});

    for (const tag of tags) {
      await sql
        .query(
          "INSERT INTO blog_tags (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
          [tag, slugify(tag)]
        )
        .catch(() => {});
    }

    return NextResponse.json(rows[0] || {}, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create blog post: " + err.message },
      { status: 500 }
    );
  }
}
