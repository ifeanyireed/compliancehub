"use client";

import React, { useState, useEffect } from "react";
import { Building2, ChevronUp, ChevronDown, Check, X, Minimize2, Sparkles } from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { MOCK_CLIENT_WORKSPACES } from "@/lib/compliance-data";

export function FloatingEntityBar() {
  const { switchTenant, activeTenantId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const selectedWorkspace =
    MOCK_CLIENT_WORKSPACES.find((w) => w.id === activeTenantId) || MOCK_CLIENT_WORKSPACES[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#floating-entity-bar")) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        title="Open Entity Switcher (Demo)"
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-xl transition-all flex items-center gap-2 text-xs backdrop-blur-md animate-in fade-in duration-200"
      >
        <Building2 className="w-3.5 h-3.5 text-[#00C2FF]" />
        <span className="font-semibold">{selectedWorkspace.logoText}</span>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{selectedWorkspace.rcNumber}</span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div
        id="floating-entity-bar"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs animate-in fade-in duration-200"
      >
        <div
          className="w-5 h-5 rounded-md text-white font-bold text-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: selectedWorkspace.colorScheme }}
        >
          {selectedWorkspace.logoText}
        </div>
        <span className="font-bold truncate max-w-[140px] sm:max-w-none">{selectedWorkspace.name}</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
          title="Expand Switcher"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-rose-400"
          title="Dismiss Bar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      id="floating-entity-bar"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[95vw] animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {/* Upward Entity Selector Tray */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[340px] sm:w-[380px] max-w-[90vw] bg-slate-900/98 border border-slate-700/90 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#00C2FF] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#00C2FF]" />
                Switch Business Entity
              </p>
              <p className="text-[10px] text-slate-400">Simulate Nigerian compliance context</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-1.5 space-y-1 max-h-64 overflow-y-auto">
            {MOCK_CLIENT_WORKSPACES.map((ws) => {
              const isCurrent = ws.id === selectedWorkspace.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchTenant(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                    isCurrent
                      ? "bg-[#0089C1]/20 border border-[#0089C1]/40 text-white"
                      : "hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: ws.colorScheme }}
                  >
                    {ws.logoText}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{ws.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {ws.rcNumber} • {ws.industry} ({ws.state})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30">
                      {ws.readinessScore}%
                    </span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#00C2FF]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bar Capsule */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div
          className="w-6 h-6 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: selectedWorkspace.colorScheme }}
        >
          {selectedWorkspace.logoText}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#00C2FF]">Active Entity</span>
              <span className="text-[9px] text-slate-400 font-mono">({selectedWorkspace.rcNumber})</span>
            </div>
            <p className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-[220px]">
              {selectedWorkspace.name}
            </p>
          </div>
          <div className="p-1 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white transition-colors">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        <div className="h-5 w-px bg-slate-800" />

        <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {selectedWorkspace.readinessScore}% Score
        </span>

        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          title="Minimize floating bar"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-rose-400"
          title="Dismiss temporary bar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
