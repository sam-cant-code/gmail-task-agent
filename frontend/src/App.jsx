import React from 'react';
import useAuthStore from './stores/authStore';
import useUIStore from './stores/uiStore';
import useInitialize from './hooks/useInitialize';
import LoginButton from './components/LoginButton';
import UserProfile from './components/UserProfile';
import ErrorNotification from './components/ErrorNotification';
import TaskList from './components/TaskList';

function App() {
  useInitialize();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Application</h3>
          <p className="text-gray-400">Setting up your Gmail task manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Error Notifications - Always present */}
      <ErrorNotification />
      
      {!isAuthenticated ? (
        // Login View - Full screen
        <LoginButton />
      ) : (
        <>
          {/* Compact Header */}
          <header className="bg-gray-800 shadow-xl border-b border-gray-700 sticky top-0 z-20 backdrop-blur-md bg-gray-800/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex justify-between items-center">
                {/* Logo and Title - More compact */}
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      Gmail Task Manager
                    </h1>
                    <p className="text-xs text-gray-400 hidden sm:block">
                      Transform your inbox into actionable tasks
                    </p>
                  </div>
                </div>

                {/* User Profile */}
                <UserProfile />
              </div>
            </div>
          </header>

          {/* Main Content - Starts immediately after header */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Quick Stats Bar - Compact welcome section */}
            

            {/* Task List - Takes up most of the screen */}
            <TaskList />
          </main>

          {/* Minimal Footer */}
          <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Powered by Gmail API</span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs">
                  <button className="text-gray-400 hover:text-blue-400 transition-colors">
                    Support
                  </button>
                  <span className="text-gray-600">•</span>
                  <button className="text-gray-400 hover:text-blue-400 transition-colors">
                    Privacy
                  </button>
                  <span className="text-gray-600">•</span>
                  <button className="text-gray-400 hover:text-blue-400 transition-colors">
                    Terms
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;