import React, { useState, useEffect, useRef } from 'react';
import { 
  LuX, 
  LuUser, 
  LuUpload, 
  LuLink, 
  LuLayoutGrid as LuGrid, 
  LuCheck, 
  LuShieldCheck, 
  LuCamera, 
  LuSparkles,
  LuLoader
} from 'react-icons/lu';
import { toast } from 'sonner';
import useAuthStore from '../stores/authStore';

const PRESET_AVATARS = [
  { name: 'Vireak', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vireak' },
  { name: 'Tester', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tester' },
  { name: 'Developer', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Developer' },
  { name: 'Admin', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' },
  { name: 'Alex', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { name: 'Jordan', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
  { name: 'Sam', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
  { name: 'Taylor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor' },
  { name: 'Morgan', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan' },
  { name: 'Chris', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris' },
  { name: 'Riley', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley' },
  { name: 'Casey', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey' }
];

export default function ProfileModal() {
  const { user, isProfileModalOpen, closeProfileModal, updateProfile, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarTab, setAvatarTab] = useState('preset'); // 'preset' | 'upload' | 'url'
  const [customUrl, setCustomUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      if (user.avatar && !user.avatar.includes('dicebear')) {
        if (user.avatar.startsWith('data:image')) {
          setAvatarTab('upload');
        } else {
          setAvatarTab('url');
          setCustomUrl(user.avatar);
        }
      } else {
        setAvatarTab('preset');
      }
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const handleFileChange = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    // Validate file size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatar(e.target.result);
      toast.success('Image loaded for preview!');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Full name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatar: avatar
      });
      toast.success('Profile updated successfully!');
      closeProfileModal();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <button
            onClick={closeProfileModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <LuCamera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Edit Profile</h2>
              <p className="text-xs text-blue-100 font-medium">Update your profile info and avatar</p>
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Current Avatar Preview & Info */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="relative group shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name || 'Avatar'}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-200 border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl border-2 border-white shadow-md">
                  {name ? name[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
                <LuSparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">{name || user.name}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  <LuShieldCheck className="w-3 h-3" />
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">@{user.username || 'username'}</p>
            </div>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <LuUser className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Profile Image Selection Header & Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                Choose Profile Image
              </label>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAvatarTab('preset')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    avatarTab === 'preset'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LuGrid className="w-3.5 h-3.5" />
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('upload')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    avatarTab === 'upload'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LuUpload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('url')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    avatarTab === 'url'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LuLink className="w-3.5 h-3.5" />
                  Image URL
                </button>
              </div>
            </div>

            {/* Tab 1: Preset Avatars Gallery */}
            {avatarTab === 'preset' && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-slate-200/70">
                {PRESET_AVATARS.map((item, index) => {
                  const isSelected = avatar === item.url;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatar(item.url)}
                      className={`relative group rounded-xl p-1.5 border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-white'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover bg-white"
                      />
                      <span className="text-[10px] font-medium text-slate-600 truncate w-full text-center">
                        {item.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                          <LuCheck className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Upload File */}
            {avatarTab === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-xs">
                  <LuUpload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click or drag image to upload
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PNG, JPG, WebP, SVG up to 5MB
                </p>
              </div>
            )}

            {/* Tab 3: Custom Image URL */}
            {avatarTab === 'url' && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LuLink className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => {
                      setCustomUrl(e.target.value);
                      setAvatar(e.target.value);
                    }}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                {customUrl && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                    <img
                      src={customUrl}
                      alt="URL Preview"
                      onError={() => toast.error('Failed to load image from URL')}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-200"
                    />
                    <span className="text-xs text-slate-600 truncate flex-1">{customUrl}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeProfileModal}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {(isSubmitting || isLoading) && <LuLoader className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
