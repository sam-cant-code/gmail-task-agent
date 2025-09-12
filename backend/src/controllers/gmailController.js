import * as gmailService from '../services/gmailService.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const profile = await gmailService.getUserProfile();
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { maxResults = 10, pageToken, q } = req.query;
    const messages = await gmailService.listMessages({
      maxResults: parseInt(maxResults),
      pageToken,
      q
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const getMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await gmailService.getMessage(id);
    res.json(message);
  } catch (error) {
    next(error);
  }
};

export const getLabels = async (req, res, next) => {
  try {
    const labels = await gmailService.listLabels();
    res.json(labels);
  } catch (error) {
    next(error);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['to', 'subject', 'body']
      });
    }

    const result = await gmailService.sendEmail({ to, subject, body });
    res.json(result);
  } catch (error) {
    next(error);
  }
};