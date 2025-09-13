import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { extractTasks } from '../controllers/groqController.js';

const router = express.Router();

router.post('/extract-tasks', authenticateUser, extractTasks);

export default router;