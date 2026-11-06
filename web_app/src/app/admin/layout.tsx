"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Headphones, 
  Users2, 
  Receipt, 
  Settings, 
  ShieldAlert, 
  ExternalLink, 
  Sparkles, 
  ChevronRight, 
  Database,
  Building2,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Blog & CMS", href: "/admin/blog", icon: FileText },
    { label: "Support Operations", href: "/admin/support", icon: Headphones },
    { label: "Companies & Users", href: "/admin/users", icon: Users2 },
    { label: "Invoices & Billing", href: "/admin/invoices", icon: Receipt },
    { label: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col select-none">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between gap-4 bg-transparent border-b border-slate-300/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white p-1.5 shadow-xs flex items-center justify-center font-black">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 text-display">
                ComplianceHub
              </span>
              <span className="block text-[10px] font-black text-rose-600 uppercase tracking-wider">
                Super Admin Cockpit
              </span>
            </div>
          </Link>

          {/* Database Live Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Neon Lakebase Postgres (aws-us-east-2)</span>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank">
            <button className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs">
              <span>View Public Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </Link>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <img
              src="/character5.jpg"
              alt="Admin"
              className="w-7 h-7 rounded-full object-cover border border-rose-300"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">Dr. Olumide Adeleke</p>
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Super Administrator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-6 py-6 gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 gap-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Platform Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#1E293B] text-white shadow-md shadow-slate-900/10"
                    : "bg-white/60 hover:bg-white text-slate-700 border border-slate-200/60 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-rose-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-6 p-4 rounded-3xl bg-gradient-to-tr from-[#1E293B] to-slate-800 text-white shadow-md">
            <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Audit Mode Active</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              You are operating in Super Administrator mode. All mutations reflect across the entire Nigerian tenant directory.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
