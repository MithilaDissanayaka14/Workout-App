import mongoose from 'mongoose';

const templateExerciseSchema = new mongoose.Schema({
  name: String,
  sets: Number,
  reps: Number,
});

const workoutTemplateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  exercises: [templateExerciseSchema],
});

const WorkoutTemplate = mongoose.model('WorkoutTemplate', workoutTemplateSchema);

export default WorkoutTemplate;
