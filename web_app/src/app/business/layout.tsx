"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  FolderArchive, 
  Users, 
  ShieldAlert, 
  UserCheck, 
  FileText, 
  Settings, 
  Bell, 
  LogOut, 
  Building2, 
  ChevronDown, 
  ShieldCheck 
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { RoleGuard } from "@/components/ahnara/RoleGuard";
import { FloatingEntityBar } from "@/components/layout/FloatingEntityBar";

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Overview", href: "/business/dashboard", icon: LayoutDashboard },
    { name: "HubCalendar", href: "/business/calendar", icon: Calendar },
    { name: "HubDocs", href: "/business/documents", icon: FolderArchive },
    { name: "People & Vendors", href: "/business/people-vendors", icon: Users },
    { name: "AML & Privacy", href: "/business/specialist", icon: ShieldAlert },
    { name: "My Professionals", href: "/business/professionals", icon: UserCheck },
    { name: "HubReport", href: "/business/reports", icon: FileText },
    { name: "Settings", href: "/business/settings", icon: Settings },
  ];

  return (
    <RoleGuard allowedRoles={["BUSINESS", "ADMIN"]}>
      <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col select-none">
        {/* Top Header matching AntifakeNG styling */}
        <header className="sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#E8EFF4]/90 backdrop-blur-md border-b border-slate-300/40">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1.5 shadow-xs flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 text-display">
                  ComplianceHub
                </span>
                <span className="block text-[10px] font-black text-[#0089C1] uppercase tracking-wider">
                  HubBusiness Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Top Capsule Pill Tab Menu */}
          <nav className="flex items-center gap-1 bg-[#DDEEF3] p-1 rounded-2xl border border-slate-300/30 overflow-x-auto max-w-full">
            {navItems.map((item) => {
              const normalizedPath = (pathname || "").replace(/\/+$/, "");
              const itemHrefClean = item.href.replace(/\/+$/, "");
              const isActive =
                normalizedPath === itemHrefClean ||
                (itemHrefClean !== "/business" && normalizedPath.startsWith(`${itemHrefClean}/`));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#1E293B] text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/20 font-semibold"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#0089C1]" : "text-slate-500"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-3">
            {/* Urgent Alerts Bell */}
            <Link
              href="/business/calendar"
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all relative bg-white shadow-xs"
              title="3 Statutory Deadlines Approaching"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </Link>

            <div className="h-6 w-px bg-slate-300/60 hidden sm:block" />

            {/* User Profile */}
            <Link href="/business/settings" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img
                src={user?.avatar || "/character3.jpg"}
                alt={user?.name || "Business Admin"}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
              />
              <div className="text-left hidden lg:block">
                <p className="font-bold text-xs text-slate-900 leading-none">{user?.name || "Adaeze Nwosu"}</p>
                <span className="text-[9px] text-[#0089C1] font-bold uppercase tracking-wider block mt-0.5">
                  {user?.title || "Business Admin"}
                </span>
              </div>
            </Link>

            <button
              onClick={logout}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all bg-white shadow-xs"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 px-4 sm:px-8 pt-6 pb-12 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Temporary Floating Entity Switcher Bar */}
        <FloatingEntityBar />
      </div>
    </RoleGuard>
  );
}
