import mongoose from 'mongoose';

const mealLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
        type: String,
        required: true,
        trim: true
    },
    mealType: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
        default: 'Breakfast'
    },
    calories: {
        type: Number,
        default: 0
    },
    carbs: {
        type: Number,
        default: 0
    },
    protein: {
        type: Number,
        default: 0
    },
    fat: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const MealLog = mongoose.model('MealLog', mealLogSchema);

export default MealLog;
