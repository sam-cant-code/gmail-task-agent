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
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
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
      className={`email-item ${email.isUnread ? 'unread' : ''} ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="email-item-header">
        <div className="email-from">
          {truncateText(email.from, 40)}
        </div>
        <div className="email-date">
          {formatDate(email.date)}
        </div>
      </div>
      
      <div className="email-subject">
        {email.subject}
      </div>
      
      <div className="email-snippet">
        {truncateText(email.snippet, 100)}
      </div>
      
      {expanded && (
        <div className="email-body">
          <hr />
          <pre>{email.body}</pre>
        </div>
      )}
    </div>
  );
};

export default EmailItem;