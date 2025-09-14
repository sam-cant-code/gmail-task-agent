import * as calendarService from '../services/calendarService.js';

// --- NEW: Helper function for deadline "heads-up" event ---
const createDeadlineHeadsUpEvent = (task) => {
  const taskDate = task.dueDate.split('T')[0];
  const deadlineTime = new Date(task.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  return {
    summary: `Reminder: ${task.description}`,
    description: `This is an all-day reminder that the deadline for '${task.description}' is today at ${deadlineTime}.\n\nFrom Email: ${task.emailSubject}`,
    start: { date: taskDate, timeZone: 'Asia/Kolkata' },
    end: { date: taskDate, timeZone: 'Asia/Kolkata' },
    reminders: { useDefault: true }, // Use calendar's default for all-day events
  };
};

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
        const eventEndTime = new Date(task.endDate || task.dueDate);
        if (eventEndTime < new Date()) {
            return res.status(400).json({ error: 'Cannot create an event for a task that is already in the past.' });
        }

        // --- NEW: Logic to handle different task types ---
        if (task.taskType === 'Online Test' && task.startDate) {
            // It's a test window
            const testEvent = {
                summary: `Test Window: ${task.description}`,
                description: `The window to take this test is open during this time.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.startDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: task.endDate, timeZone: 'Asia/Kolkata' },
                reminders: {
                    useDefault: false,
                    overrides: [{ method: 'popup', minutes: 30 }], // 30-min reminder before start
                },
            };
            await calendarService.createEvent(testEvent);

        } else if (task.dueDate) {
            // It's a deadline (Registration, Application, etc.)
            const deadlineTimedEvent = {
                summary: `DEADLINE: ${task.description}`,
                description: `The final deadline for this task.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.dueDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: new Date(new Date(task.dueDate).getTime() + 30 * 60 * 1000).toISOString(), timeZone: 'Asia/Kolkata' },
                reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
            };
            await calendarService.createEvent(deadlineTimedEvent);
            
            // Also create the all-day heads-up event
            const headsUpEvent = createDeadlineHeadsUpEvent(task);
            await calendarService.createEvent(headsUpEvent);
        }

        res.status(201).json({ message: 'Calendar event(s) created successfully' });
    } catch (error) {
        next(error);
    }
};