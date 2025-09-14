import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import * as calendarController from '../controllers/calendarController.js';

const router = express.Router();

router.post('/events', authenticateUser, calendarController.createEvent);

// --- NEW: Route for manually creating an event from a task ---
router.post('/events/from-task', authenticateUser, calendarController.createTaskAsEvent);


export default router;