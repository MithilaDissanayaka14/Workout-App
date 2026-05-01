import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken } from '@/storage/authStorage';
import { API_BASE_URL } from '@/constants/api';

const API_URL = `${API_BASE_URL}/api`;

const syncWithBackend = async (endpoint: string, data: any) => {
  try {
    const token = await getAuthToken();
    if (!token) return;
    await fetch(`${API_URL}/sync/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.log('Background sync failed:', error);
  }
};

const deleteFromBackend = async (endpoint: string) => {
  try {
    const token = await getAuthToken();
    if (!token) return;
    await fetch(`${API_URL}/sync/${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.log('Background delete sync failed:', error);
  }
};

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  isPR?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: Exercise[];
  totalVolume: number;
}

export interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  waist?: number;
  mood?: string;
  notes?: string;
}

export type BodyStat = ProgressEntry;

export interface TemplateExercise {
  name: string;
  sets: number;
  reps: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
}

const STORAGE_KEYS = {
  WORKOUTS: 'gym_tracker_workouts',
  BODY_STATS: 'gym_tracker_body_stats',
  STREAK: 'gym_tracker_streak',
  TEMPLATES: 'gym_tracker_templates',
};

const normalizeProgressEntry = (entry: Partial<ProgressEntry> & { _id?: string; entryId?: string }): ProgressEntry => ({
  id: entry.id || entry.entryId || entry._id || entry.date || Date.now().toString(),
  date: entry.date || new Date().toISOString(),
  weight: Number(entry.weight) || 0,
  // Only treat waist as provided when not null/undefined; empty-string check removed to avoid type mismatch
  waist: entry.waist !== undefined && entry.waist !== null ? Number(entry.waist) : undefined,
  mood: entry.mood || '',
  notes: entry.notes || '',
});

export const saveWorkout = async (workout: WorkoutSession) => {
  try {
    const existingWorkouts = await getWorkouts();
    const updatedWorkouts = [workout, ...existingWorkouts];
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updatedWorkouts));

    // Update streak and PRs
    await updateStreak();
    await checkPRs(workout);

    // Sync in background
    syncWithBackend('workouts', { workouts: [workout] });

    return true;
  } catch (error) {
    console.error('Error saving workout:', error);
    return false;
  }
};

export const getWorkouts = async (): Promise<WorkoutSession[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting workouts:', error);
    return [];
  }
};

export const saveProgressEntry = async (entry: Partial<ProgressEntry>) => {
  try {
    const existingStats = await getProgressEntries();
    const newStat = normalizeProgressEntry({
      ...entry,
      id: entry.id || Date.now().toString(),
      date: entry.date || new Date().toISOString(),
    });
    const updatedStats = [newStat, ...existingStats.filter(stat => stat.id !== newStat.id)];
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_STATS, JSON.stringify(updatedStats));

    // Sync in background
    syncWithBackend('stats', { stats: [newStat] });
    
    return true;
  } catch (error) {
    console.error('Error saving progress entry:', error);
    return false;
  }
};

export const updateProgressEntry = async (id: string, updates: Partial<ProgressEntry>) => {
  try {
    const existingStats = await getProgressEntries();
    const updatedStats = existingStats.map(stat => (
      stat.id === id ? normalizeProgressEntry({ ...stat, ...updates, id }) : stat
    ));
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_STATS, JSON.stringify(updatedStats));

    const updatedEntry = updatedStats.find(stat => stat.id === id);
    if (updatedEntry) {
      syncWithBackend('stats', { stats: [updatedEntry] });
    }

    return true;
  } catch (error) {
    console.error('Error updating progress entry:', error);
    return false;
  }
};

export const deleteProgressEntry = async (id: string) => {
  try {
    const existingStats = await getProgressEntries();
    const updatedStats = existingStats.filter(stat => stat.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_STATS, JSON.stringify(updatedStats));
    deleteFromBackend(`stats/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting progress entry:', error);
    return false;
  }
};

export const getProgressEntries = async (): Promise<ProgressEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BODY_STATS);
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map((entry: Partial<ProgressEntry> & { _id?: string; entryId?: string }) => normalizeProgressEntry(entry));
  } catch (error) {
    console.error('Error getting progress entries:', error);
    return [];
  }
};

export const pullProgressEntriesFromBackend = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_URL}/sync/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return;

    const stats = await response.json();
    if (Array.isArray(stats)) {
      const normalized = stats.map((entry: Partial<ProgressEntry> & { _id?: string; entryId?: string }) => normalizeProgressEntry(entry));
      await AsyncStorage.setItem(STORAGE_KEYS.BODY_STATS, JSON.stringify(normalized));
    }
  } catch (error) {
    console.log('Error pulling progress from backend', error);
  }
};

export const saveBodyWeight = async (weight: number) => {
  return saveProgressEntry({
    weight,
    date: new Date().toISOString(),
  });
};

export const getBodyStats = async (): Promise<BodyStat[]> => {
  return getProgressEntries();
};

const updateStreak = async () => {

  const workouts = await getWorkouts();
  if (workouts.length === 0) return;


};

const checkPRs = async (workout: WorkoutSession) => {
  const workouts = await getWorkouts();
  const pastWorkouts = workouts.filter(w => w.id !== workout.id);

  workout.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      const isWeightPR = !pastWorkouts.some(pw =>
        pw.exercises.some(pe => pe.name === exercise.name && pe.sets.some(ps => ps.weight >= set.weight))
      );
      if (isWeightPR && set.weight > 0) {
        set.isPR = true;
      }
    });
  });
};

export const getSuggestedWeight = async (exerciseName: string): Promise<number> => {
  const workouts = await getWorkouts();
  const lastWorkoutWithExercise = workouts.find(w =>
    w.exercises.some(e => e.name.toLowerCase() === exerciseName.toLowerCase())
  );

  if (lastWorkoutWithExercise) {
    const exercise = lastWorkoutWithExercise.exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
    if (exercise && exercise.sets.length > 0) {
      const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
      // Progressive overload: suggest 2.5kg more if they did at least 5 reps
      const lastSet = exercise.sets[exercise.sets.length - 1];
      if (lastSet && lastSet.reps >= 5) {
        return maxWeight + 2.5;
      }
      return maxWeight;
    }
  }
  return 0;
};

export const getWeeklyInsights = async () => {
  const workouts = await getWorkouts();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const lastWeekWorkouts = workouts.filter(w => new Date(w.date) > oneWeekAgo);
  const previousWeekWorkouts = workouts.filter(w => {
    const d = new Date(w.date);
    return d <= oneWeekAgo && d > new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
  });

  const lastWeekVolume = lastWeekWorkouts.reduce((acc, w) => acc + w.totalVolume, 0);
  const prevWeekVolume = previousWeekWorkouts.reduce((acc, w) => acc + w.totalVolume, 0);

  const volumeChange = prevWeekVolume === 0 ? 100 : ((lastWeekVolume - prevWeekVolume) / prevWeekVolume) * 100;

  return {
    volumeChange: volumeChange.toFixed(1),
    workoutCount: lastWeekWorkouts.length,
    isIncreasing: lastWeekVolume >= prevWeekVolume
  };
};

export const saveTemplate = async (template: WorkoutTemplate) => {
  try {
    const existing = await getTemplates();
    const updated = [template, ...existing];
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
    
    // Sync in background
    syncWithBackend('templates', { templates: [template] });
    
    return true;
  } catch (error) {
    console.error('Error saving template:', error);
    return false;
  }
};

export const getTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!data) {
      return [
        {
          id: 't1',
          name: 'Push Day',
          exercises: [
            { name: 'Bench Press', sets: 3, reps: 10 },
            { name: 'Overhead Press', sets: 3, reps: 10 },
            { name: 'Tricep Pushdown', sets: 3, reps: 12 }
          ]
        },
        {
          id: 't2',
          name: 'Pull Day',
          exercises: [
            { name: 'Pull-ups', sets: 3, reps: 8 },
            { name: 'Barbell Row', sets: 3, reps: 10 },
            { name: 'Bicep Curl', sets: 3, reps: 12 }
          ]
        },
        {
          id: 't3',
          name: 'Leg Day',
          exercises: [
            { name: 'Squat', sets: 3, reps: 8 },
            { name: 'Leg Press', sets: 3, reps: 10 },
            { name: 'Calf Raise', sets: 3, reps: 15 }
          ]
        }
      ];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting templates:', error);
    return [];
  }
};

export const pullDataFromBackend = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };

    const [workoutsRes, templatesRes, statsRes] = await Promise.all([
      fetch(`${API_URL}/sync/workouts`, { headers }).catch(() => null),
      fetch(`${API_URL}/sync/templates`, { headers }).catch(() => null),
      fetch(`${API_URL}/sync/stats`, { headers }).catch(() => null)
    ]);

    if (workoutsRes && workoutsRes.ok) {
      const workouts = await workoutsRes.json();
      if (workouts.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
      }
    }
    
    if (templatesRes && templatesRes.ok) {
      const templates = await templatesRes.json();
      if (templates.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
      }
    }

    if (statsRes && statsRes.ok) {
      const stats = await statsRes.json();
      if (stats.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEYS.BODY_STATS, JSON.stringify(stats));
      }
    }
  } catch (error) {
    console.log('Error pulling from backend', error);
  }
};
