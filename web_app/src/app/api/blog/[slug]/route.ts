import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug || "").trim();

    if (!cleanSlug) {
      return NextResponse.json({ error: "Post slug or ID is required" }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL || "";

    if (dbUrl) {
      try {
        const sql = neon(dbUrl);
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

          // Fetch approved comments
          const comments = await sql`
            SELECT id, post_id, author_name, author_email, content, status, created_at
            FROM blog_comments
            WHERE post_id = ${postId} AND status = 'APPROVED'
            ORDER BY created_at DESC;
          `;

          // Fetch related articles
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
    const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
    return NextResponse.json({ error: "Failed to fetch post: " + err.message }, { status: 500 });
  }
}
