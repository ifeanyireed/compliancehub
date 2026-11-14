"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Building2, 
  CheckSquare, 
  CreditCard, 
  Users2, 
  Bell, 
  LogOut, 
  ArrowLeftRight, 
  ShieldCheck, 
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { RoleGuard } from "@/components/ahnara/RoleGuard";
import { FloatingEntityBar } from "@/components/layout/FloatingEntityBar";

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, switchRole, logout } = useAuth();

  const menuItems = [
    { name: "Practice Overview", href: "/practice/dashboard", icon: LayoutGrid },
    { name: "Client Portfolio", href: "/practice/clients", icon: Building2 },
    { name: "Work & Tasks", href: "/practice/tasks", icon: CheckSquare },
    { name: "Commercial & Fees", href: "/practice/commercial", icon: CreditCard },
    { name: "Agency & Team", href: "/practice/agency", icon: Users2 },
  ];

  return (
    <RoleGuard allowedRoles={["EXPERT", "AGENCY", "ADMIN"]}>
      <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col select-none">
        {/* Header */}
        <header className="sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#E8EFF4]/90 backdrop-blur-md border-b border-slate-300/40">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1.5 shadow-xs flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 text-display">
                  ComplianceHub
                </span>
                <span className="block text-[10px] font-black text-[#245C44] uppercase tracking-wider">
                  HubAgents Practice Suite
                </span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Accredited Practice Director</span>
            </div>
          </div>

          {/* Center: Top Capsule Pill Tab Menu */}
          <nav className="flex items-center gap-1 bg-[#DDEEF3] p-1 rounded-2xl border border-slate-300/30 overflow-x-auto max-w-full">
            {menuItems.map((item) => {
              const normalizedPath = (pathname || "").replace(/\/+$/, "");
              const itemHrefClean = item.href.replace(/\/+$/, "");
              const isActive =
                normalizedPath === itemHrefClean ||
                (itemHrefClean !== "/practice" && normalizedPath.startsWith(`${itemHrefClean}/`));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#1E293B] text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/20 font-semibold"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#245C44]" : "text-slate-500"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Switch to Business Workspace */}
            <button
              onClick={() => {
                switchRole("BUSINESS");
                window.location.href = "/business/dashboard";
              }}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold transition-all shadow-xs"
              title="Switch to Business Client View (HubBusiness)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#0089C1]" />
              <span>Switch to HubBusiness</span>
            </button>

            {/* Notifications Bell */}
            <Link
              href="/practice/tasks"
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all relative bg-white shadow-xs"
              title="5 Client Approvals Pending"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
            </Link>

            <div className="h-6 w-px bg-slate-300/60 hidden sm:block" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5">
              <img
                src={user?.avatar || "/character1.jpg"}
                alt={user?.name || "Practitioner"}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
              />
              <div className="text-left hidden lg:block">
                <p className="font-bold text-xs text-slate-900 leading-none">{user?.name || "Tunde Bakare, CAMS"}</p>
                <span className="text-[9px] text-[#245C44] font-bold uppercase tracking-wider block mt-0.5">
                  {user?.title || "Practice Director (14 Clients)"}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all bg-white shadow-xs"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Container */}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 px-4 sm:px-8 pt-6 pb-12 max-w-7xl mx-auto w-full"
        >
          {children}
        </motion.main>

        {/* Temporary Floating Entity Switcher Bar */}
        <FloatingEntityBar />
      </div>
    </RoleGuard>
  );
}
