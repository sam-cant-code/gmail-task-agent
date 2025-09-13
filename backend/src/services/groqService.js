import { Groq } from 'groq-sdk';
import { config } from '../config/config.js';
import { createEvent } from './calendarService.js';

const groq = new Groq({
  apiKey: config.groq.apiKey,
});

const MODEL_FALLBACK_LIST = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
];

// --- *** FINAL, HIGHLY-FOCUSED PROMPT *** ---
const TASK_EXTRACTION_PROMPT = `
You are a highly specialized AI assistant for students at VIT. Your purpose is to extract ONLY HIGH-PRIORITY actions and deadlines from emails sent by the Career Development Center (CDC). Your entire focus is on time-sensitive tasks like job applications and interview registrations.

**JSON Schema:**
For each high-priority task, create a JSON object with the following schema.
{
  "description": "string (Full, clear description of the action required)",
  "taskType": "string ('Application', 'Interview', 'Workshop', 'Deadline', or 'Other')",
  "company": "string (Company name if mentioned, otherwise null)",
  "dueDate": "string (The exact deadline or event date, formatted as a local time ISO string 'YYYY-MM-DDTHH:mm:ss')",
  "assignedTo": "string (This should always be 'All Eligible Students')"
}

**CRITICAL INSTRUCTIONS & EXAMPLES:**
1.  **HIGH-PRIORITY FILTER:** You MUST ONLY extract tasks that have a clear, near-term deadline. If an email is informational, about a future event without a current deadline, or a general announcement, IGNORE IT and return an empty array [].
2.  **DEADLINE IS KEY:** A task is only high-priority if a specific due date or registration deadline is mentioned.
3.  **DATE FORMAT (VERY IMPORTANT):** The 'dueDate' field MUST be a string in the local ISO format 'YYYY-MM-DDTHH:mm:ss'. Do NOT include 'Z' or any timezone offsets (e.g., +05:30). The time should be the exact time mentioned in the email.
4.  **STANDARDIZE 'assignedTo':** The "assignedTo" field must ALWAYS be "All Eligible Students".
5.  **IGNORE LOW-PRIORITY INFO:** Do not extract general advice, workshop announcements without registration links, or "for your information" content.

---
**HIGH-QUALITY EXAMPLE:**

**Email Content:** "Dear Students, Greetings! This is to inform you that the registration for the upcoming TCS Placement drive is now open. The role is for a Ninja Developer. All interested and eligible students must register on the portal by 20th September 2025, 11:00 PM. The interview process will be next week. Also, a workshop on resume building will be held in October. Regards, Helpdesk CDC"

**Expected JSON Output (Note the format of dueDate):**
[
  {
    "description": "Register for the TCS Placement drive for the Ninja Developer role on the portal",
    "taskType": "Application",
    "company": "TCS",
    "dueDate": "2025-09-20T23:00:00",
    "assignedTo": "All Eligible Students"
  }
]
---

Now, analyze the following email content from the CDC:
`;


export const processSingleEmail = async (email) => {
  const { body, subject, id } = email;

  if (!body) {
    return { success: false, emailId: id, error: 'Email "body" is missing' };
  }

  const fullEmailContent = `
Subject: ${subject || 'No Subject'}
Content: ${body}
  `;

  let lastError = null;

  for (const model of MODEL_FALLBACK_LIST) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts actionable tasks from emails and returns them in valid JSON format as requested in the user prompt.',
          },
          {
            role: 'user',
            content: TASK_EXTRACTION_PROMPT + fullEmailContent,
          },
        ],
        model: model,
        temperature: 0.1,
        max_tokens: 4096,
      });

      let tasks = [];
      const responseText = completion.choices[0]?.message?.content || '[]';
      const jsonMatch = responseText.match(/\[\s*\{[\s\S]*?\}\s*\]|\[\s*\]/);

      if (jsonMatch) {
        try {
          tasks = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          throw new Error('AI returned invalid JSON');
        }
      }

      for (const task of tasks) {
        if (task.dueDate) {
          const event = {
            summary: task.description,
            description: `Company: ${task.company}\nTask Type: ${task.taskType}`,
            start: {
              dateTime: task.dueDate,
              timeZone: 'Asia/Kolkata',
            },
            end: {
              dateTime: task.dueDate,
              timeZone: 'Asia/Kolkata',
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 10 }, // 10-minute popup notification before the event
                { method: 'email', minutes: 1440 }, // Email reminder 24 hours (1440 minutes) before
              ],
            },
          };
          await createEvent(event);
        }
      }

      const tasksWithContext = tasks.map(task => ({
        ...task,
        emailId: id,
        emailSubject: subject,
      }));

      return { success: true, emailId: id, tasks: tasksWithContext, modelUsed: model };

    } catch (error) {
      lastError = error;
      console.warn(`Error processing email ${id} with model ${model}: ${error.message}. Trying next model...`);
    }
  }

  console.error(`Failed to process email ${id} after trying all fallback models.`);
  return { success: false, emailId: id, error: lastError.message || 'Failed to process with all available AI models' };
};