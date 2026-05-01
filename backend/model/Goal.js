import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Weight', 'Volume', 'Consistency', 'Nutrition'], required: true },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Completed', 'Failed'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Goal = mongoose.model('Goal', GoalSchema);
export default Goal;
