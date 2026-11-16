"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Share2, 
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
  ExternalLink,
  Loader2,
  Mail,
  Copy,
  MessageCircle
} from "lucide-react";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";
import { api } from "@/lib/api";
import { renderMarkdownAndMath } from "@/lib/markdown";
import { loadKaTeX } from "@/lib/math-renderer";
import { copyBlogUrlToClipboard } from "@/lib/blog-utils";
import { MotionSection, MotionCard, defaultEase } from "@/components/motion/MotionTransitions";

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

export default function SingleBlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [views, setViews] = useState<number>(0);
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Comment state & Reply targeting
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Newsletter Subscription state
  const [subEmail, setSubEmail] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [subMsg, setSubMsg] = useState("");

  useEffect(() => {
    async function loadPostData() {
      if (!slug) return;
      setLoading(true);

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
        console.warn("Failed fetching post:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPostData();
  }, [slug]);

  // Render markdown & KaTeX formulas
  useEffect(() => {
    if (post?.content) {
      setRenderedHtml(renderMarkdownAndMath(post.content));

      loadKaTeX().then((katex) => {
        if (katex && post?.content) {
          setRenderedHtml(renderMarkdownAndMath(post.content));
        }
      });
    }
  }, [post?.content]);

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
    const res = await copyBlogUrlToClipboard(slug || post?.slug || "");
    if (res.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = (platform: "whatsapp" | "twitter" | "linkedin" | "facebook" | "email") => {
    const url = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
    const title = encodeURIComponent(post?.title || "Check out this compliance dispatch on ComplianceHub.ng");
    let shareUrl = "";

    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${title}%20${url}`, "_blank");
      return;
    } else if (platform === "facebook") {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}&via=compliancehubng`;
    } else if (platform === "linkedin") {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    } else if (platform === "email") {
      window.location.href = `mailto:?subject=${title}&body=Read this regulatory compliance dispatch: ${url}`;
      return;
    }

    const width = 600;
    const height = 400;
    const left = typeof window !== "undefined" ? window.innerWidth / 2 - width / 2 : 0;
    const top = typeof window !== "undefined" ? window.innerHeight / 2 - height / 2 : 0;
    window.open(shareUrl, "share_popup", `width=${width},height=${height},top=${top},left=${left},scrollbars=no,resizable=no`);
  };

  const handleReplyClick = (userName: string) => {
    setReplyingTo(userName);
    setCommentContent(`@${userName} `);
    if (commentTextareaRef.current) {
      commentTextareaRef.current.focus();
      commentTextareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !authorName.trim() || !post?.id) return;

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
        setReplyingTo(null);
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 4000);
      }
    } catch (e) {
      console.warn("Failed posting comment:", e);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail || !subEmail.includes("@")) return;

    setSubLoading(true);
    setSubMsg("");
    try {
      await api.blog.subscribe(subEmail, "SINGLE_POST_HERO_FOOTER");
      setSubSuccess(true);
      setSubMsg("Subscribed successfully! Weekly regulatory briefs will arrive in your inbox.");
      setSubEmail("");
    } catch (err: any) {
      setSubMsg(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setSubLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
        <div className="flex-1 flex flex-col items-center justify-center p-16">
          <Loader2 className="w-10 h-10 animate-spin text-[#0089C1] mb-3" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Regulatory Dispatch...</p>
        </div>
        <CompliancePublicFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Dispatch Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm">The requested regulatory intelligence briefing does not exist or has been archived.</p>
          <Link href="/blog">
            <button className="px-5 py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white text-xs font-bold transition-all">
              Return to Compliance Journal
            </button>
          </Link>
        </div>
        <CompliancePublicFooter />
      </div>
    );
  }

  const formattedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Current Edition";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Sticky Floating Glassmorphic Back Button */}
      <div className="fixed top-5 left-4 sm:left-6 z-50 pointer-events-auto">
        <Link 
          href="/blog" 
          className="group flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-950/85 hover:bg-slate-900 text-white backdrop-blur-md text-xs font-bold transition-all shadow-2xl border border-white/20 hover:border-[#0089C1]/60 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0089C1] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Compliance Journal</span>
        </Link>
      </div>

      {/* Hero Cover Image (Full Width with Overlapping Depth) */}
      <div className="w-full h-[48vh] sm:h-[55vh] relative bg-slate-950 overflow-hidden">
        <img
          src={post.cover_image || "https://res.cloudinary.com/ihfqdysu/image/upload/v1790686487/ofia_ng_assets/bzilvzajdn8pxlx2m0bb.png"}
          alt={post.title}
          referrerPolicy="no-referrer"
          loading="eager"
          className="w-full h-full object-cover opacity-90 scale-100 hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-black/40" />
      </div>

      {/* Main Container Overlapping Hero */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-8" style={{ marginTop: "-22vh" }}>
        
        {/* Card 1: Meta Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: defaultEase }}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-12"
        >
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span className="px-3 py-1 rounded-full bg-[#0089C1]/10 text-[#0089C1] text-xs font-extrabold uppercase tracking-wider border border-[#0089C1]/20">
              {post.category || "Regulatory Intelligence"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {post.read_time || "5 min read"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-full ml-auto">
              <Eye className="w-3.5 h-3.5 text-[#0089C1]" />
              {views.toLocaleString()} verified {views === 1 ? "read" : "reads"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-6 text-display">
            {post.title}
          </h1>

          {post.excerpt && (
            <div className="border-l-4 border-[#0089C1] bg-sky-50/50 pl-5 pr-4 py-3 rounded-r-2xl mb-8">
              <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed italic">
                &ldquo;{post.excerpt}&rdquo;
              </p>
            </div>
          )}

          {/* Author Block & Quick Header Share */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {post.author_avatar ? (
                <img
                  src={post.author_avatar}
                  alt={post.author_name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white text-sm font-black flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
                  {(post.author_name || "A").trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>{post.author_name}</span>
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs text-slate-500 font-medium">{post.author_role || "Accredited Regulatory Specialist"}</div>
              </div>
            </div>

            {/* Mobile / Header Share Button */}
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-2 shadow-2xs self-start sm:self-auto cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">Permalink Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Dispatch Link</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Card 2: Main Prose Content Card with Floating Sticky Social Share Dock */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: defaultEase }}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-12 relative"
        >
          {/* Floating Sticky Share Dock on Desktop */}
          <div className="hidden lg:flex flex-col items-center gap-3 w-10 absolute top-12 -left-16 z-20">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Share</span>
            
            {/* WhatsApp */}
            <button
              onClick={() => handleShare("whatsapp")}
              title="Share via WhatsApp"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.085-1.921-.453-1.464-.613-2.457-2.094-2.53-2.193-.072-.098-.592-.79-1.025-.79-.434 0-.649.196-.867.414-.217.218-.847.83-.847 2.025 0 1.196.868 2.348.988 2.511.12.164 1.706 2.605 4.133 3.653.577.249 1.028.398 1.38.511.58.185 1.109.158 1.527.096.467-.07 1.436-.587 1.639-1.154.202-.566.202-1.052.142-1.154-.061-.102-.224-.163-.468-.284z"/>
              </svg>
            </button>

            {/* X / Twitter */}
            <button
              onClick={() => handleShare("twitter")}
              title="Share on X"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => handleShare("linkedin")}
              title="Share on LinkedIn"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24m1.39 9.74v-8.37H5.07v8.37z"/>
              </svg>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleShare("facebook")}
              title="Share on Facebook"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.704 0-1.22.149-1.542.447-.323.298-.485.815-.485 1.551v1.982h4.595l-.598 3.667h-3.997v7.98z"/>
              </svg>
            </button>

            {/* Email */}
            <button
              onClick={() => handleShare("email")}
              title="Forward via Email"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Statutory Advisory Notice Callout */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#0089C1] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-950 mb-1">
                Statutory Advisory Notice
              </h4>
              <p className="text-xs text-sky-900 leading-relaxed font-medium">
                This intelligence dispatch is curated by accredited Nigerian regulatory compliance practitioners. For bespoke corporate tax filing, NDPC data protection audit sign-off, or SCUML DNFBP certification, engage an accredited specialist directly via HubExperts.
              </p>
            </div>
          </div>

          {/* Article Prose Content (Markdown + KaTeX Math) */}
          <article 
            className="article-prose prose prose-lg prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base font-normal"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />

          {/* Tag Pills */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Statutory Tags:</span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-sky-50 hover:text-[#0089C1] transition-colors"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Mobile Bottom Share Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex lg:hidden items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Share Dispatch:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => handleShare("whatsapp")} className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><Share2 className="w-4 h-4" /></button>
              <button onClick={() => handleShare("twitter")} className="p-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100"><Mail className="w-4 h-4" /></button>
              <button onClick={handleCopyLink} className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"><Copy className="w-4 h-4" /></button>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Author Bio Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: defaultEase }}
          className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left"
        >
          {post.author_avatar ? (
            <img
              src={post.author_avatar}
              alt={post.author_name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover border border-slate-300 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white text-2xl font-black flex items-center justify-center border border-slate-300 shadow-xs shrink-0">
              {(post.author_name || "A").trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">About the Author</div>
            <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center justify-center md:justify-start gap-2">
              <span>{post.author_name}</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </h3>
            <p className="text-xs font-semibold text-[#0089C1] mb-2">{post.author_role || "Accredited Nigerian Compliance Practitioner"}</p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {post.author_bio || "Curating authoritative regulatory intelligence, CAMA 2020 corporate structuring, and NDPC statutory audit defense for Nigerian enterprises and multinational subsidiaries."}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
              <button onClick={() => handleShare("whatsapp")} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors" title="Share via WhatsApp">
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleShare("twitter")} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 flex items-center justify-center transition-colors" title="Share on X">
                <Mail className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleCopyLink} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors" title="Copy link">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Threaded Inquiries & Discussion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: defaultEase }}
          className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0089C1]" />
              <span>Statutory Discussion & Inquiries ({comments.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Moderated for Legal Officers</span>
          </div>

          {/* List of Comments */}
          {comments.length > 0 ? (
            <div className="space-y-4 mb-8">
              {comments.map((c) => (
                <div key={c.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">{c.author_name}</span>
                    <button
                      type="button"
                      onClick={() => handleReplyClick(c.author_name)}
                      className="text-[11px] font-bold text-[#0089C1] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mb-2">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/60 text-center mb-8">
              <p className="text-xs text-slate-500 italic">
                No corporate inquiries posted yet. Be the first compliance officer to raise a question.
              </p>
            </div>
          )}

          {/* Inquiry Submission Form */}
          <form onSubmit={handleCommentSubmit} className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave an Inquiry or Clarification</h4>
              {replyingTo && (
                <button
                  type="button"
                  onClick={() => { setReplyingTo(null); setCommentContent(""); }}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  &times; Cancel reply to @{replyingTo}
                </button>
              )}
            </div>

            {commentSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Inquiry posted successfully! Our compliance advisory team will review.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full Name & Title (e.g. Funke Adeleke, Legal Counsel)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
              <input
                type="email"
                placeholder="Corporate Email Address"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                required
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>

            <textarea
              ref={commentTextareaRef}
              rows={4}
              placeholder="Submit your regulatory inquiry or question for our accredited compliance specialists..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentSubmitting}
                className="px-6 py-3 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{commentSubmitting ? "Submitting..." : "Post Inquiry"}</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Card 5: Dedicated Inline Newsletter Subscription Card (Ofia Pattern) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: defaultEase }}
          className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center relative overflow-hidden shadow-xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-[#38BDF8] flex items-center justify-center mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-white text-display mb-2">Subscribe to The Compliance Journal</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Get the latest Nigerian statutory updates, CAC filing alerts, FIRS TaxPro-MAX circulars, and NDPC data protection briefs delivered straight to your inbox.
          </p>

          {subMsg && (
            <div className={`p-3 rounded-xl text-xs font-bold mb-4 max-w-md w-full ${subSuccess ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}>
              {subMsg}
            </div>
          )}

          <form onSubmit={handleSubscribe} className="flex w-full max-w-md mx-auto relative">
            <input
              type="email"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              placeholder="Enter corporate email..."
              required
              className="w-full px-5 py-3.5 rounded-full bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0089C1] pr-32"
            />
            <button
              type="submit"
              disabled={subLoading}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-6 rounded-full bg-[#0089C1] hover:bg-sky-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {subLoading ? "..." : "Subscribe"}
            </button>
          </form>
          <span className="text-[10px] text-slate-500 mt-3">Zero spam. Verified Nigerian regulatory intelligence only. Unsubscribe anytime.</span>
        </motion.div>

        {/* Card 6: Related Regulatory Dispatches Grid */}
        {relatedPosts.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight text-display">
                Related Regulatory Dispatches
              </h3>
              <Link href="/blog" className="text-xs font-bold text-[#0089C1] hover:underline">
                View all articles &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="h-40 bg-slate-900 overflow-hidden relative">
                    <img
                      src={rel.cover_image || "https://res.cloudinary.com/ihfqdysu/image/upload/v1790686487/ofia_ng_assets/bzilvzajdn8pxlx2m0bb.png"}
                      alt={rel.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#0089C1] uppercase tracking-wider block mb-1.5">
                        {rel.category}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0089C1] transition-colors leading-snug line-clamp-2">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                        {rel.excerpt}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Link
                        href={`/blog/${rel.slug}`}
                        className="text-xs font-bold text-[#0089C1] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Read full brief</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card 7: HubExperts Advisory Marketplace Callout */}
        <MotionCard hoverEffect className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
              HubExperts Advisory
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-2 text-display">
              Need bespoke counsel on this regulation?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md leading-relaxed">
              Connect with vetted Nigerian compliance practitioners, licensed DPCOs, and chartered tax professionals on ComplianceHub.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link href="/experts" className="w-full md:w-auto">
              <button className="w-full px-6 py-3.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all">
                <span>Browse Accredited Specialists</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </MotionCard>
      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
