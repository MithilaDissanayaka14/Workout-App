
// FitManager Backend Server
// Main entry point for the Express API

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from "node:dns";

// Import Route Handlers
import userRouter from './router/userRouter.js';
import workoutPlanRouter from './router/workoutPlanRouter.js';
import workoutScheduleRouter from './router/workoutScheduleRouter.js';
import exerciseRouter from './router/exerciseRouter.js';
import goalRouter from './router/goalRouter.js';
import achievementRouter from './router/achievementRouter.js';
import { protect as auth } from './middleware/authMiddleware.js';
import MealLog from './model/mealLog.js';
import WaterLog from './model/waterLog.js';
import BodyStat from './model/BodyStat.js';
import WorkoutSession from './model/WorkoutSession.js';
import WorkoutTemplate from './model/WorkoutTemplate.js';

// Configuration
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const app = express();

//  Middleware 
app.use(express.json()); // Enable JSON body parsing

// Enable CORS for mobile connectivity (Expo Go)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//  Route Mapping 
app.use('/api/users', userRouter); // User registration & login
app.use('/api/workouts', workoutPlanRouter); // Exercise & workout plan management
app.use('/api/workout-schedules', workoutScheduleRouter); // Scheduler & calendar logic
app.use('/api/exercises', exerciseRouter); // Exercise Library
app.use('/api/goals', goalRouter); // Goals management
app.use('/api/achievements', achievementRouter); // Achievements and rewards

//  DIET & NUTRITION ROUTES 
// These routes handle meal logging and daily nutritional tracking

// Log a meal
app.post('/api/diet/log', auth, async (req, res) => {
    const { items, mealType, calories, carbs, protein, fat, date } = req.body || {};

    if (!items) {
        return res.status(400).json({ error: 'items are required' });
    }

    try {
        const log = new MealLog({
            userId: req.user,
            items: String(items).trim(),
            mealType: mealType || 'Breakfast',
            calories: Number(calories) || 0,
            carbs: Number(carbs) || 0,
            protein: Number(protein) || 0,
            fat: Number(fat) || 0,
            date: date ? new Date(date) : new Date(),
        });

        await log.save();
        res.status(201).json({ log });

    } catch (err) {
        console.error('❌ Save error:', err);
        res.status(500).json({ error: 'Failed to save meal log' });
    }
});

// Fetch meal logs
app.get('/api/diet/log', auth, async (req, res) => {
    const { date } = req.query;

    try {
        let query = { userId: req.user };

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            query.date = { $gte: start, $lte: end };
        }

        const logs = await MealLog.find(query)
            .sort({ date: -1 })
            .limit(200)
            .lean();

        res.json({ logs });

    } catch (err) {
        console.error('❌ Fetch error:', err);
        res.status(500).json({ logs: [] });
    }
});

// Update a meal log
app.put('/api/diet/log/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { items, mealType, calories, carbs, protein, fat, date } = req.body || {};

    try {
        const updated = await MealLog.findOneAndUpdate(
            { _id: id, userId: req.user },
            {
                items: items ? String(items).trim() : undefined,
                mealType,
                calories,
                carbs,
                protein,
                fat,
                date: date ? new Date(date) : undefined
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Log not found' });
        }

        res.json({ log: updated });

    } catch (err) {
        console.error('❌ Update error:', err);
        res.status(500).json({ error: 'Failed to update log' });
    }
});

// Delete a meal log
app.delete('/api/diet/log/:id', auth, async (req, res) => {
    let { id } = req.params;

    if (id) id = id.trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }

    try {
        const deleted = await MealLog.findOneAndDelete({ _id: id, userId: req.user });

        if (!deleted) {
            return res.status(404).json({ error: 'Log not found' });
        }

        res.json({ message: 'Deleted successfully' });

    } catch (err) {
        console.error('❌ Delete error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Aggregate diet statistics for analysis
app.get('/api/diet/stats', auth, async (req, res) => {
    try {
        const stats = await MealLog.aggregate([
            {
                $match: {
                    userId: req.user,
                    date: {
                        $gte: (() => {
                            const d = new Date();
                            d.setDate(d.getDate() - 7);
                            d.setHours(0, 0, 0, 0);
                            return d;
                        })()
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalCalories: { $sum: "$calories" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            stats: stats.map(s => ({
                date: s._id,
                total: s.totalCalories
            }))
        });

    } catch (err) {
        console.error('❌ Stats error:', err);
        res.status(500).json({ stats: [] });
    }
});

//  WATER TRACKING ROUTES 

// Log water intake
app.post('/api/water/log', auth, async (req, res) => {
    const { amount, date } = req.body || {};

    if (!amount) {
        return res.status(400).json({ error: 'amount is required' });
    }

    try {
        const log = new WaterLog({
            userId: req.user,
            amount: Number(amount),
            date: date ? new Date(date) : new Date()
        });

        await log.save();
        res.status(201).json({ log });

    } catch (err) {
        console.error('❌ Water save error:', err);
        res.status(500).json({ error: 'Failed to save water log' });
    }
});

// Fetch water logs
app.get('/api/water/log', auth, async (req, res) => {
    const { date } = req.query;

    try {
        let query = { userId: req.user };

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            query.date = { $gte: start, $lte: end };
        }

        const logs = await WaterLog.find(query).lean();
        const total = logs.reduce((sum, l) => sum + (l.amount || 0), 0);

        res.json({ logs, total });

    } catch (err) {
        console.error('❌ Water fetch error:', err);
        res.status(500).json({ logs: [], total: 0 });
    }
});

// Fetch water statistics (last 7 days)
app.get('/api/water/stats', auth, async (req, res) => {
    try {
        const stats = await WaterLog.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: {
                        $gte: (() => {
                            const d = new Date();
                            d.setDate(d.getDate() - 7);
                            d.setHours(0, 0, 0, 0);
                            return d;
                        })()
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            stats: stats.map(s => ({
                date: s._id,
                total: s.totalAmount
            }))
        });

    } catch (err) {
        console.error('❌ Water stats error:', err);
        res.status(500).json({ stats: [] });
    }
});

// Root Endpoint - Health Check
app.get('/', (req, res) => {
    res.send('🚀 FitManager API is running...');
});

app.post('/api/sync/workouts', auth, async (req, res) => {
  try {
    const { workouts } = req.body;
    // Simple bulk upsert based on workout ID
    for (const workout of workouts) {
      await WorkoutSession.findOneAndUpdate(
        { id: workout.id, userId: req.user },
        { ...workout, userId: req.user },
        { upsert: true, new: true }
      );
    }
    res.send('Workouts synced');
  } catch (err) {
    res.status(500).send('Error syncing workouts');
  }
});

app.get('/api/sync/workouts', auth, async (req, res) => {
  try {
    const workouts = await WorkoutSession.find({ userId: req.user }).sort({ date: -1 });
    res.send(workouts);
  } catch (err) {
    res.status(500).send('Error fetching workouts');
  }
});

// Sync Templates
app.post('/api/sync/templates', auth, async (req, res) => {
  try {
    const { templates } = req.body;
    for (const template of templates) {
      await WorkoutTemplate.findOneAndUpdate(
        { id: template.id, userId: req.user },
        { ...template, userId: req.user },
        { upsert: true, new: true }
      );
    }
    res.send('Templates synced');
  } catch (err) {
    res.status(500).send('Error syncing templates');
  }
});

app.get('/api/sync/templates', auth, async (req, res) => {
  try {
    const templates = await WorkoutTemplate.find({ userId: req.user });
    res.send(templates);
  } catch (err) {
    res.status(500).send('Error fetching templates');
  }
});

// Sync Body Stats
app.post('/api/sync/stats', auth, async (req, res) => {
  try {
    const { stats } = req.body;
    for (const stat of stats) {
            const entryId = stat.entryId || stat.id || stat._id || stat.date;
            const filter = stat.entryId || stat.id || stat._id
                ? { userId: req.user, entryId }
                : { userId: req.user, date: stat.date };
      await BodyStat.findOneAndUpdate(
                filter,
                { ...stat, entryId, userId: req.user },
        { upsert: true, new: true }
      );
    }
    res.send('Stats synced');
  } catch (err) {
    res.status(500).send('Error syncing stats');
  }
});

app.get('/api/sync/stats', auth, async (req, res) => {
  try {
    const stats = await BodyStat.find({ userId: req.user }).sort({ date: -1 });
    res.send(stats);
  } catch (err) {
    res.status(500).send('Error fetching stats');
  }
});

app.delete('/api/sync/stats/:entryId', auth, async (req, res) => {
    try {
        const { entryId } = req.params;
        const deleted = await BodyStat.findOneAndDelete({
            userId: req.user,
            $or: [{ entryId }, ...(mongoose.Types.ObjectId.isValid(entryId) ? [{ _id: entryId }] : [])]
        });

        if (!deleted) {
            return res.status(404).send('Stat not found');
        }

        res.send('Stat deleted');
    } catch (err) {
        res.status(500).send('Error deleting stat');
    }
});

//  DATABASE & SERVER INITIALIZATION 

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");

        // Start listening on all network interfaces (needed for mobile device access)
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
    });