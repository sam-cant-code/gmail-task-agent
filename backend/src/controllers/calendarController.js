import * as calendarService from '../services/calendarService.js';

export const createEvent = async (req, res, next) => {
  try {
    const event = req.body;
    if (!event.summary || !event.start || !event.end) {
      return res.status(400).json({
        error: 'Missing required event fields',
        required: ['summary', 'start', 'end']
      });
    }
    const createdEvent = await calendarService.createEvent(event);
    res.json(createdEvent);
  } catch (error) {
    next(error);
  }
};