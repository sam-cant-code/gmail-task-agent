import { create } from 'zustand';
import api from '../services/api';
import useUIStore from './uiStore';

const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  
  extractTasks: async (emailData) => {
    // The emailData can be the full object from the /messages endpoint
    if (!emailData || !emailData.messages || emailData.messages.length === 0) {
      useUIStore.getState().setError('No emails available to process.');
      return;
    }
    
    set({ isLoading: true });
    useUIStore.getState().setGlobalLoading(true);

    try {
      // Send the entire object, the backend will handle it
      const response = await api.post('/groq/extract-tasks', emailData);
      
      const { allTasks, summary } = response.data;

      set({ tasks: allTasks });

      if (summary.totalTasksExtracted > 0) {
        useUIStore.getState().setSuccessMessage(
          `Successfully processed ${summary.successfullyProcessed} emails and extracted ${summary.totalTasksExtracted} tasks.`
        );
      } else {
        useUIStore.getState().setSuccessMessage(
          `Successfully processed ${summary.successfullyProcessed} emails. No actionable tasks were found.`
        );
      }
      
      return allTasks;
    } catch (error) {
      console.error('Failed to extract tasks:', error);
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred.';
      useUIStore.getState().setError(`Failed to extract tasks: ${errorMessage}`);
    } finally {
      set({ isLoading: false });
      useUIStore.getState().setGlobalLoading(false);
    }
  },
  
  clearTasks: () => {
    set({ tasks: [], isLoading: false });
  },
}));

export default useTaskStore;