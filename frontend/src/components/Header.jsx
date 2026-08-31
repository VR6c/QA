import React, { useState, useRef, useEffect } from 'react';
import {
  LuKanban as Kanban,
  LuTable as Table,
  LuChartColumn as BarChart3,
  LuPlus as Plus,
  LuChevronDown as ChevronDown,
  LuLogIn as LogIn,
  LuLogOut as LogOut,
  LuUser as User,
  LuShieldCheck as ShieldCheck,
  LuUserPlus as UserPlus,
  LuShieldAlert as ShieldAlert,
  LuActivity as ActivityIcon,
  LuCamera as Camera
} from 'react-icons/lu';
import { toast } from 'sonner';
import useUIStore from '../stores/uiStore';
import useAuthStore from '../stores/authStore';
import { CustomButton } from './ui';

export default function Header({ tasks = [], onExportCSV, onSync, onOpenCreateUserModal }) {
  const { view, setView, openModal } = useUIStore();
  const { user, isAuthenticated, logout, openLoginModal, openProfileModal } = useAuthStore();

  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const userMenuRef = useRef(null);

  const isSuperAdmin = user?.role === 'Super Admin';

  const views = [
    { id: 'board', label: 'Board', icon: Kanban },
    { id: 'table', label: 'Data Table', icon: Table },
    { id: 'dashboard', label: 'KPIs', icon: BarChart3 },
    { id: 'activity', label: 'Activity Log', icon: ActivityIcon },
    { id: 'admin', label: 'Super Admin', icon: ShieldAlert }
  ];

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    toast.info('You have logged out.');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Brand & Actions Header */}
        <div className="flex items-center justify-between py-3 gap-4">

          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <img src="/qatask.png" alt="QA Logo" className="w-9 h-9 object-contain rounded-lg shadow-xs" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">Product Team</h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal hidden sm:block">
                Product Engineering & Quality Control Dashboard
              </p>
            </div>
          </div>

          {/* View Switcher & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* View Switcher (Kanban / Table / Dashboard / Activity Log / Super Admin) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              {views.filter(v => v.id !== 'admin' || isSuperAdmin).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${(view === id || (id === 'board' && view === 'kanban'))
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* + Add Task Button */}
            <CustomButton
              variant="primary"
              size="sm"
              iconLeft={Plus}
              onClick={() => openModal()}
            >
              <span className="hidden sm:inline">Add Task</span>
            </CustomButton>

            {/* Auth Section: Logged In User Profile or Sign In Button */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3.5 sm:py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full bg-slate-200" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
                    <p className="text-[10px] text-blue-600 font-semibold leading-none mt-0.5">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="min-w-0">

                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        {user.role}
                      </div>
                    </div>

                    <div className="pt-1 divide-y divide-slate-100">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          openProfileModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-indigo-600" />
                        Edit Profile & Avatar
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setView('activity');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ActivityIcon className="w-4 h-4 text-blue-600" />
                        My Activity Log
                      </button>


                      {isSuperAdmin && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            if (onOpenCreateUserModal) onOpenCreateUserModal();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 text-purple-600" />
                          Create User Account
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <CustomButton
                variant="solid"
                size="sm"
                iconLeft={LogIn}
                onClick={() => openLoginModal('login')}
                className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
              >
                Sign In
              </CustomButton>
            )}

          </div>
        </div>

      </div>
    </header>
  );
}
