"use client";

import React, { useState, useEffect } from "react";
import { 
  Ticket, 
  Search, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  MessageSquare,
  Building2,
  ChevronRight
} from "lucide-react";

interface TicketReply {
  id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  customer_name: string;
  customer_email: string;
  company_name: string;
  rc_number: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  replies?: TicketReply[];
}

export default function StaffTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/support/tickets`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.warn("Using fallback tickets", e);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
      }
    } catch (e) {
      console.warn("Using fallback details", e);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSelectTicket = (t: SupportTicket) => {
    setSelectedTicket(t);
    fetchTicketDetails(t.id);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/support/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name: "Babajide Sanwo (Support)",
          sender_role: "STAFF",
          message: replyText
        })
      });

      if (res.ok) {
        setReplyText("");
        fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      }
    } catch (e) {
      console.warn("Failed sending reply", e);
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      await fetch(`${apiUrl}/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (e) {}
  };

  const filtered = tickets.filter(t => {
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesSearch = search === "" ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Support Inquiries & Filing Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Review and resolve corporate compliance queries submitted across Nigerian business accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            {tickets.length} Registered Tickets
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === s
                  ? "bg-[#1E293B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "ALL" ? "All Statuses" : s}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket ID or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
          />
        </div>
      </div>

      {/* Dual Pane / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className={`${selectedTicket ? "lg:col-span-6" : "lg:col-span-12"} bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden`}>
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase tracking-wider">
            Tickets Queue ({filtered.length})
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map(t => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? "bg-slate-50 border-l-4 border-[#0089C1]" : "hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {t.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      t.priority === "URGENT" ? "bg-rose-100 text-rose-700" :
                      t.priority === "HIGH" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {t.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-2 font-medium">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{t.customer_name} ({t.company_name || "Company"})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700" :
                      t.status === "IN_PROGRESS" ? "bg-sky-50 text-sky-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Ticket Conversation Drawer */}
        {selectedTicket && (
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col max-h-[700px] overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-slate-500">{selectedTicket.id}</span>
                  <span className="text-xs font-bold text-slate-900">{selectedTicket.category}</span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {selectedTicket.subject}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Status Toggle */}
            <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Change Status:</span>
              <div className="flex items-center gap-1.5">
                {["OPEN", "IN_PROGRESS", "RESOLVED"].map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedTicket.status === st
                        ? "bg-[#0089C1] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {/* Original Query */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{selectedTicket.customer_name}</span>
                  <span className="text-[10px] text-slate-400">{selectedTicket.created_at?.split("T")[0]}</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Thread Replies */}
              {selectedTicket.replies?.map((rep, idx) => {
                const isStaff = rep.sender_role === "STAFF";
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl ${
                      isStaff 
                        ? "bg-sky-50/80 border border-sky-200 text-sky-950 ml-4" 
                        : "bg-slate-50 border border-slate-200 text-slate-800 mr-4"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{rep.sender_name}</span>
                      <span className="text-[10px] text-slate-400">{rep.created_at?.split("T")[0]}</span>
                    </div>
                    <p className="leading-relaxed font-medium">
                      {rep.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type official support reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendReply()}
                  className="flex-1 px-4 py-2 bg-slate-100 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply}
                  className="px-4 py-2 bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                >
                  {sendingReply ? "Sending..." : "Reply"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
