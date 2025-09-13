import React from 'react';
import useAuthStore from './stores/authStore';
import useUIStore from './stores/uiStore';
import useInitialize from './hooks/useInitialize';
import LoginButton from './components/LoginButton';
import EmailList from './components/EmailList';
import UserProfile from './components/UserProfile';
import ErrorNotification from './components/ErrorNotification';

function App() {
  useInitialize();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const theme = useUIStore((state) => state.theme); // You can integrate this with Tailwind's dark mode later if you wish

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading Gmail Integration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-700">Gmail API Integration</h1>
          {isAuthenticated && <UserProfile />}
        </div>
      </header>

      <main className="container mx-auto p-4">
        <ErrorNotification />
        {!isAuthenticated ? <LoginButton /> : <EmailList />}
      </main>
    </div>
  );
}

export default App;