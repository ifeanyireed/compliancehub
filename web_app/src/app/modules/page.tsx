"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  FolderArchive, 
  Users, 
  Building2, 
  ClipboardCheck, 
  ShieldAlert, 
  Lock, 
  GraduationCap, 
  Search, 
  Bell, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";
import { COMPLIANCE_MODULES, ComplianceModule } from "@/lib/compliance-data";

export default function ModulesPage() {
  const [selectedModule, setSelectedModule] = useState<ComplianceModule>(COMPLIANCE_MODULES[0]);

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col">
      <CompliancePublicNav />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 my-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider bg-sky-100/60 text-[#0089C1] px-3 py-1 rounded-full border border-sky-200">
            System Architecture
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight text-display leading-tight">
            The Twelve Specialized Compliance Modules
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every module addresses a distinct statutory requirement under Nigerian law, sharing a single data architecture, permission engine, and audit trail.
          </p>
        </div>

        {/* Master Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Navigation list of all 12 modules */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-3 border border-slate-200 shadow-xs space-y-1.5 max-h-[800px] overflow-y-auto">
            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Module Specification
            </p>
            {COMPLIANCE_MODULES.map((m) => {
              const isSelected = selectedModule.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[#1E293B] text-white shadow-sm"
                      : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {m.code}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{m.name}</h4>
                      <p className={`text-[11px] truncate max-w-[210px] ${
                        isSelected ? "text-slate-300" : "text-slate-500"
                      }`}>
                        {m.tagline}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${
                    isSelected ? "text-sky-300" : "text-[#0089C1]"
                  }`}>
                    {m.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Module Deep Dive */}
          <div className="lg:col-span-7 bg-white rounded-[36px] p-8 md:p-10 border border-slate-200 shadow-xs space-y-8 sticky top-28">
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-[#0089C1] text-white">
                    {selectedModule.code}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {selectedModule.category} Module
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 text-display">
                  {selectedModule.name}
                </h2>
                <p className="text-sm font-semibold text-[#0089C1] mt-1">
                  {selectedModule.tagline}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-[#E8EFF4] border border-slate-200 flex items-center justify-center text-slate-800 font-bold">
                <Layers className="w-6 h-6 text-[#0089C1]" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Core Purpose & Regulatory Scope
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedModule.description}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Operational Capabilities & Workflows
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedModule.features.map((feat, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Statutory Legal References (Nigeria)
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedModule.statutoryRefs.map((law, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>{law}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="text-xs text-slate-500">
                Included in <strong className="text-slate-800">Business & Professional</strong> plans
              </div>
              <Link href="/onboarding">
                <button className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Activate {selectedModule.name}</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
