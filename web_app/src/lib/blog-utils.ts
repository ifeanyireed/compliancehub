/**
 * Blog utilities for URL generation, slug formatting, clipboard sharing,
 * and authentic Nigerian regulatory media presets (Zero Unsplash).
 */

export function slugify(text: string): string {
  if (!text) return `post-${Date.now()}`;
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `post-${Date.now()}`
  );
}

export function calculateReadTime(content: string): string {
  if (!content) return "3 min read";
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

/**
 * Returns the public blog post URL on ComplianceHub.
 * Supports production (https://www.compliancehub.ng/blog/<slug>) and local dev (http://localhost:3000/blog/<slug>).
 */
export function getPublicBlogUrl(slugOrId: string): string {
  let cleanSlug = (slugOrId || "").trim().replace(/^\/+/, "");
  if (cleanSlug.startsWith("blog/")) {
    cleanSlug = cleanSlug.replace(/^blog\//, "");
  }

  // 1. Explicit environment variable takes top precedence
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envBase) {
    return `${envBase.replace(/\/+$/, "")}/blog/${cleanSlug}`;
  }

  // 2. Client-side browser runtime check for local development
  if (typeof window !== "undefined") {
    const host = window.location.host;
    const isLocal =
      host.includes("localhost") ||
      host.includes("127.0.0.1");
    if (isLocal) {
      return `http://localhost:3000/blog/${cleanSlug}`;
    }
  }

  // 3. Platform default production URL
  return `https://www.compliancehub.ng/blog/${cleanSlug}`;
}

/**
 * Copies the blog URL to the clipboard with fallbacks.
 */
export async function copyBlogUrlToClipboard(
  slugOrId: string
): Promise<{ success: boolean; url: string }> {
  const url = getPublicBlogUrl(slugOrId);
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return { success: true, url };
    }

    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return { success: Boolean(successful), url };
    }
  } catch (err) {
    console.warn("Failed to copy blog URL to clipboard:", err);
  }
  return { success: false, url };
}

/**
 * Reads an image File and compresses/normalizes it via an HTML5 canvas into a
 * lightweight, browser-safe Data URL so previews and DB persistence always work.
 */
export async function readFileAsOptimizedDataUrl(
  file: File,
  maxWidth = 1280,
  maxHeight = 900,
  quality = 0.85
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

  if (!rawDataUrl || typeof window === "undefined" || file.type === "image/svg+xml" || file.type === "image/gif") {
    return rawDataUrl;
  }

  return await new Promise<string>((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const compressed = canvas.toDataURL(outputType, quality);
        resolve(compressed && compressed.length < rawDataUrl.length ? compressed : compressed || rawDataUrl);
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

function verifyImageUrlLoads(url: string, timeoutMs = 4500): Promise<boolean> {
  if (typeof window === "undefined" || !url) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const img = new window.Image();
    const timer = window.setTimeout(() => {
      img.src = "";
      resolve(false);
    }, timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    img.referrerPolicy = "no-referrer";
    img.src = url;
  });
}

/**
 * Generates an instant local preview Data URL and optionally uploads to Cloudinary
 * if configured and reachable, verifying that any remote URL loads before returning it.
 */
export async function uploadBlogImageFile(
  file: File,
  onInstantPreview?: (previewDataUrl: string) => void
): Promise<string> {
  const localDataUrl = await readFileAsOptimizedDataUrl(file);
  if (localDataUrl && onInstantPreview) {
    onInstantPreview(localDataUrl);
  }

  try {
    const sigRes = await fetch("/api/v1/documents/upload-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: file.name, category: "Blog_Editorial" }),
      signal: AbortSignal.timeout(3500),
    });

    if (sigRes.ok) {
      const sigData = await sigRes.json();
      if (sigData && sigData.signature && sigData.api_key && sigData.cloud_name) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.api_key);
        formData.append("timestamp", String(sigData.timestamp));
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);
        formData.append("public_id", sigData.public_id);

        const cldRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`,
          {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(8000),
          }
        );

        if (cldRes.ok) {
          const cldJson = await cldRes.json();
          if (cldJson?.secure_url) {
            const canLoad = await verifyImageUrlLoads(cldJson.secure_url);
            if (canLoad) {
              return cldJson.secure_url;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Cloudinary blog image upload fallback to optimized local Data URL:", err);
  }

  return localDataUrl;
}

/**
 * Curated authentic Nigerian media imagery presets for regulatory compliance.
 * STRICTLY complies with project directives: Zero Unsplash, real Nigerian sources only.
 */
export const NIGERIAN_MEDIA_PRESETS = [
  {
    title: "TaxPro-MAX / FIRS Revenue Headquarters",
    category: "Taxation & FIRS",
    url: "https://cdn.punchng.com/wp-content/uploads/2023/07/11175654/FIRS-headquarters.jpg",
    source: "Punch Nigeria"
  },
  {
    title: "CAC Commercial Law & Corporate Registry",
    category: "Corporate & CAC",
    url: "https://cdn.punchng.com/wp-content/uploads/2021/04/14221759/CAC-headquarters.jpg",
    source: "Punch Nigeria"
  },
  {
    title: "Nigeria Data Protection Commission (NDPC)",
    category: "Data Privacy & NDPA",
    url: "https://cdn.punchng.com/wp-content/uploads/2023/06/22152817/NDPC.jpg",
    source: "Punch Nigeria"
  },
  {
    title: "NFIU & SCUML Financial Intelligence",
    category: "AML & SCUML",
    url: "https://cdn.punchng.com/wp-content/uploads/2022/07/04172421/NFIU-logo.jpg",
    source: "Punch Nigeria"
  },
  {
    title: "National Pension Commission (PenCom) Complex",
    category: "Labour & Pension",
    url: "https://cdn.punchng.com/wp-content/uploads/2021/11/15181744/PenCom-Headquarters.jpg",
    source: "Punch Nigeria"
  },
  {
    title: "Federal Ministry of Interior / CERPAC",
    category: "Immigration & Expatriate",
    url: "https://cdn.punchng.com/wp-content/uploads/2021/08/04183853/Ministry-of-Interior.jpg",
    source: "Punch Nigeria"
  }
];
