import { create } from 'zustand';
import api from '../services/api';
import { clearEmails } from './emailStore';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  
  checkAuthStatus: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/status');
      set({ 
        isAuthenticated: response.data.isAuthenticated,
        user: response.data.user 
      });
      return response.data.isAuthenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ isAuthenticated: false, user: null });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchUserProfile: async () => {
    try {
      const response = await api.get('/gmail/profile');
      set({ user: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  },
  
  login: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ isAuthenticated: false, user: null });
      clearEmails();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },
  
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setUser: (user) => set({ user })
}));

export default useAuthStore;