export const WORKOUT_TEMPLATES = {
  beginner: [
    {
      id: 'template_beg_1',
      planName: 'Beginner Full Body (3 Days)',
      goal: 'Overall Fitness',
      durationWeeks: 4,
      daysPerWeek: 3,
      level: 'Beginner',
      exercises: [
        { day: 'Day 1', exerciseName: 'Bodyweight Squats', sets: 3, repsOrDuration: '10 reps' },
        { day: 'Day 1', exerciseName: 'Push-ups', sets: 3, repsOrDuration: '8 reps' },
        { day: 'Day 1', exerciseName: 'Plank', sets: 3, repsOrDuration: '20 sec' },
        
        { day: 'Day 2', exerciseName: 'Brisk Walking', sets: 1, repsOrDuration: '20 min' },
        { day: 'Day 2', exerciseName: 'Jumping Jacks', sets: 3, repsOrDuration: '15 reps' },
        
        { day: 'Day 3', exerciseName: 'Lunges', sets: 3, repsOrDuration: '10 each leg' },
        { day: 'Day 3', exerciseName: 'Dumbbell Press', sets: 3, repsOrDuration: '10 reps' },
      ]
    },
    {
      id: 'template_beg_2',
      planName: 'Beginner Stretching Routine',
      goal: 'Flexibility',
      durationWeeks: 4,
      daysPerWeek: 4,
      level: 'Beginner',
      exercises: [
        { day: 'Daily Stretch', exerciseName: 'Neck Stretch', sets: 1, repsOrDuration: '30 sec' },
        { day: 'Daily Stretch', exerciseName: 'Shoulder Stretch', sets: 1, repsOrDuration: '30 sec' },
        { day: 'Daily Stretch', exerciseName: 'Hamstring Stretch', sets: 1, repsOrDuration: '30 sec' },
        { day: 'Daily Stretch', exerciseName: 'Quad Stretch', sets: 1, repsOrDuration: '30 sec' },
      ]
    }
  ],
  intermediate: [
    {
      id: 'template_int_1',
      planName: 'Intermediate Strength Split (4 Days)',
      goal: 'Muscle Gain',
      durationWeeks: 8,
      daysPerWeek: 4,
      level: 'Intermediate',
      exercises: [
        { day: 'Day 1 (Upper Body)', exerciseName: 'Bench Press', sets: 4, repsOrDuration: '10 reps' },
        { day: 'Day 1 (Upper Body)', exerciseName: 'Shoulder Press', sets: 3, repsOrDuration: '12 reps' },
        
        { day: 'Day 2 (Lower Body)', exerciseName: 'Squats', sets: 4, repsOrDuration: '12 reps' },
        { day: 'Day 2 (Lower Body)', exerciseName: 'Deadlifts', sets: 3, repsOrDuration: '10 reps' },
        
        { day: 'Day 3', exerciseName: 'Rest / Light Cardio', sets: 1, repsOrDuration: '20 min' },
        
        { day: 'Day 4 (Full Body Circuit)', exerciseName: 'Pull-ups', sets: 3, repsOrDuration: 'Max reps' },
        { day: 'Day 4 (Full Body Circuit)', exerciseName: 'Kettlebell Swings', sets: 4, repsOrDuration: '15 reps' }
      ]
    },
    {
      id: 'template_int_2',
      planName: 'Intermediate Fat Loss + HIIT',
      goal: 'Weight Loss',
      durationWeeks: 6,
      daysPerWeek: 3,
      level: 'Intermediate',
      exercises: [
        { day: 'HIIT Day', exerciseName: 'Running', sets: 1, repsOrDuration: '25 min' },
        { day: 'HIIT Day', exerciseName: 'Burpees', sets: 4, repsOrDuration: '15 reps' },
        { day: 'HIIT Day', exerciseName: 'Mountain Climbers', sets: 4, repsOrDuration: '20 reps' },
        { day: 'HIIT Day', exerciseName: 'Plank', sets: 4, repsOrDuration: '40 sec' },
      ]
    },
    {
      id: 'template_int_3',
      planName: 'Intermediate Stretch + Mobility',
      goal: 'Flexibility',
      durationWeeks: 4,
      daysPerWeek: 3,
      level: 'Intermediate',
      exercises: [
        { day: 'Mobility Day', exerciseName: 'Dynamic Stretching', sets: 1, repsOrDuration: '5 min' },
        { day: 'Mobility Day', exerciseName: 'Hip Flexor Stretch', sets: 3, repsOrDuration: '30 sec' },
        { day: 'Mobility Day', exerciseName: 'Spine Rotation Stretch', sets: 3, repsOrDuration: '30 sec' },
        { day: 'Mobility Day', exerciseName: 'Deep Squat Hold', sets: 3, repsOrDuration: '60 sec' },
      ]
    }
  ]
};
