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

export const createTaskAsEvent = async (req, res, next) => {
    try {
        const task = req.body;
        const hasDate = task.startDate || task.endDate || task.dueDate;

        if (!hasDate) {
            return res.status(400).json({ error: 'Task must have a start, end, or due date to be converted to an event.' });
        }

        // --- NEW STREAMLINED LOGIC ---

        // Case 1: Event with a start and end time (e.g., Test Window)
        if (task.startDate && task.endDate) {
            const eventEndTime = new Date(task.endDate + "+05:30");
            if (eventEndTime < new Date()) {
                return res.status(400).json({ error: 'Cannot create an event for a task that is already in the past.' });
            }
            const event = {
                summary: task.description,
                description: `This is a scheduled event window.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.startDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: task.endDate, timeZone: 'Asia/Kolkata' },
                reminders: {
                    useDefault: false,
                    overrides: [{ method: 'popup', minutes: 60 }], // 60-minute reminder before start
                },
            };
            await calendarService.createEvent(event);

        // Case 2: Deadline (a single point in time)
        } else if (task.dueDate) {
            const eventDueTime = new Date(task.dueDate + "+05:30");
            if (eventDueTime < new Date()) {
                return res.status(400).json({ error: 'Cannot create an event for a task that is already in the past.' });
            }
            // The event starts and ends at the deadline, acting as a marker.
            const event = {
                summary: `DEADLINE: ${task.description}`,
                description: `The final deadline for this task is at this time.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.dueDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: task.dueDate, timeZone: 'Asia/Kolkata' }, // Event ends at the deadline
                reminders: {
                    useDefault: false,
                    overrides: [{ method: 'popup', minutes: 60 }], // 60-minute reminder before deadline
                },
            };
            await calendarService.createEvent(event);

        // Case 3: Event with only a start time (e.g., Pre-placement Talk)
        } else if (task.startDate) {
            const eventStartTime = new Date(task.startDate + "+05:30");
            if (eventStartTime < new Date()) {
                return res.status(400).json({ error: 'Cannot create an event for a task that is already in the past.' });
            }
            // Assume a 1-hour duration
            const eventEndTime = new Date(eventStartTime.getTime() + 60 * 60 * 1000);
            const event = {
                summary: task.description,
                description: `This event was automatically created from an email.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.startDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: eventEndTime.toISOString(), timeZone: 'Asia/Kolkata' },
                reminders: {
                    useDefault: false,
                    overrides: [{ method: 'popup', minutes: 60 }], // 60-minute reminder before start
                },
            };
            await calendarService.createEvent(event);
        } else {
            return res.status(400).json({ error: 'Task format is not suitable for calendar event creation.' });
        }

        res.status(201).json({ message: 'Calendar event(s) created successfully' });
    } catch (error) {
        next(error);
    }
};