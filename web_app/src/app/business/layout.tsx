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
  ShieldCheck, 
  ArrowLeftRight 
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { MOCK_CLIENT_WORKSPACES } from "@/lib/compliance-data";

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, switchRole, logout } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState(MOCK_CLIENT_WORKSPACES[0]);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

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
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col select-none">
      {/* Top Header matching AntifakeNG styling */}
      <header className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-transparent border-b border-slate-300/30">
        
        {/* Left: Brand & Workspace Switcher */}
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

          {/* Business Workspace Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all text-xs text-left"
            >
              <div className="w-5 h-5 rounded-md bg-[#0089C1] text-white flex items-center justify-center font-bold text-[10px]">
                {selectedWorkspace.logoText}
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900 leading-none">{selectedWorkspace.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedWorkspace.rcNumber}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Business Entity
                </p>
                {MOCK_CLIENT_WORKSPACES.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setSelectedWorkspace(ws);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                      selectedWorkspace.id === ws.id ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center"
                      style={{ backgroundColor: ws.colorScheme }}
                    >
                      {ws.logoText}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{ws.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{ws.rcNumber} • {ws.state}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {ws.readinessScore}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Top Capsule Pill Tab Menu */}
        <nav className="flex items-center gap-1 bg-[#DDEEF3] p-1 rounded-2xl border border-slate-300/30 overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/business/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-[#1E293B] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/20"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Quick Switcher, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Switch to Practice Suite */}
          <button
            onClick={() => {
              switchRole("EXPERT");
              window.location.href = "/practice/dashboard";
            }}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold transition-all shadow-xs"
            title="Switch to Practice Management (HubAgents)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#245C44]" />
            <span>Switch to HubAgents</span>
          </button>

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
              src="/character3.jpg"
              alt="Adaeze Nwosu"
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            <div className="text-left hidden lg:block">
              <p className="font-bold text-xs text-slate-900 leading-none">Adaeze Nwosu</p>
              <span className="text-[9px] text-[#0089C1] font-bold uppercase tracking-wider block mt-0.5">
                Business Admin
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
    </div>
  );
}
