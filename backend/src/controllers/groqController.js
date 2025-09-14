import { processSingleEmail } from '../services/groqService.js';
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
    reminders: { useDefault: true },
  };
};

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
        const eventEndTime = new Date(task.endDate || task.dueDate);
        if (eventEndTime < new Date()) continue;

        // --- NEW: Logic to handle different task types for auto-add ---
        if (task.taskType === 'Online Test' && task.startDate) {
            const testEvent = {
                summary: `Test Window: ${task.description}`,
                description: `The window to take this test is open during this time.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.startDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: task.endDate, timeZone: 'Asia/Kolkata' },
                reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
            };
            await calendarService.createEvent(testEvent);

        } else if (task.dueDate) {
            const deadlineTimedEvent = {
                summary: `DEADLINE: ${task.description}`,
                description: `The final deadline for this task.\n\nFrom Email: ${task.emailSubject}`,
                start: { dateTime: task.dueDate, timeZone: 'Asia/Kolkata' },
                end: { dateTime: new Date(new Date(task.dueDate).getTime() + 30 * 60 * 1000).toISOString(), timeZone: 'Asia/Kolkata' },
                reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
            };
            await calendarService.createEvent(deadlineTimedEvent);
            
            const headsUpEvent = createDeadlineHeadsUpEvent(task);
            await calendarService.createEvent(headsUpEvent);
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