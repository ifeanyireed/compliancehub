/**
 * Math & LaTeX Rendering Utility for ComplianceHub Regulatory Intelligence & Editorial Journal
 * Dynamically loads KaTeX and transforms $$...$$ and $...$ expressions into rendered math.
 */

let katexPromise: Promise<any> | null = null;

/**
 * Loads KaTeX from CDN in browser environments.
 * Idempotent and SSR safe.
 */
export function loadKaTeX(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if ((window as any).katex) return Promise.resolve((window as any).katex);
  if (katexPromise) return katexPromise;

  katexPromise = new Promise((resolve) => {
    // 1. Inject KaTeX CSS
    if (!document.getElementById("katex-cdn-css")) {
      const link = document.createElement("link");
      link.id = "katex-cdn-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }

    // 2. Inject KaTeX JS
    if (!document.getElementById("katex-cdn-js")) {
      const script = document.createElement("script");
      script.id = "katex-cdn-js";
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        resolve((window as any).katex);
      };
      script.onerror = () => {
        // Fallback to cdnjs if jsdelivr fails
        const fallback = document.createElement("script");
        fallback.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
        fallback.async = true;
        fallback.onload = () => resolve((window as any).katex);
        fallback.onerror = () => {
          console.warn("[MathRenderer] Could not load KaTeX from CDNs");
          resolve(null);
        };
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    } else {
      resolve((window as any).katex);
    }
  });

  return katexPromise;
}

function decodeMathEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, " ");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeFormula(raw: string): string {
  let cleaned = decodeMathEntities(raw).trim();
  cleaned = cleaned
    .replace(/^\$\$|\$\$$/g, "")
    .replace(/^\\\[|\\\]$/g, "")
    .replace(/^\$|\$$/g, "")
    .replace(/^\\\(|\\\)$/g, "")
    .trim();

  return cleaned
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ");
}

function renderBlockFormula(rawFormula: string): string {
  const formula = normalizeFormula(rawFormula);
  if (!formula) return "";

  const katex = typeof window !== "undefined" ? (window as any).katex : null;
  if (katex) {
    try {
      const rendered = katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="katex-math-display my-6 p-4 sm:p-6 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-center overflow-x-auto select-all shadow-xs text-slate-900">${rendered}</div>`;
    } catch (err) {
      console.warn("[MathRenderer] KaTeX block render note:", err);
    }
  }

  return `<div class="katex-math-display my-6 p-4 sm:p-6 bg-slate-50 border border-slate-200/90 rounded-2xl text-center font-mono text-sm sm:text-base text-sky-700 overflow-x-auto select-all shadow-xs"><span class="block text-[11px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-2">Statutory Formula</span>$$ ${escapeHtml(formula)} $$</div>`;
}

function renderInlineFormula(rawFormula: string, prefix = ""): string {
  const formula = normalizeFormula(rawFormula);
  if (!formula) return rawFormula;

  // Currency check: ignore $100, $5.99, $50M, $10,000 etc.
  if (/^\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB])?$/.test(formula)) {
    return `${prefix}$${formula}`;
  }

  const katex = typeof window !== "undefined" ? (window as any).katex : null;
  if (katex) {
    try {
      const rendered = katex.renderToString(formula, {
        displayMode: false,
        throwOnError: false,
      });
      return `${prefix}<span class="katex-math-inline px-1">${rendered}</span>`;
    } catch (err) {
      console.warn("[MathRenderer] KaTeX inline render note:", err);
    }
  }

  return `${prefix}<span class="katex-math-inline font-mono text-sky-700 bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded text-xs sm:text-sm">$${escapeHtml(formula)}$</span>`;
}

export function renderLatexInHtml(html: string): string {
  if (!html) return "";

  let result = html;

  result = result.replace(/<p>\s*(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])\s*<\/p>/gi, (_match, formula) => {
    return renderBlockFormula(formula);
  });

  result = result.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?\\\])/g, (match, p1, p2) => {
    return renderBlockFormula(p1 || p2 || match);
  });

  result = result.replace(/(^|[^\\])\$([^\$\s](?:[^\$]*?[^\$\s])?)\$|\\\(([\s\S]+?)\\\)/g, (match, prefix, p1, p2) => {
    const rawFormula = p1 || p2;
    if (!rawFormula) return match;
    return renderInlineFormula(rawFormula, prefix || "");
  });

  return result;
}
