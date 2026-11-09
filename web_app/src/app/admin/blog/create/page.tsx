"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Folder, 
  User, 
  Globe, 
  FileText,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Quote,
  List,
  ListOrdered,
  Minus
} from "lucide-react";
import { api } from "@/lib/api";
import { 
  slugify, 
  calculateReadTime, 
  copyBlogUrlToClipboard, 
  getPublicBlogUrl,
  NIGERIAN_MEDIA_PRESETS 
} from "@/lib/blog-utils";
import { renderMarkdownAndMath } from "@/lib/markdown";
import { loadKaTeX } from "@/lib/math-renderer";

export default function BlogCreatePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading editorial studio...</div>}>
      <BlogCreateContent />
    </Suspense>
  );
}

function BlogCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Taxation & FIRS");
  const [tags, setTags] = useState("Tax Act 2026, Compliance, FIRS");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState(NIGERIAN_MEDIA_PRESETS[0].url);

  // Author Details
  const [authorName, setAuthorName] = useState("Dr. Olumide Adeleke");
  const [authorRole, setAuthorRole] = useState("Super Administrator & Compliance Director");
  const [authorAvatar, setAuthorAvatar] = useState("/character5.jpg");
  const [authorBio, setAuthorBio] = useState("Fellow of the Institute of Chartered Accountants of Nigeria (ICAN) with 15+ years of corporate tax regulatory experience.");

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");

  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>([
    "Taxation & FIRS",
    "Data Privacy & NDPA",
    "Corporate & CAC",
    "AML & SCUML",
    "Labour & Pension",
    "Immigration & Expatriate"
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // Load dynamic categories
    api.blog.getCategories().then((cats: any) => {
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats.map((c: any) => c.name));
      }
    }).catch(() => {});

    // If editing existing post, load data
    if (editId) {
      api.blog.getPost(editId).then((post: any) => {
        if (post && post.title) {
          setTitle(post.title || "");
          setSlug(post.slug || "");
          setExcerpt(post.excerpt || "");
          setCategory(post.category || "Taxation & FIRS");
          setTags(Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || ""));
          setContent(post.content || "");
          setCoverImage(post.cover_image || NIGERIAN_MEDIA_PRESETS[0].url);
          setAuthorName(post.author_name || "Dr. Olumide Adeleke");
          setAuthorRole(post.author_role || "Super Administrator & Compliance Director");
          setAuthorAvatar(post.author_avatar || "/character5.jpg");
          setAuthorBio(post.author_bio || "");
          setMetaTitle(post.meta_title || "");
          setMetaDescription(post.meta_description || "");
          setCanonicalUrl(post.canonical_url || "");
          setOgImage(post.og_image || "");
          setStatus(post.status === "DRAFT" ? "DRAFT" : "PUBLISHED");
        }
      }).catch((e) => console.warn("Failed loading post to edit", e));
    }
  }, [editId]);

  // Update preview HTML and KaTeX
  useEffect(() => {
    if (editorMode === "preview") {
      setPreviewHtml(renderMarkdownAndMath(content));
      loadKaTeX().then((katex) => {
        if (katex) {
          setPreviewHtml(renderMarkdownAndMath(content));
        }
      });
    }
  }, [content, editorMode]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editId) {
      setSlug(slugify(val));
    }
  };

  const insertMarkdown = (syntax: string) => {
    setContent(prev => prev + "\n" + syntax + "\n");
  };

  const handleSave = async (submitStatus: "PUBLISHED" | "DRAFT") => {
    if (!title.trim()) {
      alert("Please provide an article title");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || slugify(title),
        excerpt,
        content,
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        read_time: calculateReadTime(content),
        status: submitStatus,
        cover_image: coverImage,
        author_name: authorName,
        author_role: authorRole,
        author_avatar: authorAvatar,
        author_bio: authorBio,
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt,
        canonical_url: canonicalUrl,
        og_image: ogImage || coverImage,
      };

      if (editId) {
        await api.blog.updatePost(editId, payload);
        showToast("Regulatory dispatch updated successfully!");
      } else {
        const res = await api.blog.createPost(payload);
        showToast("Regulatory dispatch created successfully!");
        if (res && res.id) {
          router.push(`/admin/blog/create?edit=${res.id}`);
        }
      }
    } catch (e: any) {
      alert("Failed saving dispatch: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPublicUrl = async () => {
    const res = await copyBlogUrlToClipboard(slug);
    if (res.success) {
      setCopied(true);
      showToast("Public blog URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation & Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog">
            <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {editId ? "Edit Regulatory Dispatch" : "Author New Statutory Intelligence"}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Draft comprehensive legal breakdowns, Nigerian act circulars, and executive advisories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {slug && (
            <button
              type="button"
              onClick={handleCopyPublicUrl}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? "Copied" : "Copy URL"}</span>
            </button>
          )}

          {slug && (
            <Link href={`/blog/${slug}`} target="_blank">
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Live</span>
              </button>
            </Link>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("DRAFT")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("PUBLISHED")}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs transition-all shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? "Publishing..." : "Publish Dispatch"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Editorial Form Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title & Slug */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dispatch Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Navigating the 2026 Nigeria Tax Act: A Corporate Guide to Withholding, CIT, and TaxPro-MAX"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="font-bold text-slate-400">Slug:</span>
              <span>/blog/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="flex-1 px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Executive Excerpt / Lead Summary *
              </label>
              <textarea
                rows={3}
                placeholder="Concise 2-sentence statutory thesis outlining key obligations, affected corporate entities, and compliance cutoffs..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>
          </div>

          {/* Rich Content Editor with Toolbar */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Editor Top Navigation & Formatting Toolbar */}
            <div className="bg-slate-50/80 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEditorMode("write")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    editorMode === "write" ? "bg-[#0089C1] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Write Content
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    editorMode === "preview" ? "bg-[#0089C1] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Live Render Preview
                </button>
              </div>

              {/* Formatting Helper Buttons */}
              {editorMode === "write" && (
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => insertMarkdown("## Heading 2 Title")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Heading 2"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("### Heading 3 Title")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Heading 3"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("**Bold text**")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("*Italic text*")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("> **► WHAT THIS MEANS FOR OPERATORS:**\n> Executive compliance summary...")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Callout Blockquote"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("- Key obligation\n- Statutory penalty\n- Recommended action")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Bullet List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("| Obligation | Statutory Deadline | Governing Act |\n|:---|:---|:---|\n| CIT Return | 6 Months Post-FYE | Tax Act 2026 |")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Statutory Table"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("$$ \\text{Penalty} = \\text{Base FIRS Fine} + (\\text{Days Late} \\times ₦25,000) $$")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="KaTeX Math Formula"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Editor Workspace */}
            {editorMode === "write" ? (
              <div className="p-6">
                <textarea
                  rows={20}
                  placeholder="Draft your regulatory analysis using GitHub Flavored Markdown (headings, lists, blockquotes, statutory tables, and KaTeX formulas)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full font-mono text-xs leading-relaxed text-slate-900 bg-transparent border-0 focus:outline-none resize-y"
                />
              </div>
            ) : (
              <div className="p-8 sm:p-12 article-prose max-w-none text-slate-800 leading-relaxed text-sm">
                {previewHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <p className="text-slate-400 italic">No content written yet. Switch to &apos;Write Content&apos; tab to begin.</p>
                )}
              </div>
            )}
          </div>

          {/* SEO & Meta Settings Accordion */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-[#0089C1]" />
              <h3 className="text-sm font-extrabold text-slate-900">Search Engine Optimization (SEO) & Social Meta</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  placeholder="Custom search title (defaults to article title)"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Canonical URL</label>
                <input
                  type="text"
                  placeholder="https://www.compliancehub.ng/blog/..."
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meta Description</label>
              <textarea
                rows={2}
                placeholder="Search result snippet (defaults to executive excerpt)"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Configuration Area */}
        <div className="lg:col-span-4 space-y-6">
          {/* Category & Tags Configuration */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Statutory Classification
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Governing Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Statutory Provision Tags</label>
              <input
                type="text"
                placeholder="Comma-separated e.g. Tax Act 2026, FIRS, CIT"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Separate tags with commas.</span>
            </div>
          </div>

          {/* Authentic Nigerian Media Cover Image Picker */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Hero Cover Image
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Zero Unsplash
              </span>
            </div>

            {/* Current Image Preview */}
            <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 relative">
              <img
                src={coverImage}
                alt="Selected Cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Custom URL Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Image URL</label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://cdn.punchng.com/..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>

            {/* Nigerian Media Presets */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-2">Verified Nigerian Media Presets:</span>
              <div className="grid grid-cols-2 gap-2">
                {NIGERIAN_MEDIA_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverImage(preset.url)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      coverImage === preset.url
                        ? "border-[#0089C1] bg-sky-50/60 ring-2 ring-[#0089C1]/20"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-900 truncate">{preset.title}</div>
                    <div className="text-[9px] text-[#0089C1] font-semibold">{preset.source}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Author Accreditation Configuration */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Accredited Practitioner Author
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Author Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Author Title / Role</label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Author Bio</label>
              <textarea
                rows={2}
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
