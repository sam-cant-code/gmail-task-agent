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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading Application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-700">Gmail Task Extractor</h1>
          {isAuthenticated && <UserProfile />}
        </div>
      </header>

      <main className="container mx-auto p-4">
        <ErrorNotification />
        {!isAuthenticated ? (
          <LoginButton />
        ) : (
          // The main view is now the TaskList
          <TaskList />
        )}
      </main>
    </div>
  );
}

export default App;