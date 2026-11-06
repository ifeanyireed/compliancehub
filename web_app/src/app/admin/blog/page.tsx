"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Folder, 
  Tag, 
  Eye, 
  Sparkles,
  X
} from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_role: string;
  category: string;
  tags: string[];
  read_time: string;
  status: string;
  published_at: string;
}

export default function AdminBlogCMSPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Post Form
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author_name: "Dr. Olumide Adeleke",
    author_role: "Super Administrator & Compliance Director",
    category: "Taxation & FIRS",
    tags: "Tax Act 2026, Compliance, FIRS",
    read_time: "5 min read",
    status: "PUBLISHED"
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/blog`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.warn("Failed fetching blog posts from API", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(t => t.trim()),
        cover_image: "/article_professional.jpg",
        author_avatar: "/character5.jpg"
      };

      const res = await fetch(`${apiUrl}/api/blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCreateModalOpen(false);
        setFormData({
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          author_name: "Dr. Olumide Adeleke",
          author_role: "Super Administrator & Compliance Director",
          category: "Taxation & FIRS",
          tags: "Tax Act 2026, Compliance, FIRS",
          read_time: "5 min read",
          status: "PUBLISHED"
        });
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = posts.filter(p => {
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchesSearch = search === "" || 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Regulatory Intelligence CMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Publish and manage Nigeria statutory intelligence briefs, circular updates, and compliance guides.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Regulatory Brief</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {["ALL", "Taxation & FIRS", "Data Privacy & NDPA", "Corporate & CAC", "AML & SCUML"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-[#1E293B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search article titles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
          />
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Article Title & Category</th>
                <th className="py-3.5 px-6">Author</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Published</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filtered.map(post => (
                <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 max-w-sm">
                    <span className="font-bold text-slate-900 block truncate mb-1">
                      {post.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0089C1] text-[10px] font-bold border border-sky-200/50">
                      {post.category}
                    </span>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-bold text-slate-800 block">{post.author_name}</span>
                    <span className="text-[10px] text-slate-400">{post.author_role}</span>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {post.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap text-slate-500 text-[11px]">
                    {post.published_at?.split("T")[0] || "2026-02-01"}
                  </td>

                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="View Public Post">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-extrabold text-slate-900">Publish Regulatory Intelligence Article</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Created briefs will be published live to the public blog and Neon Postgres database.
              </p>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Article Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 2026 Withholding Tax Digital Exemption Thresholds"
                  value={formData.title}
                  onChange={e => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setFormData({ ...formData, title, slug });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">URL Slug</label>
                  <input
                    required
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                  >
                    <option value="Taxation & FIRS">Taxation & FIRS</option>
                    <option value="Data Privacy & NDPA">Data Privacy & NDPA</option>
                    <option value="Corporate & CAC">Corporate & CAC</option>
                    <option value="AML & SCUML">AML & SCUML</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Executive Excerpt (1-2 sentences) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Summary for preview cards and regulatory news feeds..."
                  value={formData.excerpt}
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Full Article Content (Markdown format) *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="## Statutory Guidelines..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1">Author</label>
                  <input
                    type="text"
                    value={formData.author_name}
                    onChange={e => setFormData({ ...formData, author_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold transition-all shadow-sm"
                >
                  {submitting ? "Publishing to Neon Postgres..." : "Publish Article to Intelligence Portal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
