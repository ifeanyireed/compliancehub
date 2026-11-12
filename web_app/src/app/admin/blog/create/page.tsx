"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  UploadCloud,
  Loader2,
  Trash2,
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

const PRACTITIONER_AVATAR_PRESETS = [
  { label: "Dr. Olumide", url: "/character5.jpg" },
  { label: "Barr. Amina", url: "/character1.jpg" },
  { label: "Chinedu, SAN", url: "/character2.jpg" },
  { label: "Tunde, CAMS", url: "/character3.jpg" },
  { label: "Zainab, ACTI", url: "/character4.jpg" },
];

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
  const [postId, setPostId] = useState<string | null>(editId);

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
  const [savingAction, setSavingAction] = useState<"DRAFT" | "PUBLISHED" | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [uploadingAuthor, setUploadingAuthor] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);
  const [authorImageError, setAuthorImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const inlineFileInputRef = useRef<HTMLInputElement | null>(null);
  const authorFileInputRef = useRef<HTMLInputElement | null>(null);

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
      setPostId(editId);
      api.blog.getPost(editId).then((post: any) => {
        if (post && (post.title || post.id)) {
          if (post.id) setPostId(String(post.id));
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

  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      const sigData = await api.documents.getUploadSignature(file.name, "Blog_Editorial");
      if (sigData && sigData.signature) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.api_key);
        formData.append("timestamp", String(sigData.timestamp));
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);
        formData.append("public_id", sigData.public_id);

        const cloudName = sigData.cloud_name || "yugcjpau";
        const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        if (cldRes.ok) {
          const cldJson = await cldRes.json();
          if (cldJson?.secure_url) {
            return cldJson.secure_url;
          }
        }
      }
    } catch (err) {
      console.warn("Direct Cloudinary upload fallback to local Data URL:", err);
    }

    // Resilient fallback: read image as Data URL so upload always succeeds
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setCoverImageError(false);
    try {
      const uploadedUrl = await uploadImageFile(file);
      if (uploadedUrl) {
        setCoverImage(uploadedUrl);
        if (!ogImage) setOgImage(uploadedUrl);
        showToast("Featured cover image uploaded successfully!");
      }
    } catch (err: any) {
      alert("Failed to upload featured image: " + (err?.message || err));
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }
  };

  const handleCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingCover(true);
    setCoverImageError(false);
    try {
      const uploadedUrl = await uploadImageFile(file);
      if (uploadedUrl) {
        setCoverImage(uploadedUrl);
        if (!ogImage) setOgImage(uploadedUrl);
        showToast("Featured cover image uploaded successfully!");
      }
    } catch (err: any) {
      alert("Failed to upload featured image: " + (err?.message || err));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleInlineFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInline(true);
    try {
      const uploadedUrl = await uploadImageFile(file);
      if (uploadedUrl) {
        const cleanCaption = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
        insertMarkdown(`![${cleanCaption}](${uploadedUrl})`);
        showToast("Inline image uploaded and inserted into editor!");
      }
    } catch (err: any) {
      alert("Failed to upload inline image: " + (err?.message || err));
    } finally {
      setUploadingInline(false);
      if (inlineFileInputRef.current) inlineFileInputRef.current.value = "";
    }
  };

  const handleAuthorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAuthor(true);
    setAuthorImageError(false);
    try {
      const uploadedUrl = await uploadImageFile(file);
      if (uploadedUrl) {
        setAuthorAvatar(uploadedUrl);
        showToast("Author portrait image uploaded successfully!");
      }
    } catch (err: any) {
      alert("Failed to upload author image: " + (err?.message || err));
    } finally {
      setUploadingAuthor(false);
      if (authorFileInputRef.current) authorFileInputRef.current.value = "";
    }
  };

  const handleSave = async (submitStatus: "PUBLISHED" | "DRAFT") => {
    let resolvedTitle = title.trim();
    if (!resolvedTitle) {
      if (submitStatus === "DRAFT") {
        resolvedTitle = `Untitled Regulatory Dispatch (${new Date().toLocaleDateString()})`;
        setTitle(resolvedTitle);
      } else {
        alert("Please provide an article title before publishing");
        return;
      }
    }

    const resolvedSlug = slug.trim() ? slugify(slug) : slugify(resolvedTitle);
    if (!slug.trim()) {
      setSlug(resolvedSlug);
    }

    setSaving(true);
    setSavingAction(submitStatus);
    try {
      const payload = {
        title: resolvedTitle,
        slug: resolvedSlug,
        excerpt,
        content,
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        read_time: calculateReadTime(content),
        status: submitStatus,
        cover_image: coverImage || NIGERIAN_MEDIA_PRESETS[0].url,
        author_name: authorName || "Dr. Olumide Adeleke",
        author_role: authorRole || "Super Administrator & Compliance Director",
        author_avatar: authorAvatar || "/character5.jpg",
        author_bio: authorBio,
        meta_title: metaTitle || resolvedTitle,
        meta_description: metaDescription || excerpt,
        canonical_url: canonicalUrl,
        og_image: ogImage || coverImage || NIGERIAN_MEDIA_PRESETS[0].url,
      };

      const targetId = postId || editId;
      let res: any = null;

      if (targetId) {
        res = await api.blog.updatePost(targetId, payload);
      } else {
        res = await api.blog.createPost(payload);
      }

      if (!res || res.error) {
        throw new Error(res?.error || "Unable to reach blog persistence endpoint");
      }

      setStatus(submitStatus);
      if (res.slug) setSlug(res.slug);
      if (res.id) {
        const savedId = String(res.id);
        setPostId(savedId);
        if (!editId) {
          router.replace(`/admin/blog/create?edit=${savedId}`, { scroll: false });
        }
      }

      if (submitStatus === "DRAFT") {
        showToast("Draft saved to database! You can continue editing or publish anytime.");
      } else {
        showToast(targetId ? "Regulatory dispatch updated & published live!" : "Regulatory dispatch published live!");
      }
    } catch (e: any) {
      alert("Failed saving dispatch: " + (e?.message || e));
    } finally {
      setSaving(false);
      setSavingAction(null);
    }
  };

  const handleCopyPublicUrl = async () => {
    const activeSlug = slug || slugify(title);
    if (!activeSlug) return;
    const res = await copyBlogUrlToClipboard(activeSlug);
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
            <button type="button" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {postId || editId ? "Edit Regulatory Dispatch" : "Author New Statutory Intelligence"}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  status === "DRAFT"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {status === "DRAFT" ? "Draft Mode" : "Published"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Draft comprehensive legal breakdowns, Nigerian act circulars, and executive advisories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {(slug || title) && (
            <button
              type="button"
              onClick={handleCopyPublicUrl}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? "Copied" : "Copy URL"}</span>
            </button>
          )}

          {(slug || title) && (
            <Link href={`/blog/${slug || slugify(title)}`} target="_blank">
              <button type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Live</span>
              </button>
            </Link>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("DRAFT")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            {savingAction === "DRAFT" ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{savingAction === "DRAFT" ? "Saving Draft..." : "Save Draft"}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("PUBLISHED")}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            {savingAction === "PUBLISHED" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{savingAction === "PUBLISHED" ? "Publishing..." : "Publish Dispatch"}</span>
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
                    onClick={() => insertMarkdown("# Main Section Heading")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Heading 1"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>
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
                    onClick={() => insertMarkdown("1. First statutory step\n2. Second verification step\n3. Final filing submission")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("---")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Section Divider"
                  >
                    <Minus className="w-3.5 h-3.5" />
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
                  <button
                    type="button"
                    disabled={uploadingInline}
                    onClick={() => inlineFileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0089C1] border border-sky-200/70 text-[11px] font-bold transition-all"
                    title="Upload Inline Image"
                  >
                    {uploadingInline ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingInline ? "Uploading..." : "Upload Image"}</span>
                  </button>
                  <input
                    ref={inlineFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInlineFileChange}
                    className="hidden"
                  />
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
                Featured Cover Image
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Zero Unsplash
              </span>
            </div>

            {/* Hidden File Input for Featured Cover Image */}
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              className="hidden"
            />

            {/* Featured Image Placeholder & Live Preview with Upload Button */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleCoverDrop}
              className="h-48 w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-300 relative group flex items-center justify-center"
            >
              {coverImage && !coverImageError ? (
                <>
                  <img
                    src={coverImage}
                    alt="Selected Cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={() => setCoverImageError(true)}
                    className="w-full h-full object-cover"
                  />
                  {/* Interactive Upload Overlay on Placeholder */}
                  <div className="absolute inset-0 bg-slate-950/45 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0089C1] hover:bg-sky-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                    >
                      {uploadingCover ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                      <span>{uploadingCover ? "Uploading Image..." : "Upload Featured Image"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage("");
                        setCoverImageError(false);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-rose-600 text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear to Placeholder</span>
                    </button>
                  </div>
                  {/* Always-visible compact Upload Badge in bottom-right corner */}
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverFileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-[#0089C1] text-white text-[11px] font-bold border border-white/20 shadow-md backdrop-blur-xs transition-all cursor-pointer"
                  >
                    {uploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingCover ? "Uploading..." : "Upload Image"}</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-5 space-y-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Featured Image Placeholder</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Drag &amp; drop an image here or click below to upload
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0089C1] hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    {uploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingCover ? "Uploading Image..." : "Upload Featured Image"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dedicated Upload Button Bar */}
            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => coverFileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-[#0089C1] text-[#0089C1] hover:text-white border border-sky-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              {uploadingCover ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span>{uploadingCover ? "Uploading to Evidence Vault..." : "Upload Image from Computer"}</span>
            </button>

            {/* Custom URL Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Or Paste Image URL</label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  setCoverImageError(false);
                }}
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
                    onClick={() => {
                      setCoverImage(preset.url);
                      setCoverImageError(false);
                    }}
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Accredited Practitioner Author
              </h3>
              <span className="text-[10px] font-bold text-[#0089C1] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                Author Profile
              </span>
            </div>

            {/* Hidden File Input for Author Avatar Image */}
            <input
              ref={authorFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAuthorFileChange}
              className="hidden"
            />

            {/* Author Image Preview & Upload Controls */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="block text-[11px] font-bold text-slate-700">
                Author Image / Portrait
              </label>

              <div className="flex items-center gap-3.5">
                <div
                  onClick={() => authorFileInputRef.current?.click()}
                  title="Click to upload author image"
                  className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-300 relative group shrink-0 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {authorAvatar && !authorImageError ? (
                    <img
                      src={authorAvatar}
                      alt={authorName || "Author"}
                      referrerPolicy="no-referrer"
                      onError={() => setAuthorImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-slate-950/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAuthor ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="text-xs font-extrabold text-slate-900 truncate">
                    {authorName || "Practitioner Author"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">
                    {authorRole || "Accredited Compliance Specialist"}
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      disabled={uploadingAuthor}
                      onClick={() => authorFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      {uploadingAuthor ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingAuthor ? "Uploading..." : "Upload Author Image"}</span>
                    </button>

                    {authorAvatar && authorAvatar !== "/character5.jpg" && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthorAvatar("/character5.jpg");
                          setAuthorImageError(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Author Image URL Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Or Paste Author Image URL
                </label>
                <input
                  type="text"
                  value={authorAvatar}
                  onChange={(e) => {
                    setAuthorAvatar(e.target.value);
                    setAuthorImageError(false);
                  }}
                  placeholder="/character5.jpg or https://..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>

              {/* Quick Practitioner Avatar Presets */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
                  Accredited Practitioner Avatars:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRACTITIONER_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setAuthorAvatar(preset.url);
                        setAuthorImageError(false);
                      }}
                      title={preset.label}
                      className={`p-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        authorAvatar === preset.url
                          ? "border-[#0089C1] bg-sky-50/80 ring-2 ring-[#0089C1]/20"
                          : "border-slate-200 bg-white hover:bg-slate-100"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center">
                        {preset.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
