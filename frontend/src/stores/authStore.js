import { create } from 'zustand';
import { api } from '../lib/api';

const TOKEN_KEY = 'qa_control_center_token';
const USER_KEY = 'qa_control_center_user';

const getInitialUser = () => {
  try {
    const item = localStorage.getItem(USER_KEY);
    if (!item || item === 'undefined') return null;
    return JSON.parse(item);
  } catch (e) {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  token: localStorage.getItem(TOKEN_KEY) || null,
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  isLoginModalOpen: false,
  isProfileModalOpen: false,
  authMode: 'login', // 'login' | 'register'
  authError: null,

  openLoginModal: (mode = 'login') => set({ isLoginModalOpen: true, authMode: mode, authError: null }),
  closeLoginModal: () => set({ isLoginModalOpen: false, authError: null }),
  openProfileModal: () => set({ isProfileModalOpen: true, authError: null }),
  closeProfileModal: () => set({ isProfileModalOpen: false }),
  setAuthMode: (mode) => set({ authMode: mode, authError: null }),
  clearError: () => set({ authError: null }),


  login: async (email, password) => {
    set({ isLoading: true, authError: null });
    try {
      const response = await api.login({ email, password });
      const payload = response.data || response;
      const token = payload.token || response.token;
      const user = payload.user || response.user;

      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        isLoginModalOpen: false,
        authError: null
      });

      return user;
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, authError: errorMsg });
      throw err;
    }
  },

  createUserByAdmin: async (userData) => {
    const token = get().token;
    if (!token) throw new Error('Authentication token missing');
    const response = await api.register(userData, token);
    const payload = response.data || response;
    return payload.user || response.user;
  },

  register: async (formData) => {
    set({ isLoading: true, authError: null });
    try {
      const response = await api.register(formData, get().token);
      const payload = response.data || response;
      const token = payload.token || response.token;
      const user = payload.user || response.user;

      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        isLoginModalOpen: false,
        authError: null
      });

      return user;
    } catch (err) {
      const errorMsg = err.message || 'Registration failed. Please try again.';
      set({ isLoading: false, authError: errorMsg });
      throw err;
    }
  },

  updateProfile: async (profileData) => {
    const token = get().token;
    if (!token) throw new Error('Authentication token missing');
    set({ isLoading: true, authError: null });
    try {
      const response = await api.updateProfile(profileData, token);
      const payload = response.data || response;
      const updatedUser = payload.user || response.user || payload;
      if (updatedUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false, isProfileModalOpen: false });
      }
      return updatedUser;
    } catch (err) {
      const errorMsg = err.message || 'Failed to update profile';
      set({ isLoading: false, authError: errorMsg });
      throw err;
    }
  },

  logout: () => {

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoginModalOpen: false,
      authError: null
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }

    try {
      const response = await api.getMe(token);
      const payload = response.data || response;
      const user = payload.user || response.user || payload;
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      get().logout();
    }
  }
}));

export default useAuthStore;
