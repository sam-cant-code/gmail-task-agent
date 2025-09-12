import { create } from 'zustand';

const useUIStore = create((set) => ({
  error: null,
  successMessage: null,
  isGlobalLoading: false,
  sidebarOpen: true,
  theme: 'light',
  
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  setSuccessMessage: (message) => {
    set({ successMessage: message });
    // Auto-clear success message after 5 seconds
    setTimeout(() => {
      set({ successMessage: null });
    }, 5000);
  },
  clearSuccessMessage: () => set({ successMessage: null }),
  
  setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
  },
  
  initializeTheme: () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    set({ theme: savedTheme });
  }
}));

export default useUIStore;
