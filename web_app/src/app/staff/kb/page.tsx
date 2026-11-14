"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Search, 
  FileText, 
  Eye, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  views: number;
}

export default function StaffKnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  useEffect(() => {
    async function loadKB() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/support/kb`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data);
          if (data.length > 0) setSelectedArticle(data[0]);
        }
      } catch (e) {
        console.warn("Using fallback KB", e);
      }
    }
    loadKB();
  }, []);

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Regulatory Knowledge Base & Manuals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Internal procedures, filing manuals, and statutory checklists for support staff.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search manuals & checklists..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
          />
        </div>
      </motion.div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Articles List */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden"
        >
          {filtered.map(art => {
            const isSelected = selectedArticle?.id === art.id;
            return (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected ? "bg-slate-50 border-l-4 border-[#0089C1]" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#0089C1]">
                    {art.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {art.views} reads
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                  {art.title}
                </h3>

                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  {art.excerpt}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Article Reader Pane */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8"
        >
          {selectedArticle ? (
            <div>
              <span className="px-3 py-1 rounded-full bg-sky-50 text-[#0089C1] text-xs font-bold border border-sky-200/60 inline-block mb-3">
                {selectedArticle.category}
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug mb-4">
                {selectedArticle.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedArticle.excerpt}
              </p>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                {selectedArticle.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select an article to view details
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
