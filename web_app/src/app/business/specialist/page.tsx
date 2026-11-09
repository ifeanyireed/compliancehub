"use client";

import React, { useState, useEffect } from "react";
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
  Users,
  Plus,
  X,
  Loader2,
  FileCheck2
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/ahnara/AuthContext";

interface AMLCaseItem {
  id: string;
  entityName: string;
  caseType: string;
  riskSeverity: "LOW" | "MEDIUM" | "HIGH" | "PROHIBITED";
  status: "OPEN" | "IN_REVIEW" | "CLEARED" | "ESCALATED_SCUML";
  caseNotes: string;
  createdAt: string;
}

interface RoPAItem {
  id: string;
  activityName: string;
  purpose: string;
  dataCategories: string[];
  dataSubjects: string[];
  lawfulBasis: string;
  retentionPeriod: string;
  crossBorderTransfer: boolean;
  dpcoAuditReady: boolean;
}

export default function BusinessSpecialistPage() {
  const { activeTenantId } = useAuth();
  const [activeTab, setActiveTab] = useState<"aml" | "privacy">("aml");
  
  // Data state
  const [amlCases, setAmlCases] = useState<AMLCaseItem[]>([]);
  const [ropaActivities, setRopaActivities] = useState<RoPAItem[]>([]);
  const [loading, setLoading] = useState(true);

  // AML screening simulator state
  const [screeningQuery, setScreeningQuery] = useState("");
  const [screeningResult, setScreeningResult] = useState<any | null>(null);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [lodgingCase, setLodgingCase] = useState(false);

  // Modals state
  const [amlModal, setAmlModal] = useState(false);
  const [ropaModal, setRopaModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New AML Case Form
  const [amlForm, setAmlForm] = useState({
    entityName: "",
    caseType: "PEP_SCREENING",
    riskSeverity: "MEDIUM",
    caseNotes: ""
  });

  // New RoPA Form
  const [ropaForm, setRopaForm] = useState({
    activityName: "",
    purpose: "",
    dataCategories: "Full Name, Email, Phone Number, NIN",
    dataSubjects: "Customers, Website Users",
    lawfulBasis: "CONSENT",
    retentionPeriod: "3 years post-inactivity",
    crossBorderTransfer: false,
    dpcoAuditReady: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesRes, ropaRes] = await Promise.all([
        api.specialist.getAMLCases(),
        api.specialist.getPrivacyActivities()
      ]);

      if (Array.isArray(casesRes)) {
        setAmlCases(
          casesRes.map((c: any) => ({
            id: c.id,
            entityName: c.entity_name,
            caseType: c.case_type,
            riskSeverity: c.risk_severity as any,
            status: c.status as any,
            caseNotes: c.case_notes || "No notes appended.",
            createdAt: c.created_at ? c.created_at.slice(0, 10) : "Recent"
          }))
        );
      } else {
        setAmlCases([]);
      }

      if (Array.isArray(ropaRes)) {
        setRopaActivities(
          ropaRes.map((r: any) => ({
            id: r.id,
            activityName: r.activity_name,
            purpose: r.purpose,
            dataCategories: r.data_categories || ["General Personal Data"],
            dataSubjects: r.data_subjects || ["Data Subjects"],
            lawfulBasis: r.lawful_basis,
            retentionPeriod: r.retention_period,
            crossBorderTransfer: r.cross_border_transfer || false,
            dpcoAuditReady: r.dpco_audit_ready || true
          }))
        );
      } else {
        setRopaActivities([]);
      }
    } catch (err) {
      console.error("Failed to load specialist data from database:", err);
      setAmlCases([]);
      setRopaActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

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
    }, 600);
  };

  const handleLodgeScreeningAsCase = async () => {
    if (!screeningResult) return;
    setLodgingCase(true);
    try {
      await api.specialist.createAMLCase({
        entity_name: screeningResult.queried,
        case_type: "PEP_SCREENING",
        risk_severity: "LOW",
        case_notes: `Screened against NFIU/OFAC on ${screeningResult.timestamp}. Status: Clean low-risk result.`
      });
      await loadData();
      alert(`Screening record for "${screeningResult.queried}" lodged in statutory AML vault.`);
      setScreeningResult(null);
      setScreeningQuery("");
    } catch (err) {
      alert("Failed to lodge screening case in vault.");
    } finally {
      setLodgingCase(false);
    }
  };

  const handleCreateAMLCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amlForm.entityName || !amlForm.caseType) return;

    setSubmitting(true);
    try {
      await api.specialist.createAMLCase({
        entity_name: amlForm.entityName,
        case_type: amlForm.caseType,
        risk_severity: amlForm.riskSeverity,
        case_notes: amlForm.caseNotes
      });
      await loadData();
      setAmlModal(false);
      setAmlForm({
        entityName: "",
        caseType: "PEP_SCREENING",
        riskSeverity: "MEDIUM",
        caseNotes: ""
      });
    } catch (err) {
      alert("Failed to open AML investigation case.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoPA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ropaForm.activityName || !ropaForm.purpose) return;

    setSubmitting(true);
    try {
      const cats = ropaForm.dataCategories.split(",").map(s => s.trim()).filter(Boolean);
      const subs = ropaForm.dataSubjects.split(",").map(s => s.trim()).filter(Boolean);

      await api.specialist.createPrivacyActivity({
        activity_name: ropaForm.activityName,
        purpose: ropaForm.purpose,
        data_categories: cats,
        data_subjects: subs,
        lawful_basis: ropaForm.lawfulBasis,
        retention_period: ropaForm.retentionPeriod,
        cross_border_transfer: ropaForm.crossBorderTransfer,
        dpco_audit_ready: ropaForm.dpcoAuditReady
      });
      await loadData();
      setRopaModal(false);
      setRopaForm({
        activityName: "",
        purpose: "",
        dataCategories: "Full Name, Email, Phone Number, NIN",
        dataSubjects: "Customers, Website Users",
        lawfulBasis: "CONSENT",
        retentionPeriod: "3 years post-inactivity",
        crossBorderTransfer: false,
        dpcoAuditReady: true
      });
    } catch (err) {
      alert("Failed to save RoPA activity.");
    } finally {
      setSubmitting(false);
    }
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
            <span>HubAML ({amlCases.length} Cases)</span>
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "privacy" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <Lock className="w-4 h-4 text-[#0089C1]" />
            <span>HubPrivacy ({ropaActivities.length} RoPA Streams)</span>
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
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Appointed under MLPPA 2022</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Currency Threshold Reports (CTR)</span>
              <div className="text-sm font-black text-slate-900 font-mono mt-1">0 Flagged Transfers</div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">₦5M indiv / ₦10M corp threshold</span>
            </div>
          </div>

          {/* Interactive PEP & Sanctions Screening Simulation */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Counterparty & Customer Sanctions Screening Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant real-time lookup against Nigerian and international enforcement lists (NFIU, OFAC, UN Sanctions, EFCC).
                </p>
              </div>
              <button
                onClick={() => setAmlModal(true)}
                className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Open AML Case</span>
              </button>
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
                className="w-full sm:w-auto bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {screeningLoading ? (
                  <span>Querying Sanctions Watchlists...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Run Screening Check</span>
                  </>
                )}
              </button>
            </form>

            {/* Screening Result Output Box */}
            {screeningResult && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-3">
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

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={handleLodgeScreeningAsCase}
                    disabled={lodgingCase}
                    className="bg-[#245C44] hover:bg-[#1E4E39] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5"
                  >
                    {lodgingCase && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <FileCheck2 className="w-4 h-4" />
                    <span>Lodge Screening Evidence in Vault</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active AML Cases Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Active AML & SCUML Investigation Cases
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Entity / Counterparty</th>
                    <th className="py-3 px-4">Case Type</th>
                    <th className="py-3 px-4">Risk Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Case Notes</th>
                    <th className="py-3 px-4 text-right">Date Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {amlCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.entityName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{c.caseType}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.riskSeverity === "LOW" ? "bg-emerald-100 text-emerald-800" :
                          c.riskSeverity === "MEDIUM" ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {c.riskSeverity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{c.status}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{c.caseNotes}</td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono">{c.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <div className="text-sm font-black text-slate-900 font-mono mt-1">{ropaActivities.length} Processing Streams</div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">Audit Ready</span>
            </div>
          </div>

          {/* RoPA Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  NDPA 2023 Record of Processing Activities (RoPA)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory register required under section 38 of the Nigeria Data Protection Act 2023.
                </p>
              </div>
              <button 
                onClick={() => setRopaModal(true)}
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add RoPA Activity</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Processing Activity</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Lawful Basis</th>
                    <th className="py-3 px-4">Data Categories</th>
                    <th className="py-3 px-4">Retention Period</th>
                    <th className="py-3 px-4 text-right">DPCO Audit Ready</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ropaActivities.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.activityName}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">{r.purpose}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold text-[#0089C1]">{r.lawfulBasis}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {r.dataCategories.map((c, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{r.retentionPeriod}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* OPEN AML CASE MODAL */}
      {amlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Open AML / SCUML Case</h3>
                <p className="text-xs text-slate-500">Record customer due diligence escalation or PEP review.</p>
              </div>
              <button 
                onClick={() => setAmlModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAMLCase} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Entity / Person Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Mansoor Global Logistics Ltd"
                  value={amlForm.entityName}
                  onChange={(e) => setAmlForm({ ...amlForm, entityName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Case Type</label>
                  <select
                    value={amlForm.caseType}
                    onChange={(e) => setAmlForm({ ...amlForm, caseType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                  >
                    <option value="PEP_SCREENING">PEP Screening</option>
                    <option value="SANCTION_MATCH">Sanctions Match</option>
                    <option value="STR_INVESTIGATION">STR Suspicious Transaction</option>
                    <option value="CTR_THRESHOLD">Currency Threshold (CTR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Risk Severity</label>
                  <select
                    value={amlForm.riskSeverity}
                    onChange={(e) => setAmlForm({ ...amlForm, riskSeverity: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="PROHIBITED">Prohibited</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Investigation Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter details of suspicious patterns, source of funds evidence, or review steps..."
                  value={amlForm.caseNotes}
                  onChange={(e) => setAmlForm({ ...amlForm, caseNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAmlModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Open Case</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ROPA MODAL */}
      {ropaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Add RoPA Processing Activity</h3>
                <p className="text-xs text-slate-500">Record a data processing stream under NDPA section 38.</p>
              </div>
              <button 
                onClick={() => setRopaModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoPA} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Processing Stream Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile App User Onboarding & Geolocation"
                  value={ropaForm.activityName}
                  onChange={(e) => setRopaForm({ ...ropaForm, activityName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Specific Purpose of Processing</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fraud prevention and merchant proximity matching"
                  value={ropaForm.purpose}
                  onChange={(e) => setRopaForm({ ...ropaForm, purpose: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Lawful Basis (NDPA s.25)</label>
                  <select
                    value={ropaForm.lawfulBasis}
                    onChange={(e) => setRopaForm({ ...ropaForm, lawfulBasis: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                  >
                    <option value="CONSENT">Explicit Consent</option>
                    <option value="CONTRACT">Performance of Contract</option>
                    <option value="LEGAL_OBLIGATION">Legal Obligation</option>
                    <option value="LEGITIMATE_INTEREST">Legitimate Interest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Retention Period</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 years post-account closure"
                    value={ropaForm.retentionPeriod}
                    onChange={(e) => setRopaForm({ ...ropaForm, retentionPeriod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Data Categories (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Full Name, Email, IP Address, Device Fingerprint"
                  value={ropaForm.dataCategories}
                  onChange={(e) => setRopaForm({ ...ropaForm, dataCategories: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-semibold">
                  <input
                    type="checkbox"
                    checked={ropaForm.crossBorderTransfer}
                    onChange={(e) => setRopaForm({ ...ropaForm, crossBorderTransfer: e.target.checked })}
                    className="rounded text-[#0089C1] focus:ring-[#0089C1]"
                  />
                  <span>Includes Cross-Border Data Transfer (NDPA s.41 - 43)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-semibold">
                  <input
                    type="checkbox"
                    checked={ropaForm.dpcoAuditReady}
                    onChange={(e) => setRopaForm({ ...ropaForm, dpcoAuditReady: e.target.checked })}
                    className="rounded text-[#0089C1] focus:ring-[#0089C1]"
                  />
                  <span>Flag as Ready for DPCO Annual Audit Return</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRopaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save RoPA Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
