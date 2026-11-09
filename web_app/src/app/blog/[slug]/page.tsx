"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Share2, 
  Bookmark, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  Scale,
  Eye,
  MessageSquare,
  Send,
  Check,
  ExternalLink
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";
import { api } from "@/lib/api";
import { renderMarkdownAndMath } from "@/lib/markdown";
import { loadKaTeX } from "@/lib/math-renderer";
import { copyBlogUrlToClipboard } from "@/lib/blog-utils";

interface Comment {
  id: number;
  post_id: number;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
  author_bio?: string;
  category: string;
  tags: string[];
  read_time: string;
  status: string;
  cover_image: string;
  view_count?: number;
  published_at: string;
}

const FALLBACK_POST: BlogPost = {
  id: 1,
  title: "Navigating the 2026 Nigeria Tax Act: A Corporate Guide to Withholding, CIT, and TaxPro-MAX",
  slug: "navigating-2026-nigeria-tax-act-corporate-guide",
  excerpt: "Comprehensive operational breakdown of the sweeping 2026 Nigerian tax reforms and what managing directors must change in their monthly payroll and CIT calculations.",
  content: `## 1. Overview of the 2026 Tax Legislative Framework

The Federal Government of Nigeria implemented the comprehensive Nigeria Tax Act with an effective enforcement date of January 1, 2026. This legislation consolidates corporate income tax (CIT), value-added tax (VAT), and digital service remittances into a unified administrative portal.

Corporate compliance officers and directors of Nigerian companies must adjust internal fiscal workflows to remain fully compliant with the FIRS and State Internal Revenue Services (SIRS).

---

## 2. Key Statutory Reforms & Operational Shifts

### A. Zero-Rated Threshold Adjustments
Small businesses with gross turnover below **₦50,000,000** are exempt from 30% CIT rates. However, statutory return filings remain mandatory on TaxPro-MAX. Failure to submit nil returns attracts automatic administrative late-filing fines of **₦50,000 in the first month** and **₦25,000 per subsequent month**.

### B. Automated Digital Withholding Tax Credit Notes
Historically, companies suffered delays of 6 to 18 months obtaining physical Withholding Tax (WHT) credit notes. Under the 2026 Tax Act digital regime, withholding deductions made via TaxPro-MAX generate dynamic, tamper-evident digital credit vouchers tied directly to recipient Taxpayer Identification Numbers (TINs).

### C. Unified Monthly VAT Remittance Timeline
VAT returns remain due strictly on the **21st day** of every subsequent month. The new portal automatically cross-references submitted invoices against e-invoicing data recorded by registered vendors.

---

## 3. Statutory Deadlines Summary Table

| Filing Type | Statutory Due Date | Governing Provision | Non-Compliance Risk |
|:---|:---|:---|:---|
| **Monthly VAT** | 21st of following month | Nigeria Tax Act 2026 s.14 | ₦50,000 first month + interest |
| **Corporate Income Tax (CIT)** | 6 months post-financial year | CITA s.55 / Tax Act 2026 | Daily accrual fines + freeze order |
| **PAYE Annual Return (Form H1)** | January 31 annually | PITA s.81 | Up to ₦500,000 administrative penalty |
| **Withholding Tax Remittance** | 21st of following month | FIRS Regulations 2026 | 10% penalty + commercial interest |

---

## 4. Operational Checklist for Nigerian Companies

1. **Conduct a Vendor TIN Audit**: Ensure all external service providers have verified corporate TINs linked to their CAC RC numbers.
2. **Review Employment Contracts**: Confirm gross pay structuring conforms to current consolidated relief allowance schedules.
3. **Engage an Accredited Tax Practitioner**: Complex corporate transactions require certified CITN or ICAN chartered review to avoid retrospective liabilities.`,
  author_name: "Tunde Bakare, CAMS",
  author_role: "Senior AML & Regulatory Officer",
  author_avatar: "https://res.cloudinary.com/yugcjpau/image/upload/v1794187304/compliancehub/authors/tunde_bakare.jpg",
  author_bio: "Fellow of the Institute of Chartered Accountants of Nigeria (ICAN) and Certified Anti-Money Laundering Specialist with over 14 years advising commercial banks and multinational entities across Lagos and Abuja.",
  category: "Taxation & FIRS",
  tags: ["Tax Act 2026", "FIRS", "TaxPro-MAX", "CIT", "Corporate Tax"],
  read_time: "5 min read",
  status: "PUBLISHED",
  cover_image: "https://res.cloudinary.com/yugcjpau/image/upload/v1794187614/compliancehub/blog/firs_tax_act_2026_guide.jpg",
  view_count: 0,
  published_at: "2026-02-01"
};

export default function SingleBlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost>(FALLBACK_POST);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [views, setViews] = useState<number>(0);
  const [renderedHtml, setRenderedHtml] = useState<string>(() => renderMarkdownAndMath(FALLBACK_POST.content));
  const [copied, setCopied] = useState(false);

  // New Comment Form
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    async function loadPostData() {
      if (!slug) return;

      try {
        const data = await api.blog.getPost(slug);
        if (data && data.title) {
          setPost(data);
          setViews(Number(data.view_count) || 0);
          if (Array.isArray(data.comments)) {
            setComments(data.comments);
          }
          if (Array.isArray(data.related_posts)) {
            setRelatedPosts(data.related_posts);
          }
        }
      } catch (err) {
        console.warn("Using fallback post data:", err);
      }
    }
    loadPostData();
  }, [slug]);

  // Render markdown & KaTeX formulas
  useEffect(() => {
    if (post.content) {
      setRenderedHtml(renderMarkdownAndMath(post.content));

      loadKaTeX().then((katex) => {
        if (katex) {
          setRenderedHtml(renderMarkdownAndMath(post.content));
        }
      });
    }
  }, [post.content]);

  // Increment view counter once per browser session
  useEffect(() => {
    if (!slug) return;
    const sessionKey = `compliancehub_viewed_blog_${slug}`;
    if (typeof window !== "undefined" && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      api.blog.incrementView(slug).then((res) => {
        if (res && typeof res.view_count === "number") {
          setViews(res.view_count);
        } else {
          setViews((prev) => prev + 1);
        }
      }).catch(() => {
        setViews((prev) => prev + 1);
      });
    }
  }, [slug]);

  const handleCopyLink = async () => {
    const res = await copyBlogUrlToClipboard(slug || post.slug);
    if (res.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !authorName.trim() || !post.id) return;

    setCommentSubmitting(true);
    try {
      const res = await api.blog.createComment({
        post_id: post.id,
        author_name: authorName,
        author_email: authorEmail,
        content: commentContent
      });

      if (res && res.id) {
        setComments(prev => [...prev, res]);
        setCommentContent("");
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 4000);
      }
    } catch (e) {
      console.warn("Failed posting comment:", e);
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] flex flex-col font-sans">
      <CompliancePublicNav />

      <main className="flex-1 pb-24">
        {/* Top Breadcrumb Bar */}
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-4">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to The Compliance Journal</span>
          </Link>
        </div>

        {/* Article Container */}
        <article className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#0089C1]/10 text-[#0089C1] text-xs font-bold border border-[#0089C1]/20">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {post.read_time}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                Published {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Statutory"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold ml-auto">
                <Eye className="w-3.5 h-3.5 text-[#0089C1]" />
                {views.toLocaleString()} verified {views === 1 ? "read" : "reads"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              {post.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium mb-6">
              {post.excerpt}
            </p>

            {/* Author Card & Actions */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={post.author_avatar || "/character1.jpg"}
                  alt={post.author_name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-300 shadow-xs"
                />
                <div>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>{post.author_name}</span>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{post.author_role}</div>
                </div>
              </div>

              {/* Share & Copy Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Share Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hero Cover Image (Real Nigerian Media with referrerpolicy no-referrer) */}
          <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-md mb-10 relative bg-slate-900">
            <img
              src={post.cover_image}
              alt={post.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Statutory Advisory Notice Callout */}
          <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-6 mb-10 flex items-start gap-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#0089C1] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-sky-950 mb-1">
                Statutory Advisory Notice
              </h4>
              <p className="text-xs text-sky-800 leading-relaxed font-medium">
                This intelligence dispatch is curated by accredited Nigerian regulatory compliance practitioners. For bespoke corporate tax filing, NDPC data protection audit sign-off, or SCUML DNFBP certification, engage an accredited specialist directly via HubExperts.
              </p>
            </div>
          </div>

          {/* Article Body Content (Rich Markdown + Math Rendering) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
            <div 
              className="article-prose max-w-none text-slate-800 leading-relaxed text-sm sm:text-base font-normal"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />

            {/* Statutory Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Related Statutory Provisions
                </span>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Author Bio Card */}
          {post.author_bio && (
            <div className="mt-10 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <img
                src={post.author_avatar || "/character1.jpg"}
                alt={post.author_name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-300 shadow-xs shrink-0"
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">About the Author</div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">{post.author_name}</div>
                <div className="text-xs font-semibold text-[#0089C1] mb-2">{post.author_role}</div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {post.author_bio}
                </p>
              </div>
            </div>
          )}

          {/* Interactive Comments Section */}
          <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-[#0089C1]" />
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Statutory Discussion & Inquiries ({comments.length})
              </h3>
            </div>

            {/* List of Comments */}
            {comments.length > 0 ? (
              <div className="space-y-4 mb-8">
                {comments.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800">{c.author_name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-6 italic">
                No inquiries posted yet. Be the first corporate officer to join the discussion.
              </p>
            )}

            {/* Post Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-4 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave an Inquiry or Clarification</h4>

              {commentSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Inquiry posted successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Full Name / Title"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
                <input
                  type="email"
                  placeholder="Official Email Address"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>

              <textarea
                rows={3}
                placeholder="Submit your regulatory inquiry or question for our compliance practitioners..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{commentSubmitting ? "Submitting..." : "Post Inquiry"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Related Articles Section */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">
                Related Regulatory Dispatches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rel) => (
                  <Link 
                    key={rel.id} 
                    href={`/blog/${rel.slug}`}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-sky-50 text-[#0089C1] text-[10px] font-bold">
                        {rel.category}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#0089C1] transition-colors mt-2 leading-snug line-clamp-2">
                        {rel.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {rel.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#0089C1] mt-4">
                      <span>Read Brief</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action Card: HubExperts Marketplace */}
          <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                HubExperts Advisory
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                Need bespoke counsel on this regulation?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                Connect with vetted Nigerian compliance practitioners, licensed DPCOs, and chartered tax professionals on ComplianceHub.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link href="/experts" className="w-full md:w-auto">
                <button className="w-full px-5 py-3 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2">
                  <span>Browse Accredited Specialists</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </article>
      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
