import React from 'react';
import { Skeleton } from './ui/skeleton';

export function KanbanViewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((colIndex) => (
        <div key={colIndex} className="bg-slate-100/70 p-4 rounded-xl space-y-3 border border-slate-200/60">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <Skeleton className="h-5 w-28 opacity-90" />
            <Skeleton className="h-5 w-6 rounded-full opacity-90" />
          </div>
          {[1, 2, 3].map((cardIndex) => (
            <div key={cardIndex} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16 opacity-80" />
                <Skeleton className="h-5 w-20 rounded-full opacity-90" />
              </div>
              <Skeleton className="h-5 w-full opacity-85" />
              <Skeleton className="h-4 w-3/4 opacity-75" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-20 rounded-md opacity-80" />
                <Skeleton className="h-6 w-6 rounded-full opacity-90" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function TableViewSkeleton() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs space-y-4 p-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <Skeleton className="h-6 w-36 opacity-90" />
        <Skeleton className="h-8 w-28 rounded-lg opacity-90" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((rowIndex) => (
          <div key={rowIndex} className="flex items-center space-x-4 py-2.5 border-b border-slate-100 last:border-0">
            <Skeleton className="h-4 w-24 opacity-80" />
            <Skeleton className="h-4 flex-1 opacity-80" />
            <Skeleton className="h-6 w-20 rounded-full opacity-90" />
            <Skeleton className="h-6 w-24 rounded-full opacity-90" />
            <Skeleton className="h-4 w-16 opacity-80" />
            <Skeleton className="h-8 w-8 rounded-lg opacity-90" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <Skeleton className="h-4 w-24 opacity-80" />
            <Skeleton className="h-8 w-16 opacity-90" />
            <Skeleton className="h-3 w-32 opacity-75" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <Skeleton className="h-6 w-40 opacity-90" />
          <Skeleton className="h-64 w-full rounded-lg opacity-70" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <Skeleton className="h-6 w-40 opacity-90" />
          <Skeleton className="h-64 w-full rounded-lg opacity-70" />
        </div>
      </div>
    </div>
  );
}

export function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-16 opacity-80" />
            <Skeleton className="h-5 w-5 rounded-full opacity-90" />
          </div>
          <Skeleton className="h-7 w-12 opacity-90" />
          <Skeleton className="h-3 w-20 opacity-75" />
        </div>
      ))}
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="relative z-30 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3.5 animate-in fade-in duration-200">
      {/* Search & Task Count Badge Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] max-w-xl flex items-center gap-2.5">
          <Skeleton className="h-8 flex-1 rounded-md opacity-80" />
          <Skeleton className="h-7 w-24 rounded-xl opacity-80" />
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Skeleton className="h-7 w-24 rounded-xl opacity-80" />
          <Skeleton className="h-7 w-32 rounded-xl opacity-80" />
          <Skeleton className="h-7 w-16 rounded-xl opacity-80" />
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="hidden sm:flex flex-wrap items-center gap-2.5 pt-1">
        <Skeleton className="h-8 w-36 rounded-md opacity-80" />
        <Skeleton className="h-8 w-36 rounded-md opacity-80" />
        <Skeleton className="h-8 w-36 rounded-md opacity-80" />
        <Skeleton className="h-8 w-36 rounded-md opacity-80" />
        <Skeleton className="h-8 w-44 rounded-md opacity-80" />
      </div>

      {/* Quick Date Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100/80">
        <Skeleton className="h-4 w-16 rounded-md opacity-70" />
        <Skeleton className="h-6 w-14 rounded-lg opacity-80" />
        <Skeleton className="h-6 w-16 rounded-lg opacity-80" />
        <Skeleton className="h-6 w-18 rounded-lg opacity-80" />
        <Skeleton className="h-6 w-20 rounded-lg opacity-80" />
      </div>
    </div>
  );
}

export default function ViewSkeleton({ view = 'board' }) {
  return (
    <div className="space-y-4 py-2 animate-in fade-in duration-300">
      <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mb-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        <span>Loading content...</span>
      </div>
      {(view === 'board' || view === 'kanban') && <KanbanViewSkeleton />}
      {view === 'table' && <TableViewSkeleton />}
      {view === 'dashboard' && <DashboardViewSkeleton />}
    </div>
  );
}

