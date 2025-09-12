import React, { useState } from 'react';
import useEmailStore from '../stores/emailStore';
import EmailItem from './EmailItem';

const EmailList = () => {
  const [searchInput, setSearchInput] = useState('');
  
  // ✅ Correctly select individual state slices to prevent re-render loops
  const emails = useEmailStore((state) => state.emails);
  const isLoading = useEmailStore((state) => state.isLoading);
  const nextPageToken = useEmailStore((state) => state.nextPageToken);
  const totalEstimate = useEmailStore((state) => state.totalEstimate);
  const refresh = useEmailStore((state) => state.refresh);
  const loadMore = useEmailStore((state) => state.loadMore);
  const search = useEmailStore((state) => state.search);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      search(searchInput);
    }
  };

  const handleRefresh = () => {
    setSearchInput('');
    refresh();
  };

  if (!emails || emails.length === 0) {
    return (
      <div className="email-list-container">
        <div className="email-list-header">
          <h2>Inbox</h2>
          <button onClick={handleRefresh} className="refresh-btn" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="email-list-empty">
          <p>No emails found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-list-container">
      <div className="email-list-header">
        <h2>Inbox {totalEstimate > 0 && `(${totalEstimate} total)`}</h2>
        <div className="email-list-actions">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
          <button onClick={handleRefresh} className="refresh-btn" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="email-items">
        {emails.map(email => (
          <EmailItem key={email.id} email={email} />
        ))}
      </div>
      
      {nextPageToken && (
        <div className="load-more-container">
          <button 
            onClick={loadMore} 
            className="load-more-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailList;