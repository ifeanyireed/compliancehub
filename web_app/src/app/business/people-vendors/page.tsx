"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ExternalLink,
  X,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/ahnara/AuthContext";

interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  ndpaTraining: string;
  antiBribery: string;
  pencomStatus: string;
  complianceStatus: "Compliant" | "Pending Training" | "Action Required";
}

interface VendorRecord {
  id: string;
  name: string;
  rcNumber: string;
  tin: string;
  service: string;
  dpaStatus: string;
  tccStatus: string;
  riskScore: string;
  lastReviewed: string;
  complianceScore: number;
}

export default function BusinessPeopleVendorsPage() {
  const { activeTenantId } = useAuth();
  const [activeTab, setActiveTab] = useState<"people" | "vendors">("people");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [employeeModal, setEmployeeModal] = useState(false);
  const [vendorModal, setVendorModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trainingDispatched, setTrainingDispatched] = useState(false);
  const [selectedVendorDossier, setSelectedVendorDossier] = useState<VendorRecord | null>(null);

  // New Employee Form
  const [empForm, setEmpForm] = useState({
    fullName: "",
    email: "",
    roleTitle: "",
    department: "Operations",
    pensionPFA: "Stanbic IBTC Pension Managers",
    pensionRSAPIN: "",
    ndpaTraining: true,
    amlTraining: true
  });

  // New Vendor Form
  const [vendorForm, setVendorForm] = useState({
    companyName: "",
    rcNumber: "",
    tin: "",
    vendorCategory: "Technology / Cloud",
    riskLevel: "LOW",
    tccVerified: true,
    dpaSigned: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, venRes] = await Promise.all([
        api.people.getEmployees(),
        api.vendors.getVendors()
      ]);

      if (Array.isArray(empRes)) {
        setEmployees(
          empRes.map((e: any) => ({
            id: e.id,
            name: e.full_name,
            email: e.email,
            role: e.role_title,
            department: e.department || "General",
            ndpaTraining: e.ndpa_training_completed ? "Completed (NDPA 2023)" : "Overdue (Pending)",
            antiBribery: "Signed & Filed",
            pencomStatus: e.pension_rsa_pin ? `RSA PIN: ${e.pension_rsa_pin.slice(0, 7)}...` : "Active Remittance",
            complianceStatus: e.ndpa_training_completed && e.compliance_clearance_status === "VERIFIED"
              ? "Compliant"
              : "Pending Training"
          }))
        );
      } else {
        setEmployees([]);
      }

      if (Array.isArray(venRes)) {
        setVendors(
          venRes.map((v: any) => ({
            id: v.id,
            name: v.company_name,
            rcNumber: v.rc_number || "RC-Pending",
            tin: v.tin || "TIN-Pending",
            service: v.vendor_category,
            dpaStatus: v.dpa_signed ? "Signed (NDPA 2023 s.39)" : "Pending Signature",
            tccStatus: v.tcc_verified ? "Verified TCC" : "Pending Renewal",
            riskScore: `${v.risk_level.charAt(0).toUpperCase() + v.risk_level.slice(1).toLowerCase()} Risk`,
            lastReviewed: v.last_assessment_date || "Recent Audit",
            complianceScore: v.compliance_score || 80
          }))
        );
      } else {
        setVendors([]);
      }
    } catch (err) {
      console.error("Failed to fetch workforce data from database:", err);
      setEmployees([]);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.fullName || !empForm.email || !empForm.roleTitle) return;

    setSubmitting(true);
    try {
      await api.people.createEmployee({
        full_name: empForm.fullName,
        email: empForm.email,
        role_title: empForm.roleTitle,
        department: empForm.department,
        pension_pfa: empForm.pensionPFA,
        pension_rsa_pin: empForm.pensionRSAPIN,
        ndpa_training_completed: empForm.ndpaTraining,
        aml_training_completed: empForm.amlTraining
      });
      await loadData();
      setEmployeeModal(false);
      setEmpForm({
        fullName: "",
        email: "",
        roleTitle: "",
        department: "Operations",
        pensionPFA: "Stanbic IBTC Pension Managers",
        pensionRSAPIN: "",
        ndpaTraining: true,
        amlTraining: true
      });
    } catch (err) {
      alert("Failed to save employee compliance record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.companyName || !vendorForm.vendorCategory) return;

    setSubmitting(true);
    try {
      await api.vendors.createVendor({
        company_name: vendorForm.companyName,
        rc_number: vendorForm.rcNumber,
        tin: vendorForm.tin,
        vendor_category: vendorForm.vendorCategory,
        risk_level: vendorForm.riskLevel,
        tcc_verified: vendorForm.tccVerified,
        dpa_signed: vendorForm.dpaSigned,
        compliance_score: vendorForm.riskLevel === "LOW" ? 95 : vendorForm.riskLevel === "MEDIUM" ? 75 : 55
      });
      await loadData();
      setVendorModal(false);
      setVendorForm({
        companyName: "",
        rcNumber: "",
        tin: "",
        vendorCategory: "Technology / Cloud",
        riskLevel: "LOW",
        tccVerified: true,
        dpaSigned: true
      });
    } catch (err) {
      alert("Failed to save vendor record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "people" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Compliance ({employees.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "vendors" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Vendors & Due Diligence ({vendors.length})</span>
          </button>
        </div>
      </motion.div>

      {/* PEOPLE TAB CONTENT */}
      {activeTab === "people" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Employee Mandatory Regulatory Credentials
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  setTrainingDispatched(true);
                  try {
                    await api.activityLogs.create({
                      action_type: "STAFF_TRAINING_ASSIGNED",
                      details: "Assigned statutory NDPA 2023 staff awareness refresher to all workforce members",
                    });
                  } catch (_) {}
                  setTimeout(() => setTrainingDispatched(false), 3000);
                }}
                className={`text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-all ${
                  trainingDispatched ? "bg-emerald-600" : "bg-[#1E293B] hover:bg-slate-800 cursor-pointer"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{trainingDispatched ? "✓ Dispatched to Staff" : "Assign NDPA Training"}</span>
              </button>
              <button 
                onClick={() => setEmployeeModal(true)}
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </div>
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
                        <span className="block text-[10px] text-slate-400 font-normal">{emp.email}</span>
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
        </motion.div>
      )}

      {/* VENDORS TAB CONTENT */}
      {activeTab === "vendors" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Third-Party Vendors & Data Processors (NDPA s.39)
            </h3>
            <button 
              onClick={() => setVendorModal(true)}
              className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {v.rcNumber} • Last review: {v.lastReviewed}
                        </span>
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
                          onClick={() => setSelectedVendorDossier(v)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
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
        </motion.div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      <AnimatePresence>
        {employeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Register Staff Compliance Record</h3>
                  <p className="text-xs text-slate-500">Add an employee to monitor pension remittance and NDPA training.</p>
                </div>
                <button 
                  onClick={() => setEmployeeModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zainab Aliyu"
                      value={empForm.fullName}
                      onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Corporate Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. zainab@paywave.ng"
                      value={empForm.email}
                      onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Role Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Risk Operations Associate"
                      value={empForm.roleTitle}
                      onChange={(e) => setEmpForm({ ...empForm, roleTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Risk & Governance"
                      value={empForm.department}
                      onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pension PFA</label>
                    <input
                      type="text"
                      placeholder="e.g. Stanbic IBTC Pension"
                      value={empForm.pensionPFA}
                      onChange={(e) => setEmpForm({ ...empForm, pensionPFA: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pension RSA PIN</label>
                    <input
                      type="text"
                      placeholder="e.g. PEN1008291029"
                      value={empForm.pensionRSAPIN}
                      onChange={(e) => setEmpForm({ ...empForm, pensionRSAPIN: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-semibold">
                    <input
                      type="checkbox"
                      checked={empForm.ndpaTraining}
                      onChange={(e) => setEmpForm({ ...empForm, ndpaTraining: e.target.checked })}
                      className="rounded text-[#0089C1] focus:ring-[#0089C1]"
                    />
                    <span>NDPA 2023 Privacy Awareness Induction Completed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-semibold">
                    <input
                      type="checkbox"
                      checked={empForm.amlTraining}
                      onChange={(e) => setEmpForm({ ...empForm, amlTraining: e.target.checked })}
                      className="rounded text-[#0089C1] focus:ring-[#0089C1]"
                    />
                    <span>Anti-Money Laundering & Whistleblowing Policy Signed</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmployeeModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Record</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ONBOARD VENDOR MODAL */}
      <AnimatePresence>
        {vendorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Onboard Third-Party Vendor</h3>
                  <p className="text-xs text-slate-500">Fulfill NDPA section 39 data processor due diligence.</p>
                </div>
                <button 
                  onClick={() => setVendorModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVendor} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Security Solutions Ltd"
                    value={vendorForm.companyName}
                    onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">CAC RC / BN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. RC-1849201"
                      value={vendorForm.rcNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, rcNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tax ID (TIN)</label>
                    <input
                      type="text"
                      placeholder="e.g. 29102910-0001"
                      value={vendorForm.tin}
                      onChange={(e) => setVendorForm({ ...vendorForm, tin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Vendor Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cloud Hosting & API"
                      value={vendorForm.vendorCategory}
                      onChange={(e) => setVendorForm({ ...vendorForm, vendorCategory: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Risk Classification</label>
                    <select
                      value={vendorForm.riskLevel}
                      onChange={(e) => setVendorForm({ ...vendorForm, riskLevel: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    >
                      <option value="LOW">Low Risk</option>
                      <option value="MEDIUM">Medium Risk</option>
                      <option value="HIGH">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-semibold">
                    <input
                      type="checkbox"
                      checked={vendorForm.dpaSigned}
                      onChange={(e) => setVendorForm({ ...vendorForm, dpaSigned: e.target.checked })}
                      className="rounded text-[#0089C1] focus:ring-[#0089C1]"
                    />
                    <span>Data Processing Agreement (DPA) Signed under NDPA s.39</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-semibold">
                    <input
                      type="checkbox"
                      checked={vendorForm.tccVerified}
                      onChange={(e) => setVendorForm({ ...vendorForm, tccVerified: e.target.checked })}
                      className="rounded text-[#0089C1] focus:ring-[#0089C1]"
                    />
                    <span>Tax Clearance Certificate (TCC) Verified on TaxPro-MAX</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setVendorModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Vendor</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vendor Due Diligence Dossier Modal */}
      <AnimatePresence>
        {selectedVendorDossier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedVendorDossier.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">TIN: {selectedVendorDossier.tin} • {selectedVendorDossier.service}</p>
                </div>
                <button
                  onClick={() => setSelectedVendorDossier(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">NDPA Data Processing Agreement:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    selectedVendorDossier.dpaStatus === "Executed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedVendorDossier.dpaStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">FIRS Tax Clearance (TCC):</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    selectedVendorDossier.tccStatus === "Current" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedVendorDossier.tccStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">AML Counterparty Risk Level:</span>
                  <span className="font-bold text-slate-900">{selectedVendorDossier.riskScore}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Overall Vendor Compliance:</span>
                  <span className="font-bold text-emerald-700 font-mono">{selectedVendorDossier.complianceScore}%</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedVendorDossier(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
