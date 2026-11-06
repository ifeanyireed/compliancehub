"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Database, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Key, 
  Server,
  Lock,
  Globe
} from "lucide-react";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            System Settings & Infrastructure
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage Neon Lakebase Postgres pool configuration, 2026 Nigeria Tax Act rate tables, and security policies.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Updated</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Neon Database Settings Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Neon Lakebase Postgres Connection</h3>
              <p className="text-[11px] text-slate-500 font-medium">AWS US East (Ohio) Region</p>
            </div>
          </div>

          <div>
            <label className="block mb-1">Organization ID</label>
            <input
              type="text"
              readOnly
              value="org-calm-bird-36884253 (COmplianceHub)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block mb-1">Project ID & Branch</label>
            <input
              type="text"
              readOnly
              value="falling-mud-96821996 • branch: production"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block mb-1">Connection Pooler Endpoint</label>
            <input
              type="text"
              readOnly
              value="ep-small-smoke-b4yg5v88-pooler.c-6.us-east-2.aws.neon.tech"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block mb-1">Go Backend Status</label>
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-800 flex items-center justify-between">
              <span>Go API Binary: listening on :8080</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 2026 Nigeria Tax Act Parameters */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0089C1] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">2026 Nigeria Statutory Parameters</h3>
              <p className="text-[11px] text-slate-500 font-medium">Automatic penalty & withholding schedules</p>
            </div>
          </div>

          <div>
            <label className="block mb-1">Small Business CIT Exemption Cap</label>
            <input
              type="text"
              defaultValue="₦50,000,000 Gross Turnover"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Standard Corporate Income Tax (CIT)</label>
            <input
              type="text"
              defaultValue="30% of assessable profits"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Value Added Tax (VAT)</label>
            <input
              type="text"
              defaultValue="7.5% (Due 21st monthly)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save System Parameters</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
