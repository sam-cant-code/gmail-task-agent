import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import * as gmailController from '../controllers/gmailController.js';
import { query, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get user profile
router.get('/profile', authenticateUser, gmailController.getUserProfile);

// Get emails with pagination
router.get('/messages',
  authenticateUser,
  [
    query('maxResults').optional().isInt({ min: 1, max: 100 }),
    query('pageToken').optional().isString(),
    query('q').optional().isString()
  ],
  validateRequest,
  gmailController.getMessages
);

// Get single email
router.get('/messages/:id',
  authenticateUser,
  gmailController.getMessage
);

// Get labels
router.get('/labels', authenticateUser, gmailController.getLabels);

// Send email
router.post('/send',
  authenticateUser,
  gmailController.sendEmail
);

export default router;  