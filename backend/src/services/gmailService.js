import { google } from 'googleapis';
import { oauth2Client } from '../config/googleAuth.js';

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

// --- HELPER FUNCTION TO PARSE AND CLEAN THE EMAIL BODY ---
const getEmailBody = (payload) => {
  let body = '';
  
  const decodeBase64 = (data) => Buffer.from(data, 'base64').toString('utf-8');

  const cleanText = (text) => {
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/<http[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const findBestPart = (parts) => {
    let htmlPart = null;
    let textPart = null;

    for (const part of parts) {
      if (part.mimeType === 'text/html') {
        htmlPart = part;
      } else if (part.mimeType === 'text/plain') {
        textPart = part;
      }
      
      if (part.parts) {
        const nested = findBestPart(part.parts);
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
      body = decodeBase64(textPart.body.data);
    }
  } else if (payload.body.data) {
    body = decodeBase64(payload.body.data);
  }
  
  return body;
};


export const getUserProfile = async () => {
  const { data } = await oauth2.userinfo.get();
  return data;
};

export const listMessages = async ({ maxResults = 10, pageToken, q: userQuery }) => {
  // --- GMAIL API QUERY MODIFICATION ---
  // 1. Define the base filters for sender and date.
  const baseFilter = `from:("vitianscdc2026@vitstudent.ac.in") newer_than:1d`;

  // 2. Combine the base filter with any user-provided search query.
  const finalQuery = userQuery ? `${baseFilter} ${userQuery}` : baseFilter;

  const params = {
    userId: 'me',
    maxResults,
    q: finalQuery, // Use the new final query
    ...(pageToken && { pageToken })
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
  
  const body = getEmailBody(data.payload);

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