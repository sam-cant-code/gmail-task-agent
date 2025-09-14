import { create } from 'zustand';
import api from '../services/api';
import useUIStore from './uiStore';

const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  
  extractTasks: async (emailData, autoAddTask) => { 
    if (!emailData || !emailData.messages || emailData.messages.length === 0) {
      useUIStore.getState().setError('No emails available to process.');
      return;
    }
    
    set({ isLoading: true });
    useUIStore.getState().setGlobalLoading(true);

    try {
      const response = await api.post('/groq/extract-tasks', {
        emails: emailData.messages,
        autoAddTask: autoAddTask
      });
      
      const { allTasks, summary } = response.data;

      // --- NEW: Add created and isCreating fields to each task ---
      const tasksWithStatus = allTasks.map(task => ({ 
        ...task, 
        created: autoAddTask,
        isCreating: false 
      }));
      set({ tasks: tasksWithStatus });

      if (summary.totalTasksCreated > 0) {
        useUIStore.getState().setSuccessMessage(
          `Successfully added ${summary.totalTasksCreated} task(s) to your calendar.`
        );
      } else if (summary.totalTasksExtracted > 0) {
        useUIStore.getState().setSuccessMessage(
          `Successfully processed ${summary.successfullyProcessed} emails and extracted ${summary.totalTasksExtracted} task(s).`
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
  
  addTaskToCalendar: async (task) => {
    // --- NEW: Prevent multiple clicks ---
    if (task.isCreating || task.created) return;

    // --- NEW: Set isCreating to true immediately ---
    set(state => ({
      tasks: state.tasks.map(t =>
        t.emailId === task.emailId && t.description === task.description
          ? { ...t, isCreating: true }
          : t
      )
    }));

    try {
      await api.post('/calendar/events/from-task', task);
      
      // Update the task's state to reflect that it's been added
      set(state => ({
        tasks: state.tasks.map(t => 
          t.emailId === task.emailId && t.description === task.description 
            ? { ...t, created: true, isCreating: false } 
            : t
        )
      }));

      useUIStore.getState().setSuccessMessage('Task successfully added to your calendar!');
    } catch (error) {
      // --- NEW: Reset isCreating on error ---
      set(state => ({
        tasks: state.tasks.map(t =>
          t.emailId === task.emailId && t.description === task.description
            ? { ...t, isCreating: false }
            : t
        )
      }));
      console.error('Failed to add task to calendar:', error);
      const errorMessage = error.response?.data?.error || 'Could not add task to calendar.';
      useUIStore.getState().setError(errorMessage);
    }
  },

  clearTasks: () => {
    set({ tasks: [], isLoading: false });
  },
}));

export default useTaskStore;