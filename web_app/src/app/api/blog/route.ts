import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "PUBLISHED";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const dbUrl = process.env.DATABASE_URL || "";

  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      let rows: any[] = [];

      if (category && category !== "All") {
        rows = await sql`
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
          WHERE status = ${status} AND category = ${category}
          ORDER BY COALESCE(published_at, created_at) DESC
          LIMIT ${limit};
        `;
      } else {
        rows = await sql`
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
          WHERE status = ${status}
          ORDER BY COALESCE(published_at, created_at) DESC
          LIMIT ${limit};
        `;
      }

      const formatted = rows.map((r: any) => ({
        ...r,
        view_count: Number(r.view_count || 0),
      }));

      return NextResponse.json(formatted);
    } catch (dbErr: any) {
      console.warn("[Next.js Blog API] Direct Neon query fallback to backend:", dbErr.message);
    }
  }

  // Fallback to Go HTTP backend
  const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
