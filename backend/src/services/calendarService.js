import { google } from 'googleapis';
import { oauth2Client } from '../config/googleAuth.js';

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export const createEvent = async (event) => {
  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });
  return data;
};