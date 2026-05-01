import Goal from '../model/Goal.js';

// Create a goal
export const createGoal = async (req, res) => {
  try {
    const { type, targetValue, deadline } = req.body;
    const goal = new Goal({
      userId: req.user,
      type,
      targetValue,
      deadline
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

import BodyStat from '../model/BodyStat.js';
import WorkoutSession from '../model/WorkoutSession.js';
import MealLog from '../model/mealLog.js';

// Get all goals for a user
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user }).sort({ createdAt: -1 });
    
    // Dynamically calculate progress
    const updatedGoals = await Promise.all(goals.map(async (goal) => {
      let currentValue = goal.currentValue;

      if (goal.type === 'Weight') {
        const latestStat = await BodyStat.findOne({ userId: req.user }).sort({ date: -1 });
        if (latestStat) currentValue = latestStat.weight;
      } else if (goal.type === 'Volume') {
        const dateString = goal.createdAt.toISOString().split('T')[0];
        const sessions = await WorkoutSession.find({ userId: req.user, date: { $gte: dateString } });
        currentValue = sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
      } else if (goal.type === 'Consistency') {
        const dateString = goal.createdAt.toISOString().split('T')[0];
        const sessions = await WorkoutSession.find({ userId: req.user, date: { $gte: dateString } });
        currentValue = sessions.length;
      } else if (goal.type === 'Nutrition') {
        const logs = await MealLog.find({ userId: req.user, date: { $gte: goal.createdAt, $lte: goal.deadline } });
        currentValue = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
      }

      // If goal is completed
      let status = goal.status;
      if (status === 'Active') {
        let isCompleted = false;

        if (goal.type !== 'Weight') {
           isCompleted = currentValue >= goal.targetValue;
        } else if (goal.type === 'Weight' && currentValue > 0) {
           // Get the weight at the time the goal was created (or the most recent weight)
           const closestStat = await BodyStat.findOne({ userId: req.user, date: { $lte: goal.createdAt.toISOString() } }).sort({ date: -1 }) 
                             || await BodyStat.findOne({ userId: req.user }).sort({ date: -1 });
           
           const startWeight = closestStat ? closestStat.weight : currentValue;
           
           if (startWeight > goal.targetValue) {
             isCompleted = currentValue <= goal.targetValue; // Losing weight
           } else if (startWeight < goal.targetValue) {
             isCompleted = currentValue >= goal.targetValue; // Gaining weight
           } else {
             isCompleted = true; // Target is already equal to start weight
           }
        }

        if (isCompleted) {
           status = 'Completed';
           
           // Automatically award an achievement for completing the goal
           const achievementId = `goal_completed_${goal._id}`;
           const { default: Achievement } = await import('../model/Achievement.js');
           const exists = await Achievement.findOne({ userId: req.user, achievementId });
           
           if (!exists) {
               await new Achievement({
                   userId: req.user,
                   achievementId,
                   title: 'Goal Crusher',
                   description: `Completed your ${goal.type} Goal: ${goal.targetValue}`,
                   icon: 'trophy'
               }).save();
           }
        }
      }

      // Save updated value if changed
      if (currentValue !== goal.currentValue || status !== goal.status) {
        goal.currentValue = currentValue;
        goal.status = status;
        await goal.save();
      }
      
      return goal;
    }));

    res.status(200).json(updatedGoals);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update a goal
export const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetValue, deadline, status, currentValue } = req.body;
    
    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user },
      { targetValue, deadline, status, currentValue, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user });
    
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
