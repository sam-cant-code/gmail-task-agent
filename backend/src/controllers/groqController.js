import { processSingleEmail } from '../services/groqService.js';

export const extractTasks = async (req, res, next) => {
  try {
    let emails = req.body;

    // Check if the body is an object containing a 'messages' array
    if (req.body && !Array.isArray(req.body) && Array.isArray(req.body.messages)) {
      emails = req.body.messages;
    } else if (!Array.isArray(emails)) {
      // If it's still not an array, then it's an invalid format
      return res.status(400).json({ 
        success: false, 
        error: 'Request body must be an array of email objects or an object containing a "messages" array.' 
      });
    }

    const processingPromises = emails.map(processSingleEmail);
    const results = await Promise.all(processingPromises);

    let allTasks = [];
    results.forEach(result => {
      if (result.success && result.tasks) {
        allTasks = allTasks.concat(result.tasks);
      }
    });

    const successfullyProcessed = results.filter(r => r.success).length;
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