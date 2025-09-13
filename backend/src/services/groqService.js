import { Groq } from 'groq-sdk';
import { config } from '../config/config.js';

const groq = new Groq({
  apiKey: config.groq.apiKey,
});

const MODEL_FALLBACK_LIST = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
];

// --- *** NEW, SMARTER PROMPT *** ---
const TASK_EXTRACTION_PROMPT = `
You are a hyper-intelligent AI assistant for VIT students, specializing in extracting and structuring actionable tasks from CDC emails. Your goal is to identify specific, time-bound events and ignore vague announcements.

**JSON Schema:**
For each high-priority task, create a JSON object with the following schema.
{
  "description": "string (A concise, action-oriented summary of the task. E.g., 'Apply for the Systems Engineer role')",
  "taskType": "string ('Application', 'Interview', 'Online Test', 'Workshop', 'Deadline', or 'Other')",
  "company": "string (Company name if mentioned, otherwise null)",
  "startDate": "string (The start time of an event in 'YYYY-MM-DDTHH:mm:ss' format. Use this for time windows.)",
  "endDate": "string (The end time of an event in 'YYYY-MM-DDTHH:mm:ss' format. Use this for time windows.)",
  "dueDate": "string (A single point in time deadline in 'YYYY-MM-DDTHH:mm:ss' format. Use this if there is no window.)",
  "isActionable": "boolean (true if the task requires a direct action like applying or registering, otherwise false)"
}

**CRITICAL INSTRUCTIONS & EXAMPLES:**
1.  **TIME WINDOW vs. DEADLINE:**
    * If an email mentions a time range (e.g., "test is available from 9 am to 10 pm"), you MUST populate **both** 'startDate' and 'endDate'. 'dueDate' should be null.
    * If an email mentions a single deadline (e.g., "apply by 11:00 PM"), you MUST populate 'dueDate'. 'startDate' and 'endDate' should be null.
    * If only a date is mentioned with no time, use 'dueDate' and set the time to T00:00:00.

2.  **ACTIONABILITY:**
    * Set 'isActionable' to **true** for tasks like "Register for...", "Apply on...", "Take the online test...".
    * Set 'isActionable' to **false** for general announcements like "The results for X will be declared on..." or "The placement drive is scheduled on...".

3.  **CONCISE DESCRIPTION:** Keep the 'description' field short and to the point. Focus on the core action.

---
**HIGH-QUALITY EXAMPLES:**

**Email 1:** "Take the Tata Technologies online test between 9 am to 10 pm on 13th September 2025."
**Expected JSON Output 1:**
[
  {
    "description": "Take the Tata Technologies online test",
    "taskType": "Online Test",
    "company": "Tata Technologies",
    "startDate": "2025-09-13T09:00:00",
    "endDate": "2025-09-13T22:00:00",
    "dueDate": null,
    "isActionable": true
  }
]

**Email 2:** "Register for the Infosys Dream Core Placement on the Neo portal by Sept 15th, 2025."
**Expected JSON Output 2:**
[
  {
    "description": "Register for the Infosys Dream Core Placement on the Neo portal",
    "taskType": "Application",
    "company": "Infosys",
    "startDate": null,
    "endDate": null,
    "dueDate": "2025-09-15T00:00:00",
    "isActionable": true
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