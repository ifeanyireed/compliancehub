"use client";

import React, { useState } from "react";
import { 
  Users, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  ShieldCheck, 
  FileText, 
  Clock, 
  GraduationCap,
  Sparkles,
  ExternalLink
} from "lucide-react";

export default function BusinessPeopleVendorsPage() {
  const [activeTab, setActiveTab] = useState<"people" | "vendors">("people");
  const [vendorModal, setVendorModal] = useState(false);

  const employees = [
    {
      id: "emp-01",
      name: "Adaeze Nwosu",
      role: "Managing Director",
      department: "Executive",
      ndpaTraining: "Completed (2026 Cert #9401)",
      antiBribery: "Signed",
      pencomStatus: "Active Remittance",
      complianceStatus: "Compliant"
    },
    {
      id: "emp-02",
      name: "Chukwudi Obi",
      role: "Lead Software Architect",
      department: "Engineering",
      ndpaTraining: "Completed (2026 Cert #9402)",
      antiBribery: "Signed",
      pencomStatus: "Active Remittance",
      complianceStatus: "Compliant"
    },
    {
      id: "emp-03",
      name: "Fatima Ibrahim",
      role: "Customer Operations Officer",
      department: "Operations",
      ndpaTraining: "Overdue (Enrolled)",
      antiBribery: "Signed",
      pencomStatus: "Active Remittance",
      complianceStatus: "Pending Training"
    },
    {
      id: "emp-04",
      name: "Kelechi Eze",
      role: "Junior Risk Analyst",
      department: "Risk & Compliance",
      ndpaTraining: "Completed (2026 Cert #9403)",
      antiBribery: "Pending Signature",
      pencomStatus: "Active Remittance",
      complianceStatus: "Action Required"
    }
  ];

  const vendors = [
    {
      id: "ven-01",
      name: "Amazon Web Services (AWS EMEA SARL)",
      service: "Cloud Infrastructure & Data Hosting",
      dpaStatus: "Signed (NDPA 2023 s.39 Compliant)",
      tccStatus: "Exempt (Non-Resident)",
      riskScore: "Low Risk",
      lastReviewed: "15 Jan 2026"
    },
    {
      id: "ven-02",
      name: "Prembly Technologies Ltd",
      service: "KYC & Identity Verification API",
      dpaStatus: "Signed",
      tccStatus: "Verified 2025/2026",
      riskScore: "Low Risk",
      lastReviewed: "02 Feb 2026"
    },
    {
      id: "ven-03",
      name: "Swift Facility Services Ltd",
      service: "Office Security & Janitorial",
      dpaStatus: "Not Applicable",
      tccStatus: "Pending Renewal",
      riskScore: "Medium Risk",
      lastReviewed: "10 Dec 2025"
    },
    {
      id: "ven-04",
      name: "Apex Haulage Logistics Partners",
      service: "Interstate Courier & Physical Delivery",
      dpaStatus: "Under Review",
      tccStatus: "Pending Renewal",
      riskScore: "High Risk",
      lastReviewed: "20 Jan 2026"
    }
  ];

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0089C1] text-white">
              MOD-03 & 04
            </span>
            <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider">
              HubPeople & HubVendors
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Workforce & Supply Chain Governance
          </h1>
          <p className="text-xs text-slate-500">
            Track statutory employee prerequisites, training certifications, and vendor data processing agreements.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="bg-[#E8EFF4] p-1.5 rounded-2xl border border-slate-300/40 flex items-center">
          <button
            onClick={() => setActiveTab("people")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "people" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Compliance (4)</span>
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "vendors" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Vendors & Due Diligence (4)</span>
          </button>
        </div>
      </div>

      {/* PEOPLE TAB CONTENT */}
      {activeTab === "people" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Employee Mandatory Regulatory Credentials
            </h3>
            <button 
              onClick={() => alert("Assigned NDPA 2023 staff awareness refresher to all 4 employees.")}
              className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Assign NDPA Training</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Employee Name</th>
                    <th className="py-3.5 px-4">Role & Dept</th>
                    <th className="py-3.5 px-4">NDPA 2023 Training</th>
                    <th className="py-3.5 px-4">Anti-Bribery Policy</th>
                    <th className="py-3.5 px-4">PENCOM Remittance</th>
                    <th className="py-3.5 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {emp.name}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <span className="font-semibold">{emp.role}</span>
                        <span className="block text-[10px] text-slate-400">{emp.department}</span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-700">
                        {emp.ndpaTraining}
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-semibold">
                        {emp.antiBribery}
                      </td>
                      <td className="py-4 px-4 text-emerald-700 font-bold">
                        {emp.pencomStatus}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          emp.complianceStatus === "Compliant"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {emp.complianceStatus}
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

      {/* VENDORS TAB CONTENT */}
      {activeTab === "vendors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Third-Party Vendors & Data Processors (NDPA s.39)
            </h3>
            <button 
              onClick={() => alert("Vendor risk assessment triggered.")}
              className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Vendor</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Vendor Name</th>
                    <th className="py-3.5 px-4">Service Provided</th>
                    <th className="py-3.5 px-4">Signed DPA Status</th>
                    <th className="py-3.5 px-4">Tax Clearance (TCC)</th>
                    <th className="py-3.5 px-4">Risk Rating</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {v.name}
                        <span className="block text-[10px] text-slate-400 font-normal">Last reviewed: {v.lastReviewed}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{v.service}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800">{v.dpaStatus}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{v.tccStatus}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.riskScore.includes("Low")
                            ? "bg-emerald-100 text-emerald-800"
                            : v.riskScore.includes("Medium")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {v.riskScore}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => alert(`Reviewing vendor due diligence pack for ${v.name}`)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                        >
                          Dossier
                        </button>
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
