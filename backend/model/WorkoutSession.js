import mongoose from 'mongoose';

const setSchema = new mongoose.Schema({
  id: String,
  reps: Number,
  weight: Number,
  isPR: Boolean,
});

const exerciseSchema = new mongoose.Schema({
  id: String,
  name: String,
  sets: [setSchema],
});

const workoutSessionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  exercises: [exerciseSchema],
  totalVolume: { type: Number, required: true },
});

const WorkoutSession = mongoose.model('WorkoutSession', workoutSessionSchema);

export default WorkoutSession;
