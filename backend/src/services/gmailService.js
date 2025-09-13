import { google } from 'googleapis';
import { oauth2Client } from '../config/googleAuth.js';

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

// --- HELPER FUNCTION TO PARSE AND CLEAN THE EMAIL BODY ---
const getEmailBody = (payload) => {
  let body = '';
  
  // Helper to decode base64
  const decodeBase64 = (data) => Buffer.from(data, 'base64').toString('utf-8');

  // Helper to clean text by removing HTML tags and extra whitespace
  const cleanText = (text) => {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Remove links in angle brackets
      .replace(/<http[^>]*>/g, ' ')
      // Replace multiple whitespace characters with a single space
      .replace(/\s+/g, ' ')
      // Trim leading/trailing whitespace
      .trim();
  };
  
  // Recursively search for the best part
  const findBestPart = (parts) => {
    let htmlPart = null;
    let textPart = null;

    for (const part of parts) {
      if (part.mimeType === 'text/html') {
        htmlPart = part;
      } else if (part.mimeType === 'text/plain') {
        textPart = part;
      }
      
      // If the part has nested parts, search within them
      if (part.parts) {
        const nested = findBestPart(part.parts);
        // Prioritize nested parts if found
        htmlPart = nested.htmlPart || htmlPart;
        textPart = nested.textPart || textPart;
      }
    }
    return { htmlPart, textPart };
  };

  if (payload.parts) {
    const { htmlPart, textPart } = findBestPart(payload.parts);
    
    if (htmlPart && htmlPart.body.data) {
      const htmlContent = decodeBase64(htmlPart.body.data);
      body = cleanText(htmlContent);
    } else if (textPart && textPart.body.data) {
      // Fallback to plain text if no HTML part is found
      body = decodeBase64(textPart.body.data);
    }
  } else if (payload.body.data) {
    // For simple emails with no parts
    body = decodeBase64(payload.body.data);
  }
  
  return body;
};


export const getUserProfile = async () => {
  const { data } = await oauth2.userinfo.get();
  return data;
};

export const listMessages = async ({ maxResults = 10, pageToken, q }) => {
  const params = {
    userId: 'me',
    maxResults,
    ...(pageToken && { pageToken }),
    ...(q && { q })
  };

  const { data } = await gmail.users.messages.list(params);
  
  const messages = await Promise.all(
    (data.messages || []).map(async (message) => {
      return await getMessage(message.id);
    })
  );

  return {
    messages,
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate
  };
};

export const getMessage = async (messageId) => {
  const { data } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId
  });

  const headers = data.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
  const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  
  // Use the new function to get a clean body
  const body = getEmailBody(data.payload);

  return {
    id: data.id,
    threadId: data.threadId,
    labelIds: data.labelIds,
    snippet: data.snippet,
    subject,
    from,
    date,
    body, // This body will now be clean
    isUnread: data.labelIds?.includes('UNREAD')
  };
};

export const listLabels = async () => {
  const { data } = await gmail.users.labels.list({
    userId: 'me'
  });
  return data.labels;
};

export const sendEmail = async ({ to, subject, body }) => {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ];
  const message = messageParts.join('\n');
  
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });

  return data;
};