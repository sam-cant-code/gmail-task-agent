import { processSingleEmail } from '../services/groqService.js';
import * as calendarService from '../services/calendarService.js';

const getTaskScore = (task) => {
  let score = 0;
  if (task.startDate && task.endDate) score += 10;
  if (task.dueDate && !task.dueDate.endsWith('T00:00:00')) score += 5;
  if (task.isActionable) score += 2;
  return score;
};

const consolidateTasks = (tasks) => {
  const taskGroups = new Map();
  tasks.forEach(task => {
    const date = (task.startDate || task.dueDate || '').split('T')[0];
    if (!date) return;
    const simpleCompany = (task.company || 'general').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${simpleCompany}-${task.taskType}-${date}`;
    if (!taskGroups.has(key)) {
      taskGroups.set(key, []);
    }
    taskGroups.get(key).push(task);
  });
  const finalTasks = [];
  for (const group of taskGroups.values()) {
    if (group.length === 1) {
      finalTasks.push(group[0]);
    } else {
      const sortedGroup = group.sort((a, b) => getTaskScore(b) - getTaskScore(a));
      finalTasks.push(sortedGroup[0]);
    }
  }
  return finalTasks;
};

export const extractTasks = async (req, res, next) => {
  try {
    const { autoAddTask, emails: emailData } = req.body;
    let emails = emailData;
    if (!emails) {
      if (req.body && !Array.isArray(req.body) && Array.isArray(req.body.messages)) {
        emails = req.body.messages;
      } else if (Array.isArray(req.body)) {
        emails = req.body;
      }
    }
    if (!Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        error: 'Request body must be an array of email objects or an object containing a "messages" array.'
      });
    }
    const results = [];
    for (const email of emails) {
      const result = await processSingleEmail(email);
      results.push(result);
    }
    let allExtractedTasks = [];
    let successfullyProcessed = 0;
    results.forEach(result => {
      if (result.success) {
        successfullyProcessed++;
        if (result.tasks) {
          allExtractedTasks = allExtractedTasks.concat(result.tasks);
        }
      }
    });
    const finalTasks = consolidateTasks(allExtractedTasks);
    
    if (autoAddTask) {
      for (const task of finalTasks) {
        const hasDate = task.startDate || task.endDate || task.dueDate;
        if (!hasDate) continue;

        // --- NEW STREAMLINED LOGIC ---

        // Case 1: Event with a start and end time
        if (task.startDate && task.endDate) {
            const eventEndTime = new Date(task.endDate + "+05:30");
            if (eventEndTime < new Date()) continue;
            const event = {
                summary: task.description,
                description: `This is a scheduled event window.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.startDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: task.endDate, timeZone: 'Asia/Kolkata' },
                reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
            };
            await calendarService.createEvent(event);

        // Case 2: Deadline
        } else if (task.dueDate) {
            const eventDueTime = new Date(task.dueDate + "+05:30");
            if (eventDueTime < new Date()) continue;
            const event = {
                summary: `DEADLINE: ${task.description}`,
                description: `The final deadline for this task is at this time.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.dueDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: task.dueDate, timeZone: 'Asia/Kolkata' },
                reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
            };
            await calendarService.createEvent(event);
        
        // Case 3: Event with only a start time
        } else if (task.startDate) {
            const eventStartTime = new Date(task.startDate + "+05:30");
            if (eventStartTime < new Date()) continue;
            const eventEndTime = new Date(eventStartTime.getTime() + 60 * 60 * 1000);
            const event = {
                summary: task.description,
                description: `This event was automatically created from an email.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.startDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: eventEndTime.toISOString(), timeZone: 'Asia/Kolkata' },
                reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
            };
            await calendarService.createEvent(event);
        }
      }
    }
    const errors = results.length - successfullyProcessed;
    res.json({
      success: true,
      allTasks: finalTasks,
      summary: {
        totalEmails: emails.length,
        successfullyProcessed,
        errors,
        totalTasksExtracted: allExtractedTasks.length,
        totalTasksCreated: autoAddTask ? finalTasks.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};