import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-3 px-4 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Live Sync active • Every Thing is Possible</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Made For Product Team - By Thary-Vireak</span>
          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
            v2.6.1 - 09/01/2026
          </span>
        </div>
      </div>
    </footer>
  );
}
