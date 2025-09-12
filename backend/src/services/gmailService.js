import { google } from 'googleapis';
import { oauth2Client } from '../config/googleAuth.js';

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

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
  
  // Fetch details for each message
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

  // Parse email headers
  const headers = data.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
  const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  
  // Get body
  let body = '';
  if (data.payload.body.data) {
    body = Buffer.from(data.payload.body.data, 'base64').toString('utf-8');
  } else if (data.payload.parts) {
    const textPart = data.payload.parts.find(part => part.mimeType === 'text/plain');
    if (textPart && textPart.body.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  }

  return {
    id: data.id,
    threadId: data.threadId,
    labelIds: data.labelIds,
    snippet: data.snippet,
    subject,
    from,
    date,
    body,
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