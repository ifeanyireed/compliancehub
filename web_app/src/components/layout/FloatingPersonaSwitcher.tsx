"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Briefcase, 
  Users2, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  ArrowUpRight, 
  Sparkles, 
  X, 
  ShieldCheck,
  UserCheck,
  Headphones,
  ShieldAlert
} from "lucide-react";
import { useAuth, DEMO_USERS, User } from "@/components/ahnara/AuthContext";

export function FloatingPersonaSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, switchRole } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const personas = [
    {
      role: "BUSINESS" as const,
      name: "Adaeze Nwosu",
      title: "Managing Director & Founder",
      company: "PayWave Technologies Ltd",
      subInfo: "RC-1894231 • FinTech SME",
      badge: "HubBusiness Workspace",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200/60",
      accentBg: "bg-[#0089C1]",
      avatar: "/character3.jpg",
      icon: Building2,
      dashboardPath: "/business/dashboard/",
      description: "Company founder managing CAC annual filings, TaxPro-MAX FIRS returns, NDPC data audits, and staff AML training."
    },
    {
      role: "EXPERT" as const,
      name: "Tunde Bakare, CAMS",
      title: "Senior Regulatory & AML Officer",
      company: "Bakare Compliance Consultancy",
      subInfo: "Licensed DPCO & SCUML Specialist",
      badge: "HubAgents Practice",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      accentBg: "bg-[#245C44]",
      avatar: "/character1.jpg",
      icon: Briefcase,
      dashboardPath: "/practice/dashboard/",
      description: "Independent compliance practitioner managing 8 corporate clients, statutory tasks, and monthly retainers."
    },
    {
      role: "AGENCY" as const,
      name: "Chiamaka Eze",
      title: "Principal Partner",
      company: "Apex Advisory Partners Ltd",
      subInfo: "Corporate Law & Compliance Agency",
      badge: "HubAgency Enterprise",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200/60",
      accentBg: "bg-purple-600",
      avatar: "/character2.jpg",
      icon: Users2,
      dashboardPath: "/practice/agency/",
      description: "Corporate advisory firm lead supervising 4 junior associates, 24 corporate clients, and agency billing."
    },
    {
      role: "STAFF" as const,
      name: "Babajide Sanwo",
      title: "Senior Support Specialist",
      company: "ComplianceHub Support Operations",
      subInfo: "Live Chat & Ticket Resolution Desk",
      badge: "Support Staff Cockpit",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200/60",
      accentBg: "bg-amber-500",
      avatar: "/character4.jpg",
      icon: Headphones,
      dashboardPath: "/staff/dashboard/",
      description: "Support desk lead handling visitor live chats, regulatory tickets, and knowledge base guidance."
    },
    {
      role: "ADMIN" as const,
      name: "Dr. Olumide Adeleke",
      title: "Super Administrator",
      company: "ComplianceHub Technologies Ltd",
      subInfo: "Platform Executive Oversight",
      badge: "Super Admin Suite",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200/60",
      accentBg: "bg-rose-600",
      avatar: "/character5.jpg",
      icon: ShieldAlert,
      dashboardPath: "/admin/dashboard/",
      description: "Super admin managing system metrics, CMS regulatory blog articles, users, retainers, and audit trails."
    }
  ];

  const currentRole = user?.role || "BUSINESS";
  const currentPersona = personas.find(p => p.role === currentRole) || personas[0];

  const handleSelectRole = (role: "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN", redirectPath?: string) => {
    switchRole(role);
    if (redirectPath) {
      router.push(redirectPath);
      setIsOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-6 left-6 z-50 print:hidden select-none"
    >
      {/* Floating Dialog Flyout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="mb-3 w-[370px] sm:w-[420px] max-w-[calc(100vw-2.5rem)] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl p-5 overflow-hidden text-slate-800"
            style={{
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0089C1] to-sky-400 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Interactive Persona Demos
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Switch roles instantly to preview dedicated workflows
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Persona Cards List */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
              {personas.map((p) => {
                const isSelected = currentRole === p.role;
                const IconComponent = p.icon;

                return (
                  <div
                    key={p.role}
                    onClick={() => handleSelectRole(p.role)}
                    className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-50/90 border-[#0089C1] shadow-xs ring-2 ring-[#0089C1]/15"
                        : "bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar Image */}
                      <div className="relative shrink-0">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg ${p.accentBg} text-white flex items-center justify-center shadow-xs`}>
                          <IconComponent className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {p.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                            {p.badge}
                          </span>
                        </div>

                        <div className="text-[11px] font-semibold text-slate-600 truncate">
                          {p.company}
                        </div>

                        <div className="text-[10px] text-slate-400 font-medium mb-2">
                          {p.subInfo}
                        </div>

                        {/* Interactive Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                          {isSelected ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active Demo Persona</span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                              Switch to this role
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRole(p.role, p.dashboardPath);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isSelected
                                ? "bg-[#0089C1] text-white hover:bg-sky-600 shadow-xs"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <span>Open Workspace</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom info banner */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Preloaded mock Nigerian compliance state</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Capsule / Pill */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white shadow-xl hover:shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all group"
        aria-label="Toggle Interactive Persona Demos"
      >
        {/* Pulsing indicator & Avatar */}
        <div className="relative">
          <img
            src={currentPersona.avatar}
            alt={currentPersona.name}
            className="w-7 h-7 rounded-full object-cover border border-slate-500 shadow-xs"
          />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
        </div>

        {/* Text information */}
        <div className="flex flex-col text-left pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              Persona Demo
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-[10px] font-bold text-sky-400 leading-none">
              {currentPersona.badge.split(" ")[0]}
            </span>
          </div>
          <span className="text-xs font-bold text-white leading-tight truncate max-w-[150px] sm:max-w-[190px]">
            {currentPersona.name}
          </span>
        </div>

        {/* Up/Down Arrow */}
        <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 group-hover:text-white flex items-center justify-center transition-colors">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </motion.button>
    </div>
  );
}
