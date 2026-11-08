"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Clock, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  BookOpen,
  Calendar,
  Eye,
  Tag
} from "lucide-react";
import { api } from "@/lib/api";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author_name: string;
  category: string;
  read_time: string;
  cover_image: string;
  view_count?: number;
  published_at: string;
}

export default function StaffBlogReferencePage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [categories, setCategories] = useState<string[]>(["ALL"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const [postsRes, catsRes] = await Promise.all([
          api.blog.getPosts({ status: "PUBLISHED" }),
          api.blog.getCategories()
        ]);

        if (Array.isArray(postsRes)) setPosts(postsRes);
        if (Array.isArray(catsRes) && catsRes.length > 0) {
          setCategories(["ALL", ...catsRes.map((c: any) => c.name)]);
        }
      } catch (e) {
        console.warn("Using fallback posts", e);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const filtered = posts.filter(p => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#0089C1] text-xs font-bold border border-sky-200/60 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Staff Knowledge Portal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Regulatory Intelligence Reference
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Published circulars and statutory intelligence for support staff guidance during client consultations and ticket resolution.
          </p>
        </div>

        <Link href="/blog" target="_blank">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Journal</span>
          </button>
        </Link>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search statutory circulars, tax rules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "ALL" ? "All Regulatory Categories" : c}</option>
          ))}
        </select>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-3xl p-12 text-center text-slate-400 font-medium border border-slate-200/80">
            No circulars match your search query.
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-50 text-[#0089C1] text-[10px] font-bold border border-sky-200/60">
                    {p.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                    <Clock className="w-3 h-3" />
                    {p.read_time}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-snug mb-2">
                  {p.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 font-medium">
                  {p.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-600">
                  By {p.author_name}
                </div>

                <Link
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0089C1] hover:underline"
                >
                  <span>Consult Full Dispatch</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
