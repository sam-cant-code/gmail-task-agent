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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        clearSuccessMessage();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, clearSuccessMessage]);

  if (!error && !successMessage) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-3">
      {error && (
        <div className="animate-slide-in-right bg-gray-800/80 backdrop-blur-md border border-red-500/30 rounded-xl shadow-2xl p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-white">An Error Occurred</h3>
              <p className="text-sm text-gray-300 mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-4 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="animate-slide-in-right bg-gray-800/80 backdrop-blur-md border border-green-500/30 rounded-xl shadow-2xl p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-white">Success</h3>
              <p className="text-sm text-gray-300 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={clearSuccessMessage}
              className="ml-4 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorNotification;