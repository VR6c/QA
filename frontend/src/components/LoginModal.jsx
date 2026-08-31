import React, { useState, useEffect } from 'react';
import {
  LuX as X,
  LuUser as User,
  LuLock as Lock,
  LuMail as Mail,
  LuShieldCheck as ShieldCheck,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuLogIn as LogIn,
  LuUserPlus as UserPlus,
  LuCheck as Check,
  LuCircleAlert as AlertCircle
} from 'react-icons/lu';
import { toast } from 'sonner';
import useAuthStore from '../stores/authStore';
import { CustomInput, CustomSelect, CustomButton } from './ui';

const roleOptions = [
  { value: 'QA Lead', label: 'QA Lead' },
  { value: 'QA Tester', label: 'QA Tester' },
  { value: 'Developer', label: 'Developer' },
  { value: 'Product Owner', label: 'Product Owner' }
];



export default function LoginModal() {
  const {
    isLoginModalOpen,
    closeLoginModal,
    authMode,
    setAuthMode,
    login,
    register,
    isLoading,
    authError,
    clearError,
    isAuthenticated
  } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'QA Tester'
  });

  useEffect(() => {
    if (isLoginModalOpen || !isAuthenticated) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'QA Tester'
      });
      setShowPassword(false);
      clearError();
    }
  }, [isLoginModalOpen, isAuthenticated, authMode]);

  // Modal is visible if explicitly opened OR if user is not authenticated (mandatory login)
  const isVisible = isLoginModalOpen || !isAuthenticated;

  if (!isVisible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      if (authMode === 'login') {
        const user = await login(formData.email, formData.password);
        toast.success(`Welcome back, ${user.name}! 👋`);
      } else {
        if (!formData.name) {
          toast.error('Please enter your full name');
          return;
        }
        const user = await register(formData);
        toast.success(`Account created! Welcome ${user.name} 🎉`);
      }
    } catch (err) {
      // Error handled by store authError state
    }
  };



  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 p-4 animate-in fade-in duration-200"
      onClick={isAuthenticated ? closeLoginModal : undefined}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-md w-full overflow-hidden flex flex-col border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
          {isAuthenticated && (
            <button
              onClick={closeLoginModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/90 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/40">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Product Team
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                Authentication Required to Access Workspace
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Error Alert */}
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Email field */}
          <div>
            <CustomInput
              label="Email Address"
              type="email"
              required
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. vireak@pecc.com"
              size="md"
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <CustomButton
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center shadow-lg shadow-blue-500/20 cursor-pointer"
            isLoading={isLoading}
            iconLeft={LogIn}
          >
            Sign In to Workspace
          </CustomButton>
        </form>

      </div>
    </div>
  );
}
