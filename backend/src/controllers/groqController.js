import { processSingleEmail } from '../services/groqService.js';
import * as calendarService from '../services/calendarService.js';

const getTaskScore = (task) => {
  let score = 0;
  if (task.startDate && task.endDate) score += 10; // Highest score for a time window
  if (task.dueDate && !task.dueDate.endsWith('T00:00:00')) score += 5; // Medium score for a specific time
  if (task.isActionable) score += 2; // Bonus for being actionable
  return score;
};

const consolidateTasks = (tasks) => {
  const taskGroups = new Map();

  // Group tasks by a key: a simplified company name + task type + date.
  tasks.forEach(task => {
    const date = (task.startDate || task.dueDate || '').split('T')[0];
    if (!date) return; // Skip tasks with no date

    const simpleCompany = (task.company || 'general').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${simpleCompany}-${task.taskType}-${date}`;

    if (!taskGroups.has(key)) {
      taskGroups.set(key, []);
    }
    taskGroups.get(key).push(task);
  });

  const finalTasks = [];
  // Iterate through the groups to find the "best" task in each.
  for (const group of taskGroups.values()) {
    if (group.length === 1) {
      finalTasks.push(group[0]);
      continue;
    }

    // Sort tasks in the group by their score, descending. The best task is at index 0.
    const sortedGroup = group.sort((a, b) => getTaskScore(b) - getTaskScore(a));
    finalTasks.push(sortedGroup[0]);
  }
  return finalTasks;
};


export const extractTasks = async (req, res, next) => {
  try {
    let emails = req.body;

    if (req.body && !Array.isArray(req.body) && Array.isArray(req.body.messages)) {
      emails = req.body.messages;
    } else if (!Array.isArray(emails)) {
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

    for (const task of finalTasks) {
      // --- FIX: Ensure start and end times are always valid ---
      const startTime = task.startDate || task.dueDate;
      const endTime = task.endDate || startTime; // Fallback to startTime if endDate is null

      // Skip creating an event if there's no valid time
      if (!startTime) continue;

      const event = {
        summary: task.description,
        description: `Company: ${task.company}\nTask Type: ${task.taskType}\nFrom Email: ${task.emailSubject}`,
        start: {
          dateTime: startTime,
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endTime,
          timeZone: 'Asia/Kolkata',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'email', minutes: 1440 },
          ],
        },
      };
      await calendarService.createEvent(event);
    }

    const errors = results.length - successfullyProcessed;

    res.json({
      success: true,
      allTasks: finalTasks, // Keep this name for frontend compatibility
      summary: {
        totalEmails: emails.length,
        successfullyProcessed,
        errors,
        totalTasksExtracted: allExtractedTasks.length,
        totalTasksCreated: finalTasks.length,
      },
    });
  } catch (error) {
    next(error);
  }
};