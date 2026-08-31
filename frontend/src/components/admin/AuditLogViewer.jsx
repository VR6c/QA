import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  X,
  User,
  ShieldCheck,
  Calendar,
  Lock,
  Clock,
  Globe,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect, CustomPagination, PageTransition } from '../ui';
import CustomDatePicker from '../ui/CustomDatePicker';
import useAuthStore from '../../stores/authStore';
import { formatCambodiaShort, formatCambodiaTime, formatUTC } from '../../lib/utils';

export default function AuditLogViewer() {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const [activities, setActivities] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    modules: [],
    actions: [],
    statuses: [],
    roles: [],
    users: []
  });
  const [loading, setLoading] = useState(true);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pageDirection, setPageDirection] = useState('next');
  const [totalActivities, setTotalActivities] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Detail Modal
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
      const query = new URLSearchParams({
        page,
        limit,
        search,
        user_id: userFilter,
        role: roleFilter,
        module: moduleFilter,
        action: actionFilter,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo
      });

      const res = await fetch(`/api/activities?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const fallbackRes = await fetch(`/api/admin/activities?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!fallbackRes.ok) throw new Error('Failed to fetch activity logs');
        const fallbackData = await fallbackRes.json();
        const activityList = fallbackData.data || [];
        const metaObj = fallbackData.meta || fallbackData.pagination || {};
        setActivities(activityList);
        setTotalActivities(metaObj.total || activityList.length);
        setTotalPages(metaObj.totalPages || 1);
        const filterOpts = metaObj.filterOptions || fallbackData.filterOptions;
        if (filterOpts) setFilterOptions(filterOpts);
        return;
      }

      const data = await res.json();
      const activityList = data.data || [];
      const metaObj = data.meta || data.pagination || {};
      setActivities(activityList);
      setTotalActivities(metaObj.total || activityList.length);
      setTotalPages(metaObj.totalPages || 1);

      const filterOpts = metaObj.filterOptions || data.filterOptions;
      if (filterOpts) {
        setFilterOptions(filterOpts);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, limit, search, userFilter, roleFilter, moduleFilter, actionFilter, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch('');
    setUserFilter('');
    setRoleFilter('');
    setModuleFilter('');
    setActionFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Activity & Audit Trail Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            System activity history tracking who performed actions, when, which module was affected, and before/after diffs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Audit Trail Protection</span>
          </span>
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Multi-Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search ID, user, target, description..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* User Filter (ONLY for Super Admin) */}
          {isSuperAdmin && filterOptions.users && filterOptions.users.length > 0 && (
            <CustomSelect
              size="sm"
              placeholder="All Users"
              value={userFilter}
              onChange={(val) => { setUserFilter(val); setPage(1); }}
              options={[
                { value: '', label: 'All Users' },
                ...(filterOptions.users?.map(u => ({ value: u._id, label: `${u.name} (${u.role || u.email})` })) || [])
              ]}
            />
          )}

          {/* Action Filter */}
          <CustomSelect
            size="sm"
            placeholder="All Actions"
            value={actionFilter}
            onChange={(val) => { setActionFilter(val); setPage(1); }}
            options={[
              { value: '', label: 'All Actions' },
              ...(filterOptions.actions?.map(a => ({ value: a, label: a })) || [])
            ]}
          />

          {/* Status Filter */}
          <CustomSelect
            size="sm"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setPage(1); }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Success', label: 'Success', colorBadge: 'bg-emerald-500' },
              { value: 'Failed', label: 'Failed', colorBadge: 'bg-rose-500' },
              { value: 'Denied', label: 'Denied', colorBadge: 'bg-amber-500' }
            ]}
          />
        </div>

        {/* Date Range & Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <CustomDatePicker
                size="sm"
                mode="single"
                placeholder="From Date"
                value={dateFrom}
                onChange={(val) => { setDateFrom(val || ''); setPage(1); }}
                className="w-36"
              />
              <span className="text-slate-400 font-medium">to</span>
              <CustomDatePicker
                size="sm"
                mode="single"
                placeholder="To Date"
                value={dateTo}
                onChange={(val) => { setDateTo(val || ''); setPage(1); }}
                className="w-36"
              />
            </div>
          </div>

          {(search || userFilter || roleFilter || moduleFilter || actionFilter || statusFilter || dateFrom || dateTo) && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Activity ID</th>
                <th className="py-3.5 px-4">Date & Time (ICT / UTC+7)</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <PageTransition
              as="tbody"
              page={page}
              direction={pageDirection}
              className="divide-y divide-slate-100 font-mono text-[11px]"
            >
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-sans animate-pulse">
                    Loading audit records...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-sans">
                    No activity log entries found.
                  </td>
                </tr>
              ) : (
                activities.map((act) => {
                  const actId = act._id || act.activity_id;
                  return (
                    <tr key={actId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-blue-700">
                        {act.activity_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatCambodiaShort(act.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-blue-700 border border-slate-200 font-bold">
                          {act.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-700 max-w-xs truncate" title={act.description}>
                        {act.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {act.ip_address}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          act.status === 'Success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => { setSelectedActivity(act); setShowDetailModal(true); }}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                          title="Inspect Payload & Diff"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </PageTransition>
          </table>
        </div>

        {/* Pagination Control */}
        <div className="p-3 border-t border-slate-100">
          <CustomPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalActivities}
            itemsPerPage={limit}
            onPageChange={(p, dir) => {
              setPageDirection(dir || 'next');
              setPage(p);
            }}
            onItemsPerPageChange={(l) => {
              setLimit(l);
              setPageDirection('jump');
              setPage(1);
            }}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* ACTIVITY DETAIL & PAYLOAD INSPECTION MODAL */}
      {showDetailModal && selectedActivity && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-lg shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Activity Record Details
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedActivity.activity_id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - Structured Key-Value List */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl divide-y divide-slate-100">
                
                {/* User Row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>User Name</span>
                  </div>
                  <div className="text-right min-w-0">
                    <span className="font-bold text-slate-900 block truncate">{selectedActivity.user_name || 'System'}</span>
                    {selectedActivity.user_email && (
                      <span className="text-[10px] text-slate-400 font-mono block truncate">{selectedActivity.user_email}</span>
                    )}
                  </div>
                </div>

                {/* Role Row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Role</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold text-xs">
                    {selectedActivity.role_name}
                  </span>
                </div>

                {/* Action Row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Action</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono font-bold text-[11px]">
                    {selectedActivity.action}
                  </span>
                </div>

                {/* IP Address Row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <Globe className="w-4 h-4 text-cyan-600" />
                    <span>IP Address</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {selectedActivity.ip_address}
                  </span>
                </div>

                {/* Status Row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Status</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                    selectedActivity.status === 'Success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                  }`}>
                    {selectedActivity.status}
                  </span>
                </div>

                {/* Timestamp Row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Timestamp</span>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <span className="font-bold text-slate-900 block">{formatCambodiaTime(selectedActivity.createdAt)} (ICT)</span>
                    <span className="text-[10px] text-slate-400 block">{formatUTC(selectedActivity.createdAt)}</span>
                  </div>
                </div>

              </div>

              {/* Description Box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Description:
                </label>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 font-medium leading-relaxed">
                  {selectedActivity.description}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
