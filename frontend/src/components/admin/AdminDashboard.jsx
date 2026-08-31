import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Lock,
  ShieldCheck,
  KeyRound,
  FileText,
  ArrowRight,
  RefreshCw,
  Plus,
  Sliders,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      const data = await res.json();
      const payload = data.data || data;
      setStats(payload.stats || null);
      setRecentActivities(payload.recentActivities || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, bg: 'bg-blue-50/80', text: 'text-blue-700', border: 'border-blue-200/80', nav: 'users' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: UserCheck, bg: 'bg-emerald-50/80', text: 'text-emerald-700', border: 'border-emerald-200/80', nav: 'users' },
    { label: 'Inactive Users', value: stats?.inactiveUsers ?? 0, icon: UserX, bg: 'bg-amber-50/80', text: 'text-amber-700', border: 'border-amber-200/80', nav: 'users' },
    { label: 'Locked Users', value: stats?.lockedUsers ?? 0, icon: Lock, bg: 'bg-rose-50/80', text: 'text-rose-700', border: 'border-rose-200/80', nav: 'users' },
    { label: 'Total Roles', value: stats?.totalRoles ?? 0, icon: ShieldCheck, bg: 'bg-purple-50/80', text: 'text-purple-700', border: 'border-purple-200/80', nav: 'roles' },
    { label: 'Total Permissions', value: stats?.totalPermissions ?? 14, icon: KeyRound, bg: 'bg-cyan-50/80', text: 'text-cyan-700', border: 'border-cyan-200/80', nav: 'roles' },
    { label: 'Total Audit Logs', value: stats?.totalActivities ?? 0, icon: FileText, bg: 'bg-indigo-50/80', text: 'text-indigo-700', border: 'border-indigo-200/80', nav: 'activities' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Executive Dashboard Overview</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status of system users, role allocations, system configurations & activity audit trail.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(card.nav)}
              className="group cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-blue-400 transition-all duration-200 shadow-2xs hover:shadow-md relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center shadow-2xs`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 group-hover:text-blue-600 transition">
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Quick Actions & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Shortcuts */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Administrative Quick Actions</span>
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-xs font-medium text-slate-800 hover:text-blue-700 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100/60 text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">User Management</p>
                    <p className="text-[10px] text-slate-500">Create, edit & manage users</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
              </button>

              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-200 text-xs font-medium text-slate-800 hover:text-purple-700 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100/60 text-purple-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">RBAC Matrix Editor</p>
                    <p className="text-[10px] text-slate-500">Configure roles & permissions</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
              </button>

              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 text-xs font-medium text-slate-800 hover:text-emerald-700 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100/60 text-emerald-600">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">System Settings</p>
                    <p className="text-[10px] text-slate-500">Configure feature toggles</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
              </button>

              <button
                onClick={() => onNavigate('activities')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/60 border border-slate-200/80 hover:border-cyan-200 text-xs font-medium text-slate-800 hover:text-cyan-700 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-100/60 text-cyan-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Audit Logs</p>
                    <p className="text-[10px] text-slate-500">View immutable activity feed</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Recent Administrative Activity</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Latest 6 recorded events across User, Role, and Setting modules
                </p>
              </div>
              <button
                onClick={() => onNavigate('activities')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
              >
                <span>View All Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Loading recent audit log entries...
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No recent activity records found.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div
                    key={act._id || act.activity_id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        {act.status === 'Success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{act.user_name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200/80 text-slate-700 font-mono font-semibold">
                            {act.role_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{act.activity_id}]
                          </span>
                        </div>
                        <p className="text-slate-700 mt-1 font-medium leading-snug">
                          {act.description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Module: <span className="text-slate-700 font-semibold">{act.module}</span> • {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {act.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
