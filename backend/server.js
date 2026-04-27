import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from "node:dns";

import userRouter from './router/userRouter.js';
import MealLog from './model/mealLog.js';
import WaterLog from './model/waterLog.js';

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ CORS (important for Expo Go)
app.use(cors({
    origin: '*', // allow all (OK for dev)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

//routers
app.use('/api/users', userRouter);



// ==================== DIET ROUTES ====================

// CREATE
app.post('/api/diet/log', async (req, res) => {
    const { items, mealType, calories, carbs, protein, fat, date } = req.body || {};

    if (!items) {
        return res.status(400).json({ error: 'items are required' });
    }

    try {
        const log = new MealLog({
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


// READ
app.get('/api/diet/log', async (req, res) => {
    const { date } = req.query;

    try {
        let query = {};

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


// UPDATE
app.put('/api/diet/log/:id', async (req, res) => {
    const { id } = req.params;
    const { items, mealType, calories, carbs, protein, fat, date } = req.body || {};

    try {
        const updated = await MealLog.findByIdAndUpdate(
            id,
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


// DELETE
app.delete('/api/diet/log/:id', async (req, res) => {
    let { id } = req.params;

    if (id) id = id.trim();

    console.log(`🗑 DELETE ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }

    try {
        const deleted = await MealLog.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Log not found' });
        }

        res.json({ message: 'Deleted successfully' });

    } catch (err) {
        console.error('❌ Delete error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


// STATS
app.get('/api/diet/stats', async (req, res) => {
    try {
        const stats = await MealLog.aggregate([
            {
                $match: {
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



// ==================== WATER ROUTES ====================

app.post('/api/water/log', async (req, res) => {
    const { amount, date } = req.body || {};

    if (!amount) {
        return res.status(400).json({ error: 'amount is required' });
    }

    try {
        const log = new WaterLog({
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


app.get('/api/water/log', async (req, res) => {
    const { date } = req.query;

    try {
        let query = {};

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


app.get('/api/water/stats', async (req, res) => {
    try {
        const stats = await WaterLog.aggregate([
            {
                $match: {
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


// ROOT
app.get('/', (req, res) => {
    res.send('🚀 API is running...');
});


// ==================== SERVER ====================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");

        // 🔥 IMPORTANT CHANGE HERE
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB Error:", err.message);
    });
