import React, { useState, useEffect } from 'react';
import { 
  LuX as X, 
  LuUser as User, 
  LuLock as Lock, 
  LuMail as Mail, 
  LuShieldCheck as ShieldCheck,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuUserPlus as UserPlus,
  LuCheck as Check,
  LuCircleAlert as AlertCircle,
  LuAtSign as AtSign
} from 'react-icons/lu';
import { toast } from 'sonner';
import useAuthStore from '../stores/authStore';
import { CustomInput, CustomSelect, CustomButton } from './ui';

const roleOptions = [
  { value: 'QA Lead', label: 'QA Lead' },
  { value: 'QA Tester', label: 'QA Tester' },
  { value: 'Developer', label: 'Developer' },
  { value: 'Product Owner', label: 'Product Owner' },
  { value: 'Super Admin', label: 'Super Admin' }
];

export default function CreateUserModal({ isOpen, onClose }) {
  const createUserByAdmin = useAuthStore((state) => state.createUserByAdmin);
  const currentUser = useAuthStore((state) => state.user);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'QA Tester'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'QA Tester'
      });
      setShowPassword(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await createUserByAdmin(formData);
      toast.success(`User account for "${newUser.name}" (${newUser.role}) created! 🎉`);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'QA Lead' || currentUser?.role === 'Admin';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md backdrop-saturate-150 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-md w-full overflow-hidden flex flex-col border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/30 flex items-center justify-center border border-purple-400/40">
              <ShieldCheck className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Create Team User Account
                <span className="text-[10px] bg-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full font-semibold border border-purple-400/30">
                  Super Admin Only
                </span>
              </h2>
              <p className="text-xs text-purple-200">
                Provision a new user account for QA or Engineering team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        {!isSuperAdmin ? (
          <div className="p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">Permission Denied</p>
            <p className="text-xs text-slate-500">
              Only Super Admin (Vireak) can create user accounts for team members.
            </p>
            <CustomButton variant="ghost" size="sm" onClick={onClose}>
              Close
            </CustomButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <CustomInput
                label="Full Name"
                required
                icon={User}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Morgan"
                size="md"
              />
            </div>

            {/* Email */}
            <div>
              <CustomInput
                label="Email Address"
                type="email"
                required
                icon={Mail}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. alex@pecc.com"
                size="md"
              />
            </div>

            {/* Username */}
            <div>
              <CustomInput
                label="Username (Optional)"
                icon={AtSign}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder={formData.email ? `e.g. ${formData.email.split('@')[0].toLowerCase()}` : "e.g. ratha"}
                size="md"
              />
            </div>

            {/* Role */}
            <div>
              <CustomSelect
                label="Assigned Team Role"
                options={roleOptions}
                value={formData.role}
                onChange={(val) => setFormData({ ...formData, role: val })}
                size="md"
                variant="solid"
                icon={ShieldCheck}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Initial Password
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
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
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

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <CustomButton variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                disabled={!formData.name.trim() || !formData.email.trim() || !formData.password.trim()}
                iconLeft={UserPlus}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Create Account
              </CustomButton>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
