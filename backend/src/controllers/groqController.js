import { processSingleEmail } from '../services/groqService.js';

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

    // --- SEQUENTIAL PROCESSING TO RESPECT RATE LIMITS ---
    const results = [];
    for (const email of emails) {
      // Process emails one by one
      const result = await processSingleEmail(email);
      results.push(result);
    }
    
    let allTasks = [];
    let successfullyProcessed = 0;
    results.forEach(result => {
      if (result.success) {
        successfullyProcessed++;
        if (result.tasks) {
          allTasks = allTasks.concat(result.tasks);
        }
      }
    });

    const errors = results.length - successfullyProcessed;

    res.json({
      success: true,
      results,
      allTasks,
      summary: {
        totalEmails: emails.length,
        successfullyProcessed,
        errors,
        totalTasksExtracted: allTasks.length,
      },
    });
  } catch (error) {
    next(error);
  }
};