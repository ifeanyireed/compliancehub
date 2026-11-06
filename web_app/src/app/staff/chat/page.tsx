"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Sparkles, 
  UserCheck, 
  Building2, 
  ShieldCheck, 
  Clock, 
  CheckCheck,
  FileCheck2,
  AlertCircle
} from "lucide-react";

interface ChatSession {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_company: string;
  status: string;
  assigned_staff: string;
  last_message: string;
  updated_at: string;
}

interface ChatMessage {
  id?: number;
  session_id: string;
  sender: string; // visitor, staff
  sender_name: string;
  text: string;
  created_at?: string;
}

const CANNED_RESPONSES = [
  {
    title: "CAC CAMA 2020 Filing Window",
    text: "Under CAMA 2020 Section 377, your annual return must be lodged within 42 days following your company AGM. We can initiate this filing directly via HubBusiness."
  },
  {
    title: "2026 Tax Act Withholding",
    text: "Under the 2026 Nigeria Tax Act single window, withholding tax credit vouchers are now dynamically generated against your verified TIN on TaxPro-MAX."
  },
  {
    title: "NDPA Audit March 15 Deadline",
    text: "For companies handling over 10,000 Nigerian citizen records, annual external DPCO audits must be submitted to the NDPC by March 15."
  },
  {
    title: "SCUML DNFBP Documentation",
    text: "To process your SCUML AML certificate, we require your CAC incorporation pack, Tax Clearance Certificate (TCC), and designated AML officer appointment letter."
  }
];

export default function StaffLiveChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchSession, setSearchSession] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/chat/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (!activeSessionId && data.length > 0) {
          setActiveSessionId(data[0].id);
          fetchMessages(data[0].id);
        }
      }
    } catch (e) {
      console.warn("Using fallback sessions", e);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/chat/messages?session_id=${sessionId}`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
      }
    } catch (e) {
      console.warn("Using fallback messages", e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    fetchMessages(id);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || !activeSessionId) return;

    const newMsg: ChatMessage = {
      session_id: activeSessionId,
      sender: "staff",
      sender_name: "Babajide Sanwo (Support)",
      text: textToSend
    };

    setMessages(prev => [...prev, newMsg]);
    if (!customText) setInputMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      await fetch(`${apiUrl}/api/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg)
      });
      fetchSessions();
    } catch (e) {
      console.warn("Error sending message to API", e);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const filteredSessions = sessions.filter(s => 
    s.visitor_name.toLowerCase().includes(searchSession.toLowerCase()) ||
    s.visitor_company?.toLowerCase().includes(searchSession.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Support Live Chat Desk</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time chat session responder with customer compliance history context.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          Logged in as: <strong className="text-slate-900">Babajide Sanwo</strong>
        </div>
      </div>

      {/* 3-Pane Chat Console */}
      <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex overflow-hidden">
        {/* Left Pane: Sessions List */}
        <div className="w-72 sm:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search visitor chats..."
                value={searchSession}
                onChange={e => setSearchSession(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredSessions.map(s => {
              const isSelected = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected ? "bg-white border-l-4 border-[#0089C1] shadow-xs" : "hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {s.visitor_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.id}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 truncate mb-1.5 font-medium">
                    {s.visitor_company || s.visitor_email}
                  </p>

                  <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                    {s.last_message || "Active chat..."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Pane: Chat Message Thread */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {activeSession ? (
            <>
              {/* Chat Thread Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {activeSession.visitor_name}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {activeSession.visitor_company} • {activeSession.visitor_email}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Session
                  </span>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/40 text-xs">
                {messages.map((m, idx) => {
                  const isStaff = m.sender === "staff";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 px-1">
                        {m.sender_name}
                      </span>
                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-[75%] font-medium leading-relaxed ${
                          isStaff
                            ? "bg-[#0089C1] text-white rounded-tr-none shadow-xs"
                            : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Canned Responses Quick Bar */}
              <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#0089C1]" />
                  Canned:
                </span>
                {CANNED_RESPONSES.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(c.text)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-50 hover:border-[#0089C1] transition-all whitespace-nowrap shadow-xs"
                    title={c.text}
                  >
                    {c.title}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type compliance guidance or choose canned snippet above..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="px-4 py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a conversation to start chatting
            </div>
          )}
        </div>

        {/* Right Pane: Customer Compliance Context Profile */}
        {activeSession && (
          <div className="hidden xl:flex flex-col w-72 border-l border-slate-200 p-5 bg-slate-50/50 space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Customer Compliance Profile
              </span>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="w-4 h-4 text-[#0089C1]" />
                  <span className="font-bold text-slate-900 leading-tight">
                    {activeSession.visitor_company || "PayWave Tech Ltd"}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mb-2">
                  RC-1894231
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">CAC Status:</span>
                    <span className="text-emerald-600 font-bold">Active & Good Standing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TaxPro-MAX:</span>
                    <span className="text-emerald-600 font-bold">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NDPA Audit:</span>
                    <span className="text-amber-600 font-bold">Due March 15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SCUML Cert:</span>
                    <span className="text-slate-700 font-bold">Not Required</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Active Expert Retainer
              </span>
              <p className="text-xs font-bold text-slate-900">Tunde Bakare, CAMS</p>
              <p className="text-[11px] text-slate-500">Bakare Compliance Consultancy</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Practice Plus Escrow
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
