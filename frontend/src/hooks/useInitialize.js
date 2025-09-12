import { useEffect, useRef } from 'react';
import useAuthStore from '../stores/authStore';
import useEmailStore from '../stores/emailStore';
import useUIStore from '../stores/uiStore';

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
          await Promise.all([
            useAuthStore.getState().fetchUserProfile(),
            useEmailStore.getState().fetchEmails(),
            useEmailStore.getState().fetchLabels()
          ]);
        } catch (error) {
          useUIStore.getState().setError('Failed to load initial data');
        }
      }
    };

    initialize();
  }, []);
};

export default useInitialize;