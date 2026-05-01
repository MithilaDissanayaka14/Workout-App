import mongoose from "mongoose";

const AchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: String, required: true }, // e.g., 'first_workout', 'consistency_5'
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String }, // e.g., 'medal', 'flame'
  dateEarned: { type: Date, default: Date.now }
});

const Achievement = mongoose.model('Achievement', AchievementSchema);
export default Achievement;
