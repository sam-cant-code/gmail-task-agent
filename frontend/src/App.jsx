import React from 'react';
import useAuthStore from './stores/authStore';
import useUIStore from './stores/uiStore';
import useInitialize from './hooks/useInitialize';
import LoginButton from './components/LoginButton';
import EmailList from './components/EmailList';
import UserProfile from './components/UserProfile';
import ErrorNotification from './components/ErrorNotification';
import './App.css';

function App() {
  useInitialize(); // Centralized initialization

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const theme = useUIStore((state) => state.theme);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading Gmail Integration...</p>
      </div>
    );
  }

  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <h1>Gmail API Integration</h1>
        {isAuthenticated && <UserProfile />}
      </header>

      <main className="app-main">
        <ErrorNotification />

        {!isAuthenticated ? <LoginButton /> : <EmailList />}
      </main>
    </div>
  );
}

export default App;