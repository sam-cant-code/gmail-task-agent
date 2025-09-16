import { create } from 'zustand';

const useUIStore = create((set) => ({
  error: null,
  successMessage: null,
  isGlobalLoading: false,
  sidebarOpen: true,
  theme: 'light',
  autoAddTask: false, // State for the auto-add toggle
  
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  setSuccessMessage: (message) => {
    set({ successMessage: message });
    setTimeout(() => {
      set({ successMessage: null });
    }, 5000);
  },
  clearSuccessMessage: () => set({ successMessage: null }),
  
  setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // --- MODIFIED: Action to toggle autoAddTask with a console log for testing ---
  toggleAutoAddTask: () => set(state => {
    const newState = !state.autoAddTask;
    // This will print the new state to the browser console every time you click
    console.log(`Auto Add Task state is now: ${newState}`); 
    return { autoAddTask: newState };
  }),
  
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