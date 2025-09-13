import { Groq } from 'groq-sdk';
import { config } from '../config/config.js';

const groq = new Groq({
  apiKey: config.groq.apiKey,
});

const TASK_EXTRACTION_PROMPT = `
You are an expert AI assistant that extracts actionable tasks from email content. Your primary goal is to identify specific action items and format them into a structured JSON array.

For each distinct task you find, create a JSON object with the following schema:
{
  "description": "string (This is mandatory and must contain the full task description)",
  "dueDate": "string (or null if not specified)",
  "priority": "string ('High', 'Medium', or 'Low', or null)",
  "category": "string ('Work', 'Personal', 'Meeting', 'Follow-up', etc., or null)",
  "assignedTo": "string (person's name or 'Team' if mentioned, otherwise null)"
}

**CRITICAL INSTRUCTIONS:**
1.  The "description" field is the most important. It MUST be a direct and complete summary of the action to be taken. DO NOT leave it empty or null.
2.  Analyze the entire email for deadlines, assignments, and context to determine priority and category.
3.  If no actionable tasks are found, return an empty array: [].

**EXAMPLE:**

---
**Email Content:** "Hi Team, please review the Q3 report by Friday. Also, remember the client meeting is on Monday at 10 AM, and Alex needs to prepare the slides for it."
---
**Expected JSON Output:**
[
  {
    "description": "Review the Q3 report",
    "dueDate": "Friday",
    "priority": "High",
    "category": "Work",
    "assignedTo": "Team"
  },
  {
    "description": "Prepare the slides for the client meeting",
    "dueDate": "Monday at 10 AM",
    "priority": "High",
    "category": "Meeting",
    "assignedTo": "Alex"
  }
]
---

Now, analyze the following email content:
`;

export const processSingleEmail = async (email) => {
  // We only need body, subject, and id from the email object now
  const { body, subject, id } = email;

  if (!body) {
    return { success: false, emailId: id, error: 'Email "body" is missing' };
  }

  try {
    // The 'from' field is no longer included in the content sent to the AI.
    const fullEmailContent = `
Subject: ${subject || 'No Subject'}
Content: ${body}
    `;

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
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 1024,
    });

    let tasks = [];
    const responseText = completion.choices[0]?.message?.content || '[]';
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*?\}\s*\]|\[\s*\]/);
    if (jsonMatch) {
      try {
        tasks = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error(`Error parsing JSON for email ${id}:`, parseError, "Raw Response:", responseText);
        return { success: false, emailId: id, error: 'AI returned invalid JSON' };
      }
    }

    const tasksWithContext = tasks.map(task => ({
      ...task,
      emailId: id,
      emailSubject: subject,
    }));

    return { success: true, emailId: id, tasks: tasksWithContext };
  } catch (error) {
    console.error(`Error processing email ${id}:`, error);
    return { success: false, emailId: id, error: error.message || 'Failed to process with AI model' };
  }
};