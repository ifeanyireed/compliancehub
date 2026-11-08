import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function POST(
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
          UPDATE blog_posts
          SET view_count = COALESCE(view_count, 0) + 1
          WHERE slug = ${cleanSlug}
             OR LOWER(slug) = LOWER(${cleanSlug})
             OR id::text = ${cleanSlug}
          RETURNING view_count;
        `;

        if (rows && rows.length > 0) {
          const rawRow: any = rows[0];
          const newCount = Number(rawRow?.view_count || 0);
          return NextResponse.json({
            success: true,
            view_count: newCount,
          });
        }
      } catch (dbErr: any) {
        console.warn("[Next.js Blog View API] Direct Neon update note:", dbErr.message);
      }
    }

    // Fallback to Go HTTP backend
    const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    try {
      const res = await fetch(`${backendBase}/api/blog/${encodeURIComponent(cleanSlug)}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err: any) {
      console.warn("[Next.js Blog View API] Backend proxy error:", err.message);
    }

    return NextResponse.json({ success: true, view_count: 1 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to increment view counter: " + err.message },
      { status: 500 }
    );
  }
}
