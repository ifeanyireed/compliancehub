"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { 
  Headphones, 
  MessageSquare, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Filter,
  UserCheck
} from "lucide-react";

interface TicketItem {
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
}

interface ChatSessionItem {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_company: string;
  status: string;
  assigned_staff: string;
  last_message: string;
  updated_at: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadSupportData() {
      try {
        const [tickData, chatData] = await Promise.all([
          api.support.getTickets(),
          api.chat.getSessions()
        ]);
        if (tickData && Array.isArray(tickData)) setTickets(tickData);
        if (chatData && Array.isArray(chatData)) setSessions(chatData);
      } catch (e) {
        console.warn("Using local fallback support records", e);
      }
    }
    loadSupportData();
  }, []);

  const filteredTickets = tickets.filter(t => statusFilter === "ALL" || t.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Support Operations & Resolution Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Monitor incoming client compliance inquiries, live chats, and officer assignments.
          </p>
        </div>

        <Link href="/staff/dashboard">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all">
            <Headphones className="w-4 h-4" />
            <span>Open Staff Console</span>
          </button>
        </Link>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Average Resolution Time</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            1.8 Hours
          </div>
          <div className="mt-1 text-[11px] font-bold text-emerald-600">
            Target: &lt; 4.0 Hours
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Open Ticket Queue</span>
            <Ticket className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {tickets.filter(t => t.status !== "RESOLVED").length} Tickets
          </div>
          <div className="mt-1 text-[11px] font-bold text-slate-500">
            {tickets.filter(t => t.priority === "URGENT" || t.priority === "HIGH").length} high priority
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Live Chat Sessions</span>
            <MessageSquare className="w-4 h-4 text-[#0089C1]" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {sessions.filter(s => s.status === "ACTIVE").length} Active
          </div>
          <div className="mt-1 text-[11px] font-bold text-emerald-600">
            2 staff officers online
          </div>
        </div>
      </div>

      {/* Grid: Tickets & Active Chats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Support Tickets Queue */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Statutory Support Ticket Queue
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Customer regulatory assistance requests submitted to resolution desk
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                    statusFilter === status
                      ? "bg-[#0089C1] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTickets.map(t => (
              <div key={t.id} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {t.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === "URGENT" ? "bg-rose-100 text-rose-700" :
                      t.priority === "HIGH" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {t.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-2">
                    {t.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span>{t.customer_name} ({t.company_name || "Enterprise"})</span>
                    <span>•</span>
                    <span className="text-[#0089C1] font-semibold">{t.category}</span>
                    <span>•</span>
                    <span>Assigned: <strong className="text-slate-700">{t.assigned_to || "Unassigned"}</strong></span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    t.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    t.status === "IN_PROGRESS" ? "bg-sky-50 text-sky-700 border border-sky-200" :
                    "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {t.status}
                  </span>

                  <div className="mt-2">
                    <Link href={`/staff/tickets`}>
                      <button className="text-[11px] font-bold text-[#0089C1] hover:underline flex items-center gap-1 justify-end">
                        <span>Open & Reply</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Live Chat Monitor */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Live Chat Sessions
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Active customer support conversations
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/70 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                      {s.visitor_name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {s.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mb-1">
                    {s.visitor_company || s.visitor_email}
                  </div>
                  <div className="text-xs text-slate-700 font-medium line-clamp-2 italic bg-white/70 p-2 rounded-xl border border-slate-200/40 mb-2">
                    "{s.last_message || "Active chat..."}"
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Officer: <strong className="text-slate-600">{s.assigned_staff}</strong></span>
                    <Link href="/staff/chat">
                      <span className="text-[#0089C1] font-bold hover:underline cursor-pointer">
                        Jump to Chat
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/staff/chat">
              <button className="w-full py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white text-xs font-bold transition-colors text-center shadow-xs">
                Open Full Support Live Chat Desk
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
