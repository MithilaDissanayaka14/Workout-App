import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
    day: { type: String, required: true },
    exerciseName: { type: String, required: true },
    sets: { type: Number, required: true },
    repsOrDuration: { type: String, required: true }
});

const WorkoutPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planName: { type: String, required: true },
    goal: { 
        type: String, 
        required: true
    },
    durationWeeks: { type: Number, required: true, min: 1 },
    daysPerWeek: { type: Number, required: true, min: 1, max: 7 },
    exercises: [ExerciseSchema],
    createdAt: { type: Date, default: Date.now }
});

const WorkoutPlan = mongoose.model('WorkoutPlan', WorkoutPlanSchema);

export default WorkoutPlan;
