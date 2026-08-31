import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Sliders,
  FileText,
  ShieldAlert,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import SystemSettings from './SystemSettings';
import AuditLogViewer from './AuditLogViewer';

export default function SuperAdminShell({ onBackToApp, currentUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'users', label: 'User Management', icon: Users, badge: null },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, badge: null },
    { id: 'settings', label: 'System Settings', icon: Sliders, badge: null },
    { id: 'activities', label: 'Activity Logs', icon: FileText, badge: 'Immutable' }
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToApp}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200/80 shadow-2xs"
            title="Return to Main Application"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Return to QA Board</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-sm">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Super Admin Panel
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold tracking-wide uppercase">
                  v1.0 Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Centralized Governance, RBAC & Immutable Audit Control
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Admin Profile Card */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.name || 'Super Admin'}
              </p>
              <p className="text-[10px] text-blue-600 font-mono font-semibold">
                {currentUser?.role || 'Super Admin'} • UTC+07:00
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar Navigation & Module Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col shrink-0 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Admin Navigation
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-700 border border-blue-200 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom RBAC Indicator Card */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">RBAC Backend Enforced</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                All requests validate permissions on backend endpoints. Interface reflects assigned role scopes.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Workspace */}
        <main className="flex-1 bg-slate-50/50 p-4 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'roles' && <RoleManagement />}
          {activeTab === 'settings' && <SystemSettings />}
          {activeTab === 'activities' && <AuditLogViewer />}
        </main>
      </div>
    </div>
  );
}
