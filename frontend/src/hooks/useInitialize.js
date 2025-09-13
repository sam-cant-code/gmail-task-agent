import { useEffect, useRef } from 'react';
import useAuthStore from '../stores/authStore';
import useEmailStore from '../stores/emailStore';
import useUIStore from '../stores/uiStore';
import useTaskStore from '../stores/taskStore'; // Import task store

const useInitialize = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initialize = async () => {
      useUIStore.getState().initializeTheme();

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        useUIStore.getState().setSuccessMessage('Successfully authenticated with Google!');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('error')) {
        useUIStore.getState().setError('Authentication failed. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const isAuthenticated = await useAuthStore.getState().checkAuthStatus();

      if (isAuthenticated) {
        try {
          // Fetch user profile first
          await useAuthStore.getState().fetchUserProfile();
          
          // Now fetch emails, and if successful, extract tasks
          const emailData = await useEmailStore.getState().fetchEmails();
          if (emailData && emailData.messages.length > 0) {
            // Automatically trigger task extraction
            await useTaskStore.getState().extractTasks(emailData);
          } else {
            useUIStore.getState().setSuccessMessage("Checked your inbox. No new tasks found.");
          }

        } catch (error) {
          useUIStore.getState().setError('Failed to load initial data');
        }
      }
    };

    initialize();
  }, []);
};

export default useInitialize;