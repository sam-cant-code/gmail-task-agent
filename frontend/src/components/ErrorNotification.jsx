import React, { useEffect } from 'react';
import useUIStore from '../stores/uiStore';

const ErrorNotification = () => {
  const { error, successMessage, clearError, clearSuccessMessage } = useUIStore();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error && !successMessage) return null;

  return (
    <>
      {error && (
        <div className="notification error-notification">
          <span>{error}</span>
          <button onClick={clearError} className="close-btn">×</button>
        </div>
      )}
      {successMessage && (
        <div className="notification success-notification">
          <span>{successMessage}</span>
          <button onClick={clearSuccessMessage} className="close-btn">×</button>
        </div>
      )}
    </>
  );
};

export default ErrorNotification;