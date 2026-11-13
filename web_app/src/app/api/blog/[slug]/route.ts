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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug || "").trim();
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    if (!cleanSlug) {
      return NextResponse.json({ error: "Post slug or ID is required" }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL || "";

    if (dbUrl) {
      try {
        const sql = neon(dbUrl);

        if (cleanSlug === "categories") {
          const rows = await sql.query(`
            SELECT c.id, c.name, c.slug, COALESCE(c.description, '') AS description,
                   COUNT(p.id)::int AS post_count, c.created_at
            FROM blog_categories c
            LEFT JOIN blog_posts p ON LOWER(p.category) = LOWER(c.name)
            GROUP BY c.id, c.name, c.slug, c.description, c.created_at
            ORDER BY post_count DESC, c.name ASC
          `);
          return NextResponse.json(rows || []);
        }

        if (cleanSlug === "tags") {
          const rows = await sql.query(`
            SELECT t.id, t.name, t.slug, COUNT(p.id)::int AS post_count, t.created_at
            FROM blog_tags t
            LEFT JOIN blog_posts p ON t.name = ANY(p.tags)
            GROUP BY t.id, t.name, t.slug, t.created_at
            ORDER BY post_count DESC, t.name ASC
          `);
          return NextResponse.json(rows || []);
        }

        if (cleanSlug === "comments") {
          const postId = searchParams.get("post_id") || "";
          const status = searchParams.get("status") || "";
          let query = `
            SELECT c.id, c.post_id, COALESCE(p.title, 'General') AS post_title,
                   c.author_name, c.author_email, c.content, c.status, c.created_at
            FROM blog_comments c
            LEFT JOIN blog_posts p ON c.post_id = p.id
            WHERE 1=1
          `;
          const args: any[] = [];
          if (postId) {
            args.push(postId);
            query += ` AND c.post_id = $${args.length}`;
          }
          if (status && status !== "ALL") {
            args.push(status);
            query += ` AND c.status = $${args.length}`;
          }
          query += " ORDER BY c.created_at DESC LIMIT 100";
          const rows = await sql.query(query, args);
          return NextResponse.json(rows || []);
        }

        if (cleanSlug === "subscribers") {
          const rows = await sql.query(
            "SELECT id, email, source, status, created_at FROM blog_subscribers ORDER BY created_at DESC"
          );
          return NextResponse.json(rows || []);
        }

        const rows = await sql`
          SELECT id, title, slug, excerpt, content,
                 author_name, author_role, author_avatar, COALESCE(author_bio, '') as author_bio,
                 category, tags, read_time, status, cover_image,
                 COALESCE(view_count, 0) as view_count,
                 COALESCE(meta_title, '') as meta_title,
                 COALESCE(meta_description, '') as meta_description,
                 COALESCE(canonical_url, '') as canonical_url,
                 COALESCE(og_image, '') as og_image,
                 published_at, created_at, COALESCE(updated_at, created_at) as updated_at
          FROM blog_posts
          WHERE slug = ${cleanSlug}
             OR LOWER(slug) = LOWER(${cleanSlug})
             OR id::text = ${cleanSlug}
          LIMIT 1;
        `;

        if (rows && rows.length > 0) {
          const rawPost: any = rows[0];
          const postId = rawPost.id;
          const category = rawPost.category || "";

          const post = {
            ...rawPost,
            view_count: Number(rawPost.view_count || 0),
          };

          const comments = await sql`
            SELECT id, post_id, author_name, author_email, content, status, created_at
            FROM blog_comments
            WHERE post_id = ${postId} AND status = 'APPROVED'
            ORDER BY created_at DESC;
          `;

          const related = await sql`
            SELECT id, title, slug, excerpt, content,
                   author_name, author_role, author_avatar, COALESCE(author_bio, '') as author_bio,
                   category, tags, read_time, status, cover_image,
                   COALESCE(view_count, 0) as view_count,
                   published_at, created_at, COALESCE(updated_at, created_at) as updated_at
            FROM blog_posts
            WHERE id != ${postId} AND status = 'PUBLISHED'
            ORDER BY (CASE WHEN category = ${category} THEN 0 ELSE 1 END), COALESCE(published_at, created_at) DESC
            LIMIT 3;
          `;

          return NextResponse.json({
            ...post,
            comments: comments || [],
            related_posts: related.map((r: any) => ({
              ...r,
              view_count: Number(r.view_count || 0),
            })),
          });
        }
      } catch (dbErr: any) {
        console.warn("[Next.js Blog Slug API] Direct Neon query note:", dbErr.message);
      }
    }

    // Fallback to Go HTTP backend
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/api\/?$/, "");
    try {
      const res = await fetch(`${backendBase}/api/blog/${encodeURIComponent(cleanSlug)}`, {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err: any) {
      console.warn("[Next.js Blog Slug API] Backend proxy error:", err.message);
    }

    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug || "").trim();
    const dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    }
    const sql = neon(dbUrl);
    const body = await request.json();

    if (cleanSlug === "categories") {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Category name is required" }, { status: 400 });
      }
      const rows = await sql.query(
        `INSERT INTO blog_categories (name, slug, description, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (name) DO UPDATE SET
           description = COALESCE(NULLIF(EXCLUDED.description, ''), blog_categories.description)
         RETURNING id, name, slug, description, created_at`,
        [name, body.slug || slugify(name), body.description || ""]
      );
      return NextResponse.json(rows[0] || {}, { status: 201 });
    }

    if (cleanSlug === "tags") {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
      }
      const rows = await sql.query(
        `INSERT INTO blog_tags (name, slug, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (name) DO UPDATE SET
           slug = EXCLUDED.slug
         RETURNING id, name, slug, created_at`,
        [name, body.slug || slugify(name)]
      );
      return NextResponse.json(rows[0] || {}, { status: 201 });
    }

    if (cleanSlug === "comments") {
      const rows = await sql.query(
        `INSERT INTO blog_comments (post_id, author_name, author_email, content, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, post_id, author_name, author_email, content, status, created_at`,
        [
          Number(body.post_id),
          body.author_name,
          body.author_email || "",
          body.content,
          body.status || "APPROVED",
        ]
      );
      return NextResponse.json(rows[0] || {}, { status: 201 });
    }

    if (cleanSlug === "subscribe") {
      const email = String(body.email || "").toLowerCase().trim();
      const source = body.source || "BLOG_EDITORIAL";
      const rows = await sql.query(
        `INSERT INTO blog_subscribers (email, source, status, created_at)
         VALUES ($1, $2, 'ACTIVE', NOW())
         ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE'
         RETURNING id, email, source, status, created_at`,
        [email, source]
      );
      return NextResponse.json(
        {
          success: true,
          message: "Thank you for subscribing to ComplianceHub Regulatory Intelligence!",
          data: rows[0] || {},
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: "Method not supported on this slug" }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug || "").trim();
    const dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    }
    const sql = neon(dbUrl);
    const body = await request.json();

    const existingRows = await sql.query(
      "SELECT * FROM blog_posts WHERE id::text = $1 OR slug = $1 OR LOWER(slug) = LOWER($1) LIMIT 1",
      [cleanSlug]
    );
    const existing = existingRows?.[0] || {};

    const title = String(body.title ?? existing.title ?? "Untitled Regulatory Dispatch").trim();
    let newSlug = slugify(body.slug || title || existing.slug || cleanSlug);

    // Ensure slug does not collide with a different post
    if (existing.id) {
      const collision = await sql.query(
        "SELECT id FROM blog_posts WHERE slug = $1 AND id != $2 LIMIT 1",
        [newSlug, existing.id]
      );
      if (collision && collision.length > 0) {
        newSlug = `${newSlug}-${existing.id}`;
      }
    }

    const content = String(body.content ?? existing.content ?? "");
    const readTime = body.read_time || calculateReadTime(content);
    const tags: string[] = Array.isArray(body.tags)
      ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : typeof body.tags === "string"
      ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : Array.isArray(existing.tags)
      ? existing.tags
      : [];
    const category = body.category || existing.category || "Taxation & FIRS";
    const status = body.status || existing.status || "PUBLISHED";
    const coverImage = body.cover_image !== undefined ? body.cover_image : (existing.cover_image || "/article_professional.jpg");
    const authorName = body.author_name || existing.author_name || "Dr. Olumide Adeleke";
    const authorRole = body.author_role || existing.author_role || "Super Administrator & Compliance Director";
    const authorAvatar = body.author_avatar !== undefined ? body.author_avatar : (existing.author_avatar || "");
    const authorBio = body.author_bio !== undefined ? body.author_bio : (existing.author_bio || "");

    const rows = await sql.query(
      `UPDATE blog_posts SET
         title = $1, slug = $2, excerpt = $3, content = $4,
         author_name = $5, author_role = $6, author_avatar = $7, author_bio = $8,
         category = $9, tags = $10, read_time = $11, status = $12, cover_image = $13,
         meta_title = $14, meta_description = $15, canonical_url = $16, og_image = $17,
         updated_at = NOW()
       WHERE id::text = $18 OR slug = $18 OR LOWER(slug) = LOWER($18)
       RETURNING *`,
      [
        title,
        newSlug,
        body.excerpt !== undefined ? body.excerpt : (existing.excerpt || ""),
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
        body.meta_title !== undefined ? body.meta_title : (existing.meta_title || title),
        body.meta_description !== undefined ? body.meta_description : (existing.meta_description || body.excerpt || ""),
        body.canonical_url !== undefined ? body.canonical_url : (existing.canonical_url || ""),
        body.og_image !== undefined ? body.og_image : (existing.og_image || coverImage),
        cleanSlug,
      ]
    );

    if (category) {
      await sql
        .query(
          "INSERT INTO blog_categories (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
          [category, slugify(category)]
        )
        .catch(() => {});
    }

    for (const tag of tags) {
      await sql
        .query(
          "INSERT INTO blog_tags (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
          [tag, slugify(tag)]
        )
        .catch(() => {});
    }

    return NextResponse.json(rows[0] || {});
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug || "").trim();
    const dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    }
    const sql = neon(dbUrl);
    await sql.query("DELETE FROM blog_posts WHERE id::text = $1 OR slug = $1", [cleanSlug]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
