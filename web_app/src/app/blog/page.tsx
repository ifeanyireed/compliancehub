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
  Share2
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";

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
  published_at: string;
}

const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "Navigating the 2026 Nigeria Tax Act: A Corporate Guide to Withholding, CIT, and TaxPro-MAX",
    slug: "navigating-2026-nigeria-tax-act-corporate-guide",
    excerpt: "Comprehensive operational breakdown of the sweeping 2026 Nigerian tax reforms and what managing directors must change in their monthly payroll and CIT calculations.",
    content: "Under the 2026 Nigeria Tax Act...",
    author_name: "Tunde Bakare, CAMS",
    author_role: "Senior AML & Regulatory Officer",
    author_avatar: "/character1.jpg",
    category: "Taxation & FIRS",
    tags: ["Tax Act 2026", "FIRS", "TaxPro-MAX", "CIT"],
    read_time: "5 min read",
    status: "PUBLISHED",
    cover_image: "/article_professional.jpg",
    published_at: "2026-02-01"
  },
  {
    id: 2,
    title: "NDPA 2023 Statutory Compliance: March 15 Data Protection Audit Filing Deadlines",
    slug: "ndpa-2023-statutory-compliance-march-15-filing-deadlines",
    excerpt: "The Nigeria Data Protection Commission (NDPC) mandates all Major Data Controllers to conduct and submit external DPCO audits. Here is your roadmap to audit compliance.",
    content: "Under Section 48 of the NDPA 2023...",
    author_name: "Chiamaka Eze",
    author_role: "Principal Partner, Apex Advisory",
    author_avatar: "/character2.jpg",
    category: "Data Privacy & NDPA",
    tags: ["NDPA", "NDPC", "Data Audit", "Privacy"],
    read_time: "6 min read",
    status: "PUBLISHED",
    cover_image: "/article_health.jpg",
    published_at: "2026-01-28"
  },
  {
    id: 3,
    title: "CAMA 2020 Annual Returns Checklist: Avoiding the CAC Inactive Entity Tag",
    slug: "cama-2020-cac-annual-returns-avoid-inactive-status",
    excerpt: "CAC has intensified delisting procedures for delinquent corporations. Learn the exact requirements, filing windows, and board resolution formats.",
    content: "Under Section 377 of CAMA 2020...",
    author_name: "Barr. Emeka Okonjo",
    author_role: "Corporate Secretarial Lead",
    author_avatar: "/character3.jpg",
    category: "Corporate & CAC",
    tags: ["CAC", "CAMA 2020", "Annual Returns", "PSC"],
    read_time: "4 min read",
    status: "PUBLISHED",
    cover_image: "/article_realestate.jpg",
    published_at: "2026-01-20"
  },
  {
    id: 4,
    title: "DNFBPs and the SCUML Framework: Essential AML/CFT Rules for 2026",
    slug: "scuml-aml-cft-rules-for-dnfbps-in-nigeria",
    excerpt: "Designated Non-Financial Businesses & Professions face stringent anti-money laundering reporting requirements under NFIU and EFCC scrutiny.",
    content: "Under the Money Laundering Act 2022...",
    author_name: "Tunde Bakare, CAMS",
    author_role: "Senior AML & Regulatory Officer",
    author_avatar: "/character1.jpg",
    category: "AML & SCUML",
    tags: ["SCUML", "AML/CFT", "NFIU", "EFCC"],
    read_time: "7 min read",
    status: "PUBLISHED",
    cover_image: "/antifake-analytics.jpg",
    published_at: "2026-01-15"
  }
];

const CATEGORIES = [
  "All",
  "Taxation & FIRS",
  "Data Privacy & NDPA",
  "Corporate & CAC",
  "AML & SCUML"
];

export default function BlogPublicPage() {
  const [posts, setPosts] = useState<BlogPost[]>(FALLBACK_POSTS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/blog`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPosts(data);
          }
        }
      } catch (err) {
        console.warn("Using fallback regulatory posts", err);
      }
    }
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts[0] || FALLBACK_POSTS[0];

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] flex flex-col font-sans">
      <CompliancePublicNav />

      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <section className="pt-12 pb-16 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-xs mb-4">
              <span className="w-2 h-2 rounded-full bg-[#0089C1] animate-pulse" />
              <span className="text-xs font-bold text-slate-800">ComplianceHub Intelligence Blog</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Nigerian Regulatory & Legal <span className="text-[#0089C1]">Intelligence</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
              Authoritative statutory analysis, 2026 Nigeria Tax Act briefings, NDPA compliance checklists, and practical CAMA 2020 operational guidance.
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-[#0089C1] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles, acts, TINs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>
          </div>

          {/* Featured Article Card */}
          {selectedCategory === "All" && searchQuery === "" && featuredPost && (
            <div className="mb-14">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden hover:shadow-xl transition-all grid grid-cols-1 lg:grid-cols-12 group">
                <div className="lg:col-span-7 h-64 lg:h-auto relative overflow-hidden bg-slate-100">
                  <img
                    src={featuredPost.cover_image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-xs font-bold">
                      Featured Regulatory Insight
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-sky-100 text-[#0089C1] text-[11px] font-bold">
                        {featuredPost.category}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredPost.read_time}
                      </span>
                    </div>

                    <Link href={`/blog/${featuredPost.slug}`}>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug group-hover:text-[#0089C1] transition-colors mb-3">
                        {featuredPost.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-6 font-medium">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={featuredPost.author_avatar}
                        alt={featuredPost.author_name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{featuredPost.author_name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{featuredPost.author_role}</div>
                      </div>
                    </div>

                    <Link href={`/blog/${featuredPost.slug}`}>
                      <button className="flex items-center gap-1 text-xs font-bold text-[#0089C1] hover:text-sky-700">
                        <span>Read Analysis</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden group"
              >
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-slate-800 shadow-xs">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>{post.read_time}</span>
                      <span>•</span>
                      <span>{post.published_at}</span>
                    </div>

                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#0089C1] transition-colors leading-snug line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-medium">
                      {post.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={post.author_avatar}
                        alt={post.author_name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                        {post.author_name}
                      </span>
                    </div>

                    <Link href={`/blog/${post.slug}`}>
                      <span className="text-xs font-bold text-[#0089C1] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Read
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-800">No articles matched your filter</h3>
              <p className="text-xs text-slate-500 mt-1">Try selecting another category or resetting your search query.</p>
              <button
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0089C1] text-white text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Newsletter Signup */}
          <div className="mt-16 bg-gradient-to-tr from-[#1E293B] to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Statutory Alerts Dispatch</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Never miss a Nigerian compliance deadline.
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Receive our monthly regulatory intel dispatch covering FIRS circulars, CAC gazettes, NDPC compliance cutoffs, and PENCOM audit notices.
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
              <input
                type="email"
                placeholder="Enter corporate email"
                className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
              <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0089C1] hover:bg-sky-500 transition-all text-white text-xs font-bold shadow-md whitespace-nowrap">
                Subscribe Intel
              </button>
            </div>
          </div>
        </section>
      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
