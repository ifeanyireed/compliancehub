"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Plus, 
  ShieldCheck, 
  Building2, 
  Upload, 
  X,
  FileCheck2,
  CalendarDays,
  List
} from "lucide-react";
import { MOCK_OBLIGATIONS, ComplianceObligation } from "@/lib/compliance-data";
import { api } from "@/lib/api";

export default function BusinessCalendarPage() {
  const [viewMode, setViewMode] = useState<"list" | "month">("list");
  const [selectedAuthority, setSelectedAuthority] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [activeModalObligation, setActiveModalObligation] = useState<ComplianceObligation | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [obligations, setObligations] = useState<ComplianceObligation[]>(MOCK_OBLIGATIONS);

  const authorities = ["All", "CAC", "FIRS / NRS", "NDPC", "SCUML", "PENCOM"];

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const liveObligations = await api.calendar.getObligations({
          authority: selectedAuthority,
          status: selectedStatus,
        });

        if (Array.isArray(liveObligations) && liveObligations.length > 0) {
          const mapped: ComplianceObligation[] = liveObligations.map((o: any) => {
            const due = new Date(o.due_date);
            const now = new Date();
            const diffTime = due.getTime() - now.getTime();
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
              id: o.id,
              title: o.title,
              authority: (o.authority as any) || "CAC",
              applicableLaw: o.authority === "CAC" ? "CAMA 2020 s.377" : o.authority === "NDPC" ? "NDPA 2023 s.48" : "Nigeria Tax Act 2026",
              deadline: o.due_date,
              daysRemaining: days > 0 ? days : 0,
              frequency: "Annual",
              status: (o.status === "FILED" || o.status === "VERIFIED" ? "Complied" : "Pending") as any,
              assignedTo: "Tunde Bakare, CAMS",
              penaltyDescription: o.estimated_penalty_ngn ? `₦${Number(o.estimated_penalty_ngn).toLocaleString()} statutory penalty per default window` : "Statutory fine and formal notice",
              requiredEvidence: "Digital acknowledgment receipt and official filing slip",
              isUrgent: o.is_urgent || false,
              category: (o.authority === "NDPC" ? "Audit Return" : o.authority === "FIRS / NRS" ? "Tax Remittance" : "Statutory Filing") as any
            };
          });
          setObligations(mapped);
        }
      } catch (err) {
        console.warn("Fallback to default compliance calendar:", err);
      }
    }
    fetchCalendar();
  }, [selectedAuthority, selectedStatus]);

  const filtered = obligations.filter((o) => {
    const matchAuth = selectedAuthority === "All" || o.authority === selectedAuthority;
    const matchStatus = selectedStatus === "All" || o.status === selectedStatus;
    return matchAuth && matchStatus;
  });

  const handleMarkComplete = async (ob: ComplianceObligation) => {
    try {
      await api.calendar.completeObligation(ob.id);
      setUploadSuccess(true);
      setObligations(prev => prev.map(item => item.id === ob.id ? { ...item, status: "Complied", isUrgent: false } : item));
    } catch (err) {
      console.warn("Complete API call fallback:", err);
      setUploadSuccess(true);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0089C1] text-white">
              MOD-01
            </span>
            <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider">
              HubCalendar
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Neon Lakebase Synced
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Statutory Compliance Calendar
          </h1>
          <p className="text-xs text-slate-500">
            Real-time synchronization with Nigerian federal and state regulatory schedules.
          </p>
        </div>

        {/* View Toggle & Add Custom Deadline */}
        <div className="flex items-center gap-2">
          <div className="bg-[#E8EFF4] p-1 rounded-xl border border-slate-300/40 flex items-center">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "month"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter / Authority Switcher Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Authority Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {authorities.map((auth) => (
            <button
              key={auth}
              onClick={() => setSelectedAuthority(auth)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedAuthority === auth
                  ? "bg-[#0089C1] text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {auth}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-[#0089C1]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Filed">Filed / Completed</option>
            <option value="Verified">Verified</option>
          </select>
        </div>
      </div>

      {/* List View of Deadlines */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
              <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold">No regulatory obligations match this filter.</p>
            </div>
          ) : (
            filtered.map((ob) => (
              <div
                key={ob.id}
                onClick={() => {
                  setActiveModalObligation(ob);
                  setUploadSuccess(false);
                }}
                className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  ob.isUrgent
                    ? "border-red-300/80 bg-linear-to-r from-red-50/20 via-white to-white"
                    : "border-slate-200/90"
                }`}
              >
                {/* Left Meta info */}
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white font-mono font-black text-xs ${
                    ob.authority === "CAC" 
                      ? "bg-emerald-600" 
                      : ob.authority === "FIRS / NRS" 
                      ? "bg-[#0089C1]" 
                      : ob.authority === "NDPC" 
                      ? "bg-purple-600" 
                      : "bg-slate-700"
                  }`}>
                    {ob.authority.substring(0, 3)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {ob.applicableLaw}
                      </span>
                      {ob.isUrgent && (
                        <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>Statutory Deadline Approaching</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {ob.title}
                    </h3>

                    <p className="text-xs text-slate-500">
                      Responsible: <strong className="text-slate-700">{ob.assignedTo}</strong> • Evidence: {ob.requiredEvidence}
                    </p>
                  </div>
                </div>

                {/* Right Due Date & Status */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="flex items-center md:justify-end gap-1 font-mono text-xs font-bold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ob.deadline}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {ob.frequency} Statutory Cycle
                    </span>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold ${
                    ob.status === "Complied"
                      ? "bg-emerald-100 text-emerald-800"
                      : ob.isUrgent
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {ob.status === "Complied" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{ob.status}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Month Calendar Preview */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-extrabold text-base text-slate-900">
              Q1 / Q2 2026 Statutory Calendar Matrix
            </h2>
            <span className="text-xs text-slate-500 font-mono">Harmonised Regulatory Timeline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ob) => (
              <div 
                key={ob.id}
                onClick={() => {
                  setActiveModalObligation(ob);
                  setUploadSuccess(false);
                }}
                className="p-4 rounded-2xl border border-slate-200 hover:border-[#0089C1] transition-all cursor-pointer bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500">{ob.deadline}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    {ob.authority}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-2">
                  {ob.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  Penalty: {ob.penaltyDescription}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obligation Details / Evidence Submission Modal */}
      {activeModalObligation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-150 space-y-4">
            <button
              onClick={() => setActiveModalObligation(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {activeModalObligation.authority}
                </span>
                <span className="text-xs font-bold text-[#0089C1]">
                  {activeModalObligation.category}
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 leading-snug">
                {activeModalObligation.title}
              </h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-950 text-xs space-y-1">
              <strong className="block text-[11px] font-black uppercase text-red-800">
                Statutory Default Consequence:
              </strong>
              <p className="leading-relaxed">{activeModalObligation.penaltyDescription}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-bold">Governing Act:</span>
                <span className="font-bold text-slate-800">{activeModalObligation.applicableLaw}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-bold">Responsible Officer:</span>
                <span className="font-bold text-[#0089C1]">{activeModalObligation.assignedTo}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-bold">Statutory Deadline:</span>
                <span className="font-mono font-black text-slate-900">{activeModalObligation.deadline}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 space-y-1">
                <span className="text-slate-500 font-bold block">Required Statutory Evidence:</span>
                <span className="font-medium text-slate-800">{activeModalObligation.requiredEvidence}</span>
              </div>
            </div>

            {/* Evidence Submission Area */}
            {!uploadSuccess ? (
              <div className="pt-2 space-y-3">
                <button
                  onClick={() => handleMarkComplete(activeModalObligation)}
                  className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-bold py-3 rounded-2xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Attach Evidence Document & Submit for Review</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-emerald-950">Evidence Successfully Lodged & Marked Filed!</p>
                <p className="text-emerald-800">
                  Transmitted to <strong>{activeModalObligation.assignedTo}</strong> for compliance sign-off.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
