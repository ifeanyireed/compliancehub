"use client";

import React, { useState } from "react";
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

export default function BusinessCalendarPage() {
  const [viewMode, setViewMode] = useState<"list" | "month">("list");
  const [selectedAuthority, setSelectedAuthority] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [activeModalObligation, setActiveModalObligation] = useState<ComplianceObligation | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const authorities = ["All", "CAC", "FIRS / NRS", "NDPC", "SCUML", "PENCOM"];

  const filtered = MOCK_OBLIGATIONS.filter((o) => {
    const matchAuth = selectedAuthority === "All" || o.authority === selectedAuthority;
    const matchStatus = selectedStatus === "All" || o.status === selectedStatus;
    return matchAuth && matchStatus;
  });

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
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "month" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Grid</span>
            </button>
          </div>

          <button
            onClick={() => alert("Custom internal obligation added to company roadmap.")}
            className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Internal Target</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Authority:
          </span>
          {authorities.map((auth) => (
            <button
              key={auth}
              onClick={() => setSelectedAuthority(auth)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedAuthority === auth
                  ? "bg-[#0089C1] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {auth}
            </button>
          ))}
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          <option value="All">All Statuses</option>
          <option value="In Progress">In Progress</option>
          <option value="Under Review">Under Review</option>
          <option value="Pending">Pending</option>
          <option value="Complied">Complied</option>
        </select>
      </div>

      {/* Main Calendar View Body */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {filtered.map((obl) => (
            <div
              key={obl.id}
              onClick={() => {
                setActiveModalObligation(obl);
                setUploadSuccess(false);
              }}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-[#0089C1] shadow-xs cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {obl.authority}
                  </span>
                  <span className="text-xs font-bold text-[#0089C1]">
                    {obl.category}
                  </span>
                  {obl.isUrgent && (
                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Urgent
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0089C1] transition-colors">
                  {obl.title}
                </h3>

                <p className="text-xs text-slate-500">
                  Legal Basis: <strong className="text-slate-700 font-medium">{obl.applicableLaw}</strong>
                </p>

                <p className="text-xs text-slate-400">
                  Required Proof: <span className="text-slate-600">{obl.requiredEvidence}</span>
                </p>
              </div>

              <div className="flex flex-col md:items-end gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Due Date</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{obl.deadline}</span>
                  <span className="text-[11px] text-red-600 font-bold block">
                    {obl.daysRemaining} days left
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    obl.status === "Complied"
                      ? "bg-emerald-100 text-emerald-800"
                      : obl.status === "In Progress"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {obl.status}
                  </span>
                  <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700">
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Monthly Grid View */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="text-center font-bold text-slate-800 pb-2 border-b">
            June 2026 Statutory Calendar
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400">
            <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-xs">
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const hasCac = day === 30;
              const hasTax = day === 21;
              return (
                <div
                  key={day}
                  className={`min-h-[70px] p-2 rounded-xl border flex flex-col justify-between ${
                    hasCac || hasTax ? "bg-amber-50/70 border-amber-300" : "bg-[#F8FAFC] border-slate-100"
                  }`}
                >
                  <span className="font-bold text-slate-700">{day}</span>
                  {hasCac && (
                    <span className="text-[9px] bg-red-100 text-red-800 font-bold p-1 rounded leading-none block">
                      CAC & CIT Cutoff
                    </span>
                  )}
                  {hasTax && (
                    <span className="text-[9px] bg-sky-100 text-sky-800 font-bold p-1 rounded leading-none block">
                      VAT Filing
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Obligation Detail & Action Modal (Blueprint Part 3.2 Screen 6 & 7) */}
      {activeModalObligation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModalObligation(null)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 absolute top-5 right-5"
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
                  onClick={() => setUploadSuccess(true)}
                  className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-bold py-3 rounded-2xl text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Attach Evidence Document & Submit for Review</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-emerald-950">Evidence Successfully Lodged!</p>
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
