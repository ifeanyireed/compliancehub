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
