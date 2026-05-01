import Achievement from '../model/Achievement.js';
import WorkoutSession from '../model/WorkoutSession.js';

// Get all achievements for a user
export const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: req.user }).sort({ dateEarned: -1 });
    res.status(200).json(achievements);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Check for and award achievements (can be called manually or hooked)
export const checkAchievements = async (req, res) => {
  try {
    const userId = req.user;
    const achievementsAwarded = [];

    // 1. First Workout Achievement
    const workouts = await WorkoutSession.find({ userId });
    const hasFirstWorkout = await Achievement.findOne({ userId, achievementId: 'first_workout' });
    
    if (workouts.length > 0 && !hasFirstWorkout) {
      const achievement = new Achievement({
        userId,
        achievementId: 'first_workout',
        title: 'First Step',
        description: 'Logged your first Workout Session!',
        icon: 'medal'
      });
      await achievement.save();
      achievementsAwarded.push(achievement);
    }

    // 2. Consistency (5 Workouts)
    const hasConsistency = await Achievement.findOne({ userId, achievementId: 'consistency_5' });
    if (workouts.length >= 5 && !hasConsistency) {
      const achievement = new Achievement({
        userId,
        achievementId: 'consistency_5',
        title: 'Consistency is Key',
        description: 'Logged 5 Workout Sessions!',
        icon: 'flame'
      });
      await achievement.save();
      achievementsAwarded.push(achievement);
    }

    // 3. Volume Monster (10,000kg)
    const totalVolume = workouts.reduce((sum, session) => sum + (session.totalVolume || 0), 0);
    const hasVolume = await Achievement.findOne({ userId, achievementId: 'volume_10k' });
    if (totalVolume >= 10000 && !hasVolume) {
      const achievement = new Achievement({
        userId,
        achievementId: 'volume_10k',
        title: 'Volume Monster',
        description: 'Surpassed 10,000kg total volume across all workouts!',
        icon: 'barbell'
      });
      await achievement.save();
      achievementsAwarded.push(achievement);
    }

    res.status(200).json({ newAchievements: achievementsAwarded });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
