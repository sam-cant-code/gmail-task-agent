import React, { useEffect } from 'react';
import useUIStore from '../stores/uiStore';

const ErrorNotification = () => {
  const { error, successMessage, clearError, clearSuccessMessage } =
    useUIStore();

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
        <div className="fixed top-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between z-50">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}
      {successMessage && (
        <div className="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between z-50">
          <span>{successMessage}</span>
          <button
            onClick={clearSuccessMessage}
            className="ml-4 text-green-500 hover:text-green-700"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
};

export default ErrorNotification;