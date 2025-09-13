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
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Inbox</h2>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">No emails found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Inbox {totalEstimate > 0 && `(${totalEstimate} total)`}
        </h2>
        <div className="flex items-center space-x-2">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
            >
              Search
            </button>
          </form>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {emails.map((email) => (
          <EmailItem key={email.id} email={email} />
        ))}
      </div>

      {nextPageToken && (
        <div className="p-4 text-center">
          <button
            onClick={loadMore}
            className="w-full px-6 py-3 bg-white border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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