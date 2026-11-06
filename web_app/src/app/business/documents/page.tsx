"use client";

import React, { useState } from "react";
import { 
  FolderArchive, 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  X,
  FileCheck2,
  Trash2
} from "lucide-react";

interface DocItem {
  id: string;
  name: string;
  category: "Corporate" | "Tax" | "Employee" | "Vendor" | "AML / KYC" | "Licences";
  uploadDate: string;
  expiryDate: string;
  isExpiringSoon: boolean;
  status: "Verified" | "Under Review" | "Expired";
  version: string;
  size: string;
  owner: string;
}

export default function BusinessDocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [docList, setDocList] = useState<DocItem[]>([
    {
      id: "doc-01",
      name: "CAC Certificate of Incorporation & Status Report (Form CAC 07)",
      category: "Corporate",
      uploadDate: "12 Jan 2024",
      expiryDate: "Perpetual",
      isExpiringSoon: false,
      status: "Verified",
      version: "v1.2",
      size: "2.4 MB",
      owner: "Adaeze Nwosu"
    },
    {
      id: "doc-02",
      name: "Nigeria Tax Act 2025/2026 TaxPro-MAX Transition Filing Record",
      category: "Tax",
      uploadDate: "05 Feb 2026",
      expiryDate: "30 June 2026",
      isExpiringSoon: true,
      status: "Verified",
      version: "v2.0",
      size: "1.1 MB",
      owner: "Emeka Okonkwo, FCA"
    },
    {
      id: "doc-03",
      name: "NDPA 2023 RoPA (Record of Processing Activities) Register",
      category: "Employee",
      uploadDate: "18 Jan 2026",
      expiryDate: "15 March 2026",
      isExpiringSoon: true,
      status: "Verified",
      version: "v3.1",
      size: "3.8 MB",
      owner: "Barr. Folashade Adeleke"
    },
    {
      id: "doc-04",
      name: "SCUML AML/CFT Compliance Policy Manual signed by Board",
      category: "AML / KYC",
      uploadDate: "10 Nov 2025",
      expiryDate: "31 Dec 2026",
      isExpiringSoon: false,
      status: "Verified",
      version: "v1.0",
      size: "4.2 MB",
      owner: "Tunde Bakare, CAMS"
    },
    {
      id: "doc-05",
      name: "Third-Party Cloud Infrastructure Signed Data Processing Agreement (DPA)",
      category: "Vendor",
      uploadDate: "02 Jan 2026",
      expiryDate: "02 Jan 2027",
      isExpiringSoon: false,
      status: "Under Review",
      version: "v1.0",
      size: "890 KB",
      owner: "Adaeze Nwosu"
    },
    {
      id: "doc-06",
      name: "Lagos State Business Premises Operating Permit (2025 Renewal)",
      category: "Licences",
      uploadDate: "14 Apr 2025",
      expiryDate: "14 Apr 2026",
      isExpiringSoon: true,
      status: "Expired",
      version: "v1.0",
      size: "620 KB",
      owner: "Internal Finance"
    }
  ]);

  // Form states for upload
  const [newDocName, setNewDocName] = useState("");
  const [newDocCat, setNewDocCat] = useState<DocItem["category"]>("Corporate");
  const [newDocExpiry, setNewDocExpiry] = useState("31 Dec 2026");

  const categories = ["All", "Corporate", "Tax", "Employee", "Vendor", "AML / KYC", "Licences"];

  const filteredDocs = docList.filter((d) => {
    const matchesCat = selectedCategory === "All" || d.category === selectedCategory;
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: DocItem = {
      id: `doc-${Date.now()}`,
      name: newDocName,
      category: newDocCat,
      uploadDate: "Today",
      expiryDate: newDocExpiry,
      isExpiringSoon: false,
      status: "Under Review",
      version: "v1.0",
      size: "1.5 MB",
      owner: "Adaeze Nwosu"
    };

    setDocList([newDoc, ...docList]);
    setNewDocName("");
    setUploadModalOpen(false);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0089C1] text-white">
              MOD-02
            </span>
            <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider">
              HubDocs Vault
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Evidence Vault & Expiry Tracker
          </h1>
          <p className="text-xs text-slate-500">
            Encrypted, tamper-evident corporate repository with automated 90/60/30-day statutory expiry alerting.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Evidence</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === c
                  ? "bg-[#1E293B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Document Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#0089C1] shrink-0" />
                    <div>
                      <span>{doc.name}</span>
                      <span className="block text-[10px] text-slate-400 font-normal font-mono">{doc.size} • Uploaded {doc.uploadDate}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono">
                    <span className={doc.isExpiringSoon ? "text-amber-600 font-bold" : "text-slate-700"}>
                      {doc.expiryDate}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.status === "Verified"
                        ? "bg-emerald-100 text-emerald-800"
                        : doc.status === "Expired"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-500">{doc.version}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{doc.owner}</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => alert(`Downloading verified cryptographic copy of: ${doc.name}`)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Download Evidence"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal (Blueprint Part 3.2 Screen 5) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 absolute top-5 right-5"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Upload Statutory Evidence Document
              </h3>
              <p className="text-xs text-slate-500">
                Uploaded files are time-stamped and assigned an immutable SHA-256 hash.
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025 Tax Clearance Certificate (TCC)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Category</label>
                <select
                  value={newDocCat}
                  onChange={(e) => setNewDocCat(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="Corporate">Corporate (CAC)</option>
                  <option value="Tax">Tax (FIRS / NRS)</option>
                  <option value="Employee">Employee / HR</option>
                  <option value="Vendor">Vendor / DPA</option>
                  <option value="AML / KYC">AML / KYC (SCUML)</option>
                  <option value="Licences">Licences & Permits</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Statutory Expiry Date</label>
                <input
                  type="text"
                  value={newDocExpiry}
                  onChange={(e) => setNewDocExpiry(e.target.value)}
                  placeholder="e.g. 31 Dec 2026 or Perpetual"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 bg-[#F8FAFC]">
                <Upload className="w-8 h-8 text-[#0089C1] mx-auto" />
                <p className="text-xs text-slate-600 font-bold">Drag & drop evidence PDF or click to browse</p>
                <span className="text-[10px] text-slate-400 block">PDF, PNG, DOCX up to 25MB</span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-bold py-3 rounded-xl shadow-xs transition-all text-xs"
              >
                Save & Lodge in HubDocs
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
