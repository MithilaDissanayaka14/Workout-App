import express from 'express';
import { createSchedule, getSchedules, deleteSchedule, updateSchedule } from '../controller/workoutScheduleController.js';

const router = express.Router();

/**
 * Workout Schedule Routes
 * All routes are prefixed with /api/workout-schedules
 */

router.post('/', createSchedule);   // Add a new workout to the schedule
router.get('/', getSchedules);      // Fetch all scheduled workouts
router.put('/:id', updateSchedule); // Update/Reschedule a workout
router.delete('/:id', deleteSchedule); // Remove a workout from the schedule

export default router;
