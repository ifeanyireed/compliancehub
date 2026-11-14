"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  FileText, 
  Search, 
  Tag, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Bookmark,
  Share2,
  Eye,
  Mail,
  CheckCircle2,
  Calendar,
  Layers,
  Scale
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";
import { api } from "@/lib/api";
import { MotionCard, MotionSection, defaultEase } from "@/components/motion/MotionTransitions";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
  category: string;
  tags: string[];
  read_time: string;
  status: string;
  cover_image: string;
  view_count?: number;
  published_at: string;
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  post_count?: number;
}

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "All",
    "Taxation & FIRS",
    "Data Privacy & NDPA",
    "Corporate & CAC",
    "AML & SCUML",
    "Labour & Pension",
    "Immigration & Expatriate"
  ]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Newsletter state
  const [subEmail, setSubEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [subMessage, setSubMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [postsRes, catsRes] = await Promise.all([
          api.blog.getPosts({ status: "PUBLISHED" }),
          api.blog.getCategories()
        ]);

        if (Array.isArray(postsRes) && postsRes.length > 0) {
          setPosts(postsRes);
        }
        if (Array.isArray(catsRes) && catsRes.length > 0) {
          const catNames = ["All", ...catsRes.map((c: any) => c.name)];
          setCategories(Array.from(new Set(catNames)));
        }
      } catch (err) {
        console.warn("Failed loading live blog data, using fallbacks:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail || !subEmail.includes("@")) return;

    setSubStatus("loading");
    try {
      const res = await api.blog.subscribe(subEmail, "BLOG_DIRECTORY_HEADER");
      if (res && res.success) {
        setSubStatus("success");
        setSubMessage("Successfully subscribed to ComplianceHub Statutory Alerts!");
        setSubEmail("");
      } else {
        setSubStatus("error");
        setSubMessage(res?.error || "Could not register subscription. Please try again.");
      }
    } catch {
      setSubStatus("error");
      setSubMessage("Subscription service unavailable.");
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const standardPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] flex flex-col font-sans">
      <CompliancePublicNav />

      <main className="flex-1 pb-24">
        {/* Header Hero Banner */}
        <section className="bg-white border-b border-slate-200/80 pt-16 pb-12 px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: defaultEase }}
            className="max-w-6xl mx-auto"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200/70 text-[#0089C1] text-xs font-bold mb-4">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Regulatory Intelligence & Statutory Dispatches</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  The Compliance Journal
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                  Operational breakdowns, deadline schedules, and statutory advisories covering the 2026 Nigeria Tax Act, NDPA 2023, CAMA 2020, and EFCC SCUML oversight.
                </p>
              </div>

              {/* Newsletter Quick Card */}
              <div className="w-full md:w-96 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                  <Mail className="w-4 h-4 text-[#0089C1]" />
                  <span>Receive Statutory Alerts</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 font-medium">
                  Stay ahead of FIRS, CAC, and NDPC statutory deadlines every Monday morning.
                </p>
                {subStatus === "success" ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{subMessage}</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="compliance@yourcompany.ng"
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                    />
                    <button
                      type="submit"
                      disabled={subStatus === "loading"}
                      className="px-3.5 py-2 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all shrink-0"
                    >
                      {subStatus === "loading" ? "..." : "Join"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === cat
                        ? "bg-[#0089C1] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search statutes, circulars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Articles Content Container */}
        <section className="max-w-6xl mx-auto px-6 mt-10">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No regulatory articles match your filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching for another keyword or switch category to view published circulars.
              </p>
              <button
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Featured Lead Post */}
              {featuredPost && (
                <MotionCard hoverEffect className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto relative overflow-hidden bg-slate-900">
                      <img
                        src={featuredPost.cover_image}
                        alt={featuredPost.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                          Featured Intelligence
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-md bg-sky-50 text-[#0089C1] text-[11px] font-bold border border-sky-200/60">
                            {featuredPost.category}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                            <Clock className="w-3 h-3" />
                            {featuredPost.read_time}
                          </span>
                          {featuredPost.view_count !== undefined && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold ml-auto">
                              <Eye className="w-3 h-3" />
                              {Number(featuredPost.view_count || 0).toLocaleString()} {featuredPost.view_count === 1 ? "read" : "reads"}
                            </span>
                          )}
                        </div>

                        <Link href={`/blog/${featuredPost.slug}`}>
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-[#0089C1] transition-colors leading-snug">
                            {featuredPost.title}
                          </h2>
                        </Link>

                        <p className="mt-3 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-medium">
                          {featuredPost.excerpt}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {featuredPost.author_avatar ? (
                            <img
                              src={featuredPost.author_avatar}
                              alt={featuredPost.author_name}
                              referrerPolicy={featuredPost.author_avatar.startsWith("http") ? "no-referrer" : undefined}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center border border-slate-200 shrink-0">
                              {(featuredPost.author_name || "A").trim().charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-slate-800">{featuredPost.author_name}</div>
                            <div className="text-[10px] text-slate-400">{featuredPost.author_role}</div>
                          </div>
                        </div>

                        <Link
                          href={`/blog/${featuredPost.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0089C1] hover:text-sky-600"
                        >
                          <span>Read Full Story</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </MotionCard>
              )}

              {/* Grid of Remaining Posts */}
              {standardPosts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Statutory Briefs</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                      {standardPosts.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {standardPosts.map((post, idx) => (
                      <MotionCard
                        key={post.id}
                        hoverEffect
                        delay={idx * 0.05}
                        className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-[#0089C1] text-[10px] font-bold shadow-xs">
                                {post.category}
                              </span>
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mb-2">
                              <Clock className="w-3 h-3" />
                              <span>{post.read_time}</span>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : "Statutory"}</span>
                              {post.view_count !== undefined && (
                                <span className="ml-auto flex items-center gap-1 text-slate-400">
                                  <Eye className="w-3 h-3" />
                                  {Number(post.view_count || 0).toLocaleString()}
                                </span>
                              )}
                            </div>

                            <Link href={`/blog/${post.slug}`}>
                              <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0089C1] transition-colors leading-snug line-clamp-2">
                                {post.title}
                              </h4>
                            </Link>

                            <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                            {post.author_name}
                          </div>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-xs font-bold text-[#0089C1] hover:underline flex items-center gap-1"
                          >
                            <span>Read</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </MotionCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
