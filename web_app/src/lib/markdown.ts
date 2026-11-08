/**
 * Markdown & Math Processing Engine for ComplianceHub Regulatory Intelligence
 * Converts Markdown (GFM) and LaTeX expressions into enriched semantic HTML.
 * Automatically injects referrerpolicy="no-referrer" on all embedded images for Nigerian media CDN reliability.
 */

// @ts-ignore - pure ESM module
import { marked } from "./marked.js";
import { renderLatexInHtml } from "./math-renderer";

// Configure marked with custom image renderer for CDN safety
const customRenderer = new marked.Renderer();
customRenderer.image = function ({ href, title, text }: { href: string; title?: string; text?: string }) {
  const cleanHref = href || "";
  const cleanAlt = text || "Regulatory Intelligence Illustration";
  const cleanTitle = title ? ` title="${title}"` : "";
  return `<img src="${cleanHref}" alt="${cleanAlt}"${cleanTitle} referrerpolicy="no-referrer" loading="lazy" class="w-full rounded-2xl border border-slate-200/80 my-6 shadow-xs object-cover max-h-[480px]" />`;
};

marked.setOptions({
  gfm: true,
  breaks: true,
});

marked.use({ renderer: customRenderer });

export function hasMarkdownIndicators(text: string): boolean {
  if (!text) return false;
  const patterns = [
    /^#{1,6}\s+/m,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /^\s*>\s+/m,
    /```[\s\S]*?```/,
    /`[^`\n]+`/,
    /\[[^\]]+\]\([^)]+\)/,
    /!\[[^\]]*\]\([^)]+\)/,
    /\*\*[^*]+\*\*/,
    /~~[^~]+~~/,
    /\|[^\n]+\|\r?\n\|[-:\s|]+\|/,
  ];
  return patterns.some((regex) => regex.test(text));
}

export function isHtmlContent(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return (
    trimmed.startsWith("<p>") ||
    trimmed.startsWith("<div>") ||
    trimmed.startsWith("<article>") ||
    trimmed.startsWith("<h1") ||
    trimmed.startsWith("<h2") ||
    trimmed.startsWith("<section>") ||
    trimmed.startsWith("<ul") ||
    trimmed.startsWith("<ol") ||
    trimmed.startsWith("<table") ||
    trimmed.startsWith("<blockquote")
  );
}

export function renderMarkdownAndMath(rawContent: string): string {
  if (!rawContent) return "";

  let html = rawContent;

  const isHtml = isHtmlContent(rawContent);
  const hasMarkdown = hasMarkdownIndicators(rawContent);

  if (!isHtml || hasMarkdown) {
    try {
      const parsed = marked.parse(rawContent);
      if (typeof parsed === "string" && parsed.trim().length > 0) {
        html = parsed;
      }
    } catch (err) {
      console.warn("[Markdown] Parsing note:", err);
      html = rawContent;
    }
  }

  // Ensure all existing <img> tags inside raw HTML also have referrerpolicy="no-referrer"
  html = html.replace(/<img\s+([^>]*?)>/gi, (match, attrs) => {
    if (!attrs.includes("referrerpolicy")) {
      return `<img ${attrs} referrerpolicy="no-referrer" loading="lazy">`;
    }
    return match;
  });

  return renderLatexInHtml(html);
}

export { renderLatexInHtml };
