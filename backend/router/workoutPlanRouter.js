import express from 'express';
import WorkoutPlan from '../model/workoutPlan.js';
import { protect as auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// CREATE
router.post('/', auth, async (req, res) => {
    try {
        const { planName, goal, durationWeeks, daysPerWeek, exercises } = req.body;
        
        if (!planName || !goal || !durationWeeks || !daysPerWeek) {
            return res.status(400).json({ error: 'Missing required plan details' });
        }
        if (!exercises || exercises.length === 0) {
            return res.status(400).json({ error: 'At least one exercise is required' });
        }

        const newPlan = new WorkoutPlan({
            userId: req.user,
            planName,
            goal,
            durationWeeks: Number(durationWeeks),
            daysPerWeek: Number(daysPerWeek),
            exercises: exercises.map(ex => ({
                day: String(ex.day),
                exerciseName: ex.exerciseName,
                sets: Number(ex.sets),
                repsOrDuration: ex.repsOrDuration
            }))
        });

        await newPlan.save();
        res.status(201).json({ plan: newPlan });
    } catch (error) {
        console.error('❌ WorkoutPlan Create Error:', error);
        res.status(500).json({ error: 'Failed to create workout plan' });
    }
});

// READ ALL
router.get('/', auth, async (req, res) => {
    try {
        const plans = await WorkoutPlan.find({ userId: req.user }).sort({ createdAt: -1 }).lean();
        res.json({ plans });
    } catch (error) {
        console.error('❌ WorkoutPlan Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch workout plans' });
    }
});

// READ ONE
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await WorkoutPlan.findOne({ _id: id, userId: req.user }).lean();
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        res.json({ plan });
    } catch (error) {
        console.error('❌ WorkoutPlan Fetch One Error:', error);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
});

// UPDATE
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { planName, goal, durationWeeks, daysPerWeek, exercises } = req.body;

        const updated = await WorkoutPlan.findOneAndUpdate(
            { _id: id, userId: req.user },
            {
                planName,
                goal,
                durationWeeks: Number(durationWeeks),
                daysPerWeek: Number(daysPerWeek),
                exercises: exercises ? exercises.map(ex => ({
                    day: String(ex.day),
                    exerciseName: ex.exerciseName,
                    sets: Number(ex.sets),
                    repsOrDuration: ex.repsOrDuration
                })) : []
            },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'Plan not found' });
        res.json({ plan: updated });
    } catch (error) {
        console.error('❌ WorkoutPlan Update Error:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await WorkoutPlan.findOneAndDelete({ _id: id, userId: req.user });
        
        if (!deleted) return res.status(404).json({ error: 'Plan not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('❌ WorkoutPlan Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete plan' });
    }
});

export default router;
