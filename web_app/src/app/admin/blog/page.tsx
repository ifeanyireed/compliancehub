"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  X,
  Copy,
  Check,
  MessageSquare,
  Users,
  Edit3,
  Filter,
  CheckSquare,
  Square,
  Mail,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { copyBlogUrlToClipboard, getPublicBlogUrl } from "@/lib/blog-utils";

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
  cover_image: string;
  view_count?: number;
  published_at: string;
  created_at: string;
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  post_count?: number;
}

interface BlogTag {
  id: number;
  name: string;
  slug: string;
  post_count?: number;
}

interface BlogComment {
  id: number;
  post_id: number;
  post_title?: string;
  author_name: string;
  author_email: string;
  content: string;
  status: string;
  created_at: string;
}

interface BlogSubscriber {
  id: number;
  email: string;
  source: string;
  status: string;
  created_at: string;
}

const TABS = [
  { id: "posts", name: "Dispatches & Articles", icon: FileText },
  { id: "categories", name: "Statutory Categories", icon: Folder },
  { id: "tags", name: "Provisions & Tags", icon: Tag },
  { id: "comments", name: "Inquiries & Comments", icon: MessageSquare },
  { id: "subscribers", name: "Alert Subscribers", icon: Users },
];

export default function AdminBlogCMSPage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [subscribers, setSubscribers] = useState<BlogSubscriber[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [postsSearch, setPostsSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modals
  const [newCategoryModal, setNewCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const [newTagModal, setNewTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [postsRes, catsRes, tagsRes, commentsRes, subsRes] = await Promise.all([
        api.blog.getPosts({ status: "ALL" }),
        api.blog.getCategories(),
        api.blog.getTags(),
        api.blog.getComments(),
        api.blog.getSubscribers()
      ]);

      if (Array.isArray(postsRes)) setPosts(postsRes);
      if (Array.isArray(catsRes)) setCategories(catsRes);
      if (Array.isArray(tagsRes)) setTags(tagsRes);
      if (Array.isArray(commentsRes)) setComments(commentsRes);
      if (Array.isArray(subsRes)) setSubscribers(subsRes);
    } catch (e) {
      console.warn("Failed fetching CMS data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCopyLink = async (id: number, slug: string) => {
    const res = await copyBlogUrlToClipboard(slug);
    if (res.success) {
      setCopiedId(id);
      showToast("Article URL copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this regulatory dispatch?")) return;
    try {
      await api.blog.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      showToast("Post deleted successfully");
    } catch (e) {
      alert("Failed to delete post: " + e);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const newStatus = post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await api.blog.updatePost(post.id, { ...post, status: newStatus });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p));
      showToast(`Post status updated to ${newStatus}`);
    } catch (e) {
      alert("Failed to update status: " + e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await api.blog.createCategory({ name: newCatName, description: newCatDesc });
      if (res && res.id) {
        setCategories(prev => [...prev, res]);
        setNewCatName("");
        setNewCatDesc("");
        setNewCategoryModal(false);
        showToast("Category registered successfully");
      }
    } catch (e) {
      alert("Failed creating category: " + e);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api.blog.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast("Category deleted");
    } catch (e) {
      alert("Failed to delete category");
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      const res = await api.blog.createTag({ name: newTagName });
      if (res && res.id) {
        setTags(prev => [...prev, res]);
        setNewTagName("");
        setNewTagModal(false);
        showToast("Tag added successfully");
      }
    } catch (e) {
      alert("Failed creating tag: " + e);
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await api.blog.deleteTag(id);
      setTags(prev => prev.filter(t => t.id !== id));
      showToast("Tag deleted");
    } catch (e) {
      alert("Failed to delete tag");
    }
  };

  const handleToggleComment = async (comment: BlogComment) => {
    const newStatus = comment.status === "APPROVED" ? "PENDING" : "APPROVED";
    try {
      await api.blog.updateCommentStatus(comment.id, newStatus);
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, status: newStatus } : c));
      showToast(`Comment marked as ${newStatus}`);
    } catch (e) {
      alert("Failed updating comment status");
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.blog.deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
      showToast("Comment deleted");
    } catch (e) {
      alert("Failed deleting comment");
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm("Remove this subscriber?")) return;
    try {
      await api.blog.deleteSubscriber(id);
      setSubscribers(prev => prev.filter(s => s.id !== id));
      showToast("Subscriber removed");
    } catch (e) {
      alert("Failed removing subscriber");
    }
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
      if (postsSearch.trim()) {
        const q = postsSearch.toLowerCase().trim();
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.author_name.toLowerCase().includes(q) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [posts, postsSearch, statusFilter, categoryFilter]);

  // Total metrics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === "PUBLISHED").length;
  const draftPosts = posts.filter(p => p.status === "DRAFT").length;
  const totalViews = posts.reduce((acc, p) => acc + (p.view_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Cockpit */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#0089C1] text-xs font-bold border border-sky-200/60 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Editorial Intelligence Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            The Compliance Journal CMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Author, moderate, and publish statutory regulatory advisories and legal updates across Nigeria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/blog" target="_blank">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public Journal</span>
            </button>
          </Link>

          <Link href="/admin/blog/create">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all">
              <Plus className="w-4 h-4" />
              <span>Author New Dispatch</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatches</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalPosts}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">{publishedPosts} published • {draftPosts} drafts</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reads & Views</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalViews.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>Verified practitioner visits</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statutory Topics</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{categories.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">{tags.length} provisions & tags</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alert Subscribers</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{subscribers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">{comments.length} user inquiries</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? "bg-[#0089C1] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Posts Management */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dispatches by title, excerpt, author..."
                value={postsSearch}
                onChange={(e) => setPostsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Dispatch Title</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Author</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Views</th>
                    <th className="py-4 px-4">Published</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No regulatory dispatches match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 max-w-sm line-clamp-1">{post.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">/blog/{post.slug}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-sky-50 text-[#0089C1] font-bold text-[10px] border border-sky-200/60">
                            {post.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {post.author_name}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleTogglePublish(post)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all ${
                              post.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            {post.status}
                          </button>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-700">
                          {post.view_count || 0}
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopyLink(post.id, post.slug)}
                              title="Copy Public URL"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            >
                              {copiedId === post.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>

                            <Link href={`/blog/${post.slug}`} target="_blank" title="View Live Post">
                              <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </Link>

                            <Link href={`/admin/blog/create?edit=${post.id}`} title="Edit Dispatch">
                              <button className="p-1.5 rounded-lg text-slate-400 hover:text-[#0089C1] hover:bg-sky-50">
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </Link>

                            <button
                              onClick={() => handleDeletePost(post.id)}
                              title="Delete Dispatch"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Categories Management */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Regulatory Topic Categories</h3>
              <p className="text-xs text-slate-500 mt-0.5">Statutory taxonomy for filtering compliance articles and circulars.</p>
            </div>
            <button
              onClick={() => setNewCategoryModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0089C1] hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-extrabold text-slate-900">{c.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {c.post_count || 0} articles
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {c.description || "General regulatory compliance category."}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">slug: {c.slug}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Tags Management */}
      {activeTab === "tags" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Statutory Provisions & Tags</h3>
              <p className="text-xs text-slate-500 mt-0.5">Keywords indexing specific Nigerian acts, decrees, and circulars.</p>
            </div>
            <button
              onClick={() => setNewTagModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0089C1] hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tag</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap gap-2.5">
              {tags.map((t) => (
                <div 
                  key={t.id}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 group hover:border-[#0089C1]"
                >
                  <span>#{t.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({t.post_count || 0})</span>
                  <button
                    onClick={() => handleDeleteTag(t.id)}
                    className="text-slate-400 hover:text-rose-600 ml-1 opacity-60 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Comments Management */}
      {activeTab === "comments" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">User Inquiries & Public Comments</h3>
            <p className="text-xs text-slate-500 mt-0.5">Moderate corporate questions and practitioner responses.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">User / Inquirer</th>
                    <th className="py-4 px-4">Target Dispatch</th>
                    <th className="py-4 px-4">Comment Text</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No inquiries submitted yet.
                      </td>
                    </tr>
                  ) : (
                    comments.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{c.author_name}</div>
                          <div className="text-[11px] text-slate-400">{c.author_email}</div>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-700 max-w-xs truncate">
                          {c.post_title || `Post #${c.post_id}`}
                        </td>
                        <td className="py-4 px-4 text-slate-600 max-w-md line-clamp-2">
                          {c.content}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleComment(c)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              c.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {c.status}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Subscribers Management */}
      {activeTab === "subscribers" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Statutory Alert Email Subscribers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Corporate managing directors and compliance leads subscribed to Monday dispatches.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              {subscribers.length} total subscribers
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Subscriber Email</th>
                    <th className="py-4 px-4">Source Channel</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Subscribed At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        No subscribers registered yet.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#0089C1]" />
                          <span>{s.email}</span>
                        </td>
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                          {s.source}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(s.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Remove Subscriber"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {newCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-slate-900">New Regulatory Category</h3>
              <button onClick={() => setNewCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Export & NEPC Compliance"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Summary of statutory provisions and target filings..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCategoryModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0089C1] hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Tag Modal */}
      {newTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-slate-900">Add Statutory Provision Tag</h3>
              <button onClick={() => setNewTagModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tag Name</label>
                <input
                  type="text"
                  placeholder="e.g. ITF Form 8"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTagModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0089C1] hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
