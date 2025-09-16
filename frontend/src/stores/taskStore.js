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
    if (task.isCreating || task.created) return;

    set(state => ({
      tasks: state.tasks.map(t =>
        t.emailId === task.emailId && t.description === task.description
          ? { ...t, isCreating: true }
          : t
      )
    }));

    try {
      await api.post('/calendar/events/from-task', task);
      
      set(state => ({
        tasks: state.tasks.map(t => 
          t.emailId === task.emailId && t.description === task.description 
            ? { ...t, created: true, isCreating: false } 
            : t
        )
      }));

      useUIStore.getState().setSuccessMessage('Task successfully added to your calendar!');
    } catch (error) {
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

  // --- NEW FUNCTION TO INSTANTLY ADD ALL TASKS ---
  addAllTasksToCalendar: async () => {
    const tasksToAdd = get().tasks.filter(task => !task.created && !task.isCreating);
    if (tasksToAdd.length === 0) return;

    // Set all applicable tasks to 'isCreating' for instant UI feedback
    set(state => ({
      tasks: state.tasks.map(t => 
        tasksToAdd.some(tta => tta.emailId === t.emailId && tta.description === tta.description) 
        ? { ...t, isCreating: true } : t
      )
    }));
    
    useUIStore.getState().setSuccessMessage(`Adding ${tasksToAdd.length} tasks to your calendar...`);

    // Send all API requests in parallel for speed
    const results = await Promise.allSettled(
      tasksToAdd.map(task => api.post('/calendar/events/from-task', task))
    );

    let successCount = 0;
    
    // Update the state based on the results of the API calls
    set(state => ({
      tasks: state.tasks.map(t => {
        const taskIndex = tasksToAdd.findIndex(tta => tta.emailId === t.emailId && tta.description === t.description);
        if (taskIndex !== -1) {
          if (results[taskIndex].status === 'fulfilled') {
            successCount++;
            return { ...t, created: true, isCreating: false };
          }
          // If failed, just reset the loading state for that task
          return { ...t, isCreating: false };
        }
        return t;
      })
    }));

    if (successCount > 0) {
      useUIStore.getState().setSuccessMessage(`Successfully added ${successCount} of ${tasksToAdd.length} tasks!`);
    } else {
       useUIStore.getState().setError('Could not add tasks to calendar.');
    }
  },

  clearTasks: () => {
    set({ tasks: [], isLoading: false });
  },
}));

export default useTaskStore;