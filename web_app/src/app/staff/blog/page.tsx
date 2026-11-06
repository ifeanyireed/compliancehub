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
  BookOpen
} from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author_name: string;
  category: string;
  read_time: string;
  cover_image: string;
  published_at: string;
}

export default function StaffBlogReferencePage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadPosts() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/blog`);
        if (res.ok) setPosts(await res.json());
      } catch (e) {
        console.warn("Using fallback posts", e);
      }
    }
    loadPosts();
  }, []);

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Regulatory Intelligence Reference
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Published circulars and statutory intelligence for support staff guidance during client consultations.
          </p>
        </div>

        <Link href="/blog" target="_blank">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Blog</span>
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search statutory circulars, tax rules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
          />
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(p => (
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

              <h3 className="text-sm font-extrabold text-slate-900 leading-snug mb-2">
                {p.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium mb-4">
                {p.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Author: <strong className="text-slate-800">{p.author_name}</strong>
              </span>

              <Link href={`/blog/${p.slug}`} target="_blank">
                <span className="text-xs font-bold text-[#0089C1] hover:underline flex items-center gap-1">
                  <span>Read Full Text</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
