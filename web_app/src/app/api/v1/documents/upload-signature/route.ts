import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawFileName = String(body.file_name || "blog_image");
    const category = String(body.category || "Blog_Editorial");

    const cldUrl = process.env.CLOUDINARY_URL || "";
    let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "yugcjpau";
    let apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "";
    let apiSecret = "";

    if (cldUrl.startsWith("cloudinary://")) {
      try {
        const parsed = new URL(cldUrl);
        apiKey = decodeURIComponent(parsed.username || apiKey);
        apiSecret = decodeURIComponent(parsed.password || "");
        cloudName = parsed.hostname || cloudName;
      } catch (_) {}
    }

    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json(
        { error: "Cloudinary credentials are not configured" },
        { status: 500 }
      );
    }

    const baseName = rawFileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "image";
    const cleanCategory = category.replace(/[^a-zA-Z0-9_-]+/g, "_");
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "compliancehub/blog";
    const publicId = `${cleanCategory}_${baseName}_${timestamp}`;

    // Sort parameters alphabetically for Cloudinary SHA-1 signature
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
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
