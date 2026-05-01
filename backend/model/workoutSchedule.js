import mongoose from 'mongoose';

/**
 * Workout Schedule Schema
 * Defines the structure for planned workout sessions in the database.
 */
const WorkoutScheduleSchema = new mongoose.Schema({
    workoutName: { type: String, required: true }, // Name of the session or specific plan
    day: { type: String, required: true }, // Monday - Sunday
    time: { type: String, required: true }, // Chosen time (e.g., 6:00 PM)
    location: { type: String, required: true }, // e.g., Gym, Home, Park
    type: { type: String, enum: ['Strength', 'Cardio', 'Yoga'], required: true }, // Workout category
    duration: { type: String, default: '60 min' }, // Length of session
    intensity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }, // Effort level
    notes: { type: String, default: '' }, // Personal reminders or focus areas
    isCompleted: { type: Boolean, default: false }, // Track if workout is finished
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to owner
    createdAt: { type: Date, default: Date.now } // Timestamp for record creation
});

// Create and export the model
const WorkoutSchedule = mongoose.model('WorkoutSchedule', WorkoutScheduleSchema);

export default WorkoutSchedule;
