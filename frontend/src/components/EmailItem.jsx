import React, { useState } from 'react';

const EmailItem = ({ email }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  return (
    <div
      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
        email.isUnread ? 'bg-blue-50' : ''
      } ${expanded ? 'bg-gray-100' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center mb-1">
        <div
          className={`font-semibold ${
            email.isUnread ? 'text-gray-800' : 'text-gray-600'
          }`}
        >
          {truncateText(email.from, 40)}
        </div>
        <div className="text-sm text-gray-500">{formatDate(email.date)}</div>
      </div>

      <div className="text-gray-800 font-medium">{email.subject}</div>

      <div className="text-gray-600 text-sm">
        {truncateText(email.snippet, 100)}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
            {email.body}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EmailItem;