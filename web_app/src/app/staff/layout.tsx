"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Ticket, 
  BookOpen, 
  FileText, 
  Headphones, 
  ExternalLink, 
  Sparkles, 
  Database,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { RoleGuard } from "@/components/ahnara/RoleGuard";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Shift Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { label: "Live Chat Console", href: "/staff/chat", icon: MessageSquare },
    { label: "Tickets & Inquiries", href: "/staff/tickets", icon: Ticket },
    { label: "Knowledge Base", href: "/staff/kb", icon: BookOpen },
    { label: "Regulatory Blog", href: "/staff/blog", icon: FileText },
  ];

  return (
    <RoleGuard allowedRoles={["STAFF", "ADMIN"]}>
      <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col select-none">
        {/* Top Header */}
        <header className="px-6 py-4 flex items-center justify-between gap-4 bg-transparent border-b border-slate-300/30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white p-1.5 shadow-xs flex items-center justify-center font-black">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 text-display">
                  ComplianceHub
                </span>
                <span className="block text-[10px] font-black text-amber-600 uppercase tracking-wider">
                  Support Resolution Desk
                </span>
              </div>
            </Link>

            {/* Shift status badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Shift Active • Desk Online</span>
            </div>
          </div>

          {/* Right Info */}
          <div className="flex items-center gap-3">
            <Link href="/support" target="_blank">
              <button className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs">
                <span>View Public Support</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </Link>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <img
                src={user?.avatar || "/character4.jpg"}
                alt={user?.name || "Staff"}
                className="w-7 h-7 rounded-full object-cover border border-amber-300"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || "Babajide Sanwo"}</p>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">{user?.title || "Support Specialist"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex max-w-7xl w-full mx-auto px-6 py-6 gap-6">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden md:flex flex-col w-60 shrink-0 gap-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Support Console
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
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="mt-6 p-4 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-950 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Canned Snippets Ready</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                Use standard statutory replies in Live Chat for CAMA 2020 annual filing deadlines and 2026 Tax Act withholding rates.
              </p>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
