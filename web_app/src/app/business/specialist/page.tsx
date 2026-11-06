"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Lock, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Building2, 
  Sparkles,
  Users
} from "lucide-react";

export default function BusinessSpecialistPage() {
  const [activeTab, setActiveTab] = useState<"aml" | "privacy">("aml");
  
  // AML screening simulator state
  const [screeningQuery, setScreeningQuery] = useState("");
  const [screeningResult, setScreeningResult] = useState<any | null>(null);
  const [screeningLoading, setScreeningLoading] = useState(false);

  const handleScreening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screeningQuery.trim()) return;

    setScreeningLoading(true);
    setTimeout(() => {
      setScreeningResult({
        queried: screeningQuery,
        matchesFound: 0,
        pepStatus: "Clear (No Politically Exposed Person match)",
        sanctionsList: "Clear (Screened against NFIU, OFAC, UN Sanctions, EFCC Wanted List)",
        riskScore: "Low Risk",
        timestamp: new Date().toLocaleString()
      });
      setScreeningLoading(false);
    }, 700);
  };

  const dsarRequests = [
    {
      id: "dsar-01",
      dataSubject: "Babatunde Alabi",
      requestType: "Right of Access & Portability",
      receivedDate: "24 Jan 2026",
      statutoryDeadline: "23 Feb 2026 (NDPA 30-day limit)",
      status: "In Progress",
      assignedTo: "Barr. Folashade Adeleke"
    },
    {
      id: "dsar-02",
      dataSubject: "Grace Nwachukwu",
      requestType: "Rectification of Personal Data",
      receivedDate: "02 Feb 2026",
      statutoryDeadline: "02 Mar 2026",
      status: "Complied",
      assignedTo: "Barr. Folashade Adeleke"
    }
  ];

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
              MOD-06 & 07
            </span>
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
              HubAML & HubPrivacy Specialist Suites
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Specialist Regulated Workflows
          </h1>
          <p className="text-xs text-slate-500">
            Dedicated workflows for Nigeria Data Protection Act 2023 compliance and SCUML / NFIU AML/CFT mandates.
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="bg-[#E8EFF4] p-1.5 rounded-2xl border border-slate-300/40 flex items-center">
          <button
            onClick={() => setActiveTab("aml")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "aml" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>HubAML (SCUML / KYC)</span>
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "privacy" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <Lock className="w-4 h-4 text-[#0089C1]" />
            <span>HubPrivacy (NDPA 2023)</span>
          </button>
        </div>
      </div>

      {/* AML TAB CONTENT */}
      {activeTab === "aml" && (
        <div className="space-y-6">
          {/* SCUML Standing Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SCUML Registration</span>
              <div className="text-sm font-black text-slate-900 font-mono mt-1">SC-1409281-LA</div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">Active • Expires 31 Dec 2026</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Designated AML Officer</span>
              <div className="text-sm font-black text-slate-900 mt-1">Tunde Bakare, CAMS</div>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Appointed under MLA 2022</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Currency Threshold Reports (CTR)</span>
              <div className="text-sm font-black text-slate-900 font-mono mt-1">0 Flagged Transfers</div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">₦5M indiv / ₦10M corp threshold</span>
            </div>
          </div>

          {/* Interactive PEP & Sanctions Screening Simulation */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Counterparty & Customer Sanctions Screening Engine
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate instant real-time lookup against Nigerian and international enforcement lists.
              </p>
            </div>

            <form onSubmit={handleScreening} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter individual or corporate entity name (e.g. Oluwaseun Adeleke or Titan Commodities Ltd)..."
                  value={screeningQuery}
                  onChange={(e) => setScreeningQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                />
              </div>
              <button
                type="submit"
                disabled={screeningLoading}
                className="w-full sm:w-auto bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {screeningLoading ? (
                  <span>Querying Sanctions Watchlists...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#0089C1]" />
                    <span>Run Screening Check</span>
                  </>
                )}
              </button>
            </form>

            {/* Screening Result Output Box */}
            {screeningResult && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Screening Result for &ldquo;{screeningResult.queried}&rdquo;</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 font-mono">{screeningResult.timestamp}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                  <div className="bg-white/80 p-2.5 rounded-xl">
                    <strong className="block text-[10px] uppercase text-slate-400">PEP Exposure:</strong>
                    <span>{screeningResult.pepStatus}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl">
                    <strong className="block text-[10px] uppercase text-slate-400">Watchlists Status:</strong>
                    <span>{screeningResult.sanctionsList}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl">
                    <strong className="block text-[10px] uppercase text-slate-400">Risk Assessment:</strong>
                    <span className="text-emerald-700 font-bold">{screeningResult.riskScore}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRIVACY TAB CONTENT */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          {/* NDPA Standing Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">NDPC Statutory Status</span>
              <div className="text-sm font-black text-slate-900 mt-1">Data Controller of Major Importance</div>
              <span className="text-[10px] text-sky-700 font-bold mt-1 inline-block">Registered with NDPC</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Retained Licensed DPCO</span>
              <div className="text-sm font-black text-slate-900 mt-1">Barr. Folashade Adeleke (CDPO)</div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">Filing March 15 Return</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active RoPA Activities</span>
              <div className="text-sm font-black text-slate-900 font-mono mt-1">14 Processing Streams</div>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Last reviewed 3 days ago</span>
            </div>
          </div>

          {/* Data Subject Access Requests (DSAR) Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Data Subject Access Requests (DSAR) Queue
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory 30-day response window under section 34 of the Nigeria Data Protection Act 2023.
                </p>
              </div>
              <button 
                onClick={() => alert("New Data Subject Request logged in queue.")}
                className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-xs"
              >
                + Log Request
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Request Right</th>
                    <th className="py-3 px-4">Received Date</th>
                    <th className="py-3 px-4">Statutory Deadline</th>
                    <th className="py-3 px-4">Assigned DPCO</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dsarRequests.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.dataSubject}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{d.requestType}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{d.receivedDate}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono font-bold">{d.statutoryDeadline}</td>
                      <td className="py-3 px-4 text-slate-600">{d.assignedTo}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === "Complied" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
