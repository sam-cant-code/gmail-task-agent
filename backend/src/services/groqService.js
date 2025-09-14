import { Groq } from 'groq-sdk';
import { config } from '../config/config.js';
import { getTaskExtractionPrompt } from '../prompts/taskExtractorPrompt.js'; // --- MODIFIED: Import the prompt ---

const groq = new Groq({
  apiKey: config.groq.apiKey,
});

const MODEL_FALLBACK_LIST = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
];

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

  // --- MODIFIED: Get the current year and generate the prompt from the imported function ---
  const currentYear = new Date().getFullYear();
  const TASK_EXTRACTION_PROMPT = getTaskExtractionPrompt(currentYear);

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
        temperature: 0,
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