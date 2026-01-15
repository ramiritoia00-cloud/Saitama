
import { supabase } from './supabaseClient';
import { DailyWorkout, Streak, ExerciseType } from '../types';
import { EXERCISE_GOALS, REST_DAY_THRESHOLD } from '../constants';
// Fix: Use direct named imports from date-fns subpaths to resolve "no exported member" or typing issues
import { format } from 'date-fns/format';
import { subDays } from 'date-fns/subDays';

// MOCK STORAGE HELPERS
const getLocalWorkouts = (): DailyWorkout[] => JSON.parse(localStorage.getItem('workouts_mock') || '[]');
const saveLocalWorkout = (workout: DailyWorkout) => {
  const all = getLocalWorkouts();
  const index = all.findIndex(w => w.date === workout.date);
  if (index >= 0) all[index] = workout;
  else all.push(workout);
  localStorage.setItem('workouts_mock', JSON.stringify(all));
};
const getLocalStreak = (): Streak => JSON.parse(localStorage.getItem('streak_mock') || JSON.stringify({ user_id: 'demo-user-id', current_streak: 0, max_streak: 0, rest_day_available: false }));
const saveLocalStreak = (streak: Streak) => localStorage.setItem('streak_mock', JSON.stringify(streak));

export const getWorkoutForDate = async (userId: string, date: string, isDemo: boolean): Promise<DailyWorkout | null> => {
  if (isDemo) {
    return getLocalWorkouts().find(w => w.date === date) || null;
  }
  const { data, error } = await supabase.from('daily_workouts').select('*').eq('user_id', userId).eq('date', date).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const upsertWorkout = async (userId: string, date: string, updates: Partial<DailyWorkout>, isDemo: boolean): Promise<DailyWorkout> => {
  if (isDemo) {
    const existing = getLocalWorkouts().find(w => w.date === date) || { id: Math.random().toString(), user_id: userId, date, pushups_count: 0, pullups_count: 0, squats_count: 0, completed: false, used_rest_day: false };
    const updated = { ...existing, ...updates };
    saveLocalWorkout(updated);
    return updated;
  }
  const { data, error } = await supabase.from('daily_workouts').upsert({ user_id: userId, date, ...updates }, { onConflict: 'user_id,date' }).select().single();
  if (error) throw error;
  return data;
};

export const updateExerciseCount = async (userId: string, date: string, type: ExerciseType, increment: number, isDemo: boolean): Promise<DailyWorkout> => {
  const current = await getWorkoutForDate(userId, date, isDemo) || {
    pushups_count: 0, pullups_count: 0, squats_count: 0, completed: false, used_rest_day: false
  } as any;

  const newCounts = {
    pushups_count: current.pushups_count + (type === ExerciseType.PUSHUPS ? increment : 0),
    pullups_count: current.pullups_count + (type === ExerciseType.PULLUPS ? increment : 0),
    squats_count: current.squats_count + (type === ExerciseType.SQUATS ? increment : 0),
  };

  const isCompleted = 
    newCounts.pushups_count >= EXERCISE_GOALS[ExerciseType.PUSHUPS].goal &&
    newCounts.pullups_count >= EXERCISE_GOALS[ExerciseType.PULLUPS].goal &&
    newCounts.squats_count >= EXERCISE_GOALS[ExerciseType.SQUATS].goal;

  const result = await upsertWorkout(userId, date, { ...newCounts, completed: isCompleted }, isDemo);

  if (isCompleted && !current.completed) {
    await updateStreakAfterCompletion(userId, isDemo);
  }
  return result;
};

export const getStreak = async (userId: string, isDemo: boolean): Promise<Streak> => {
  if (isDemo) return getLocalStreak();
  const { data, error } = await supabase.from('streaks').select('*').eq('user_id', userId).single();
  if (!data) {
    const initial = { user_id: userId, current_streak: 0, max_streak: 0, rest_day_available: false };
    const { data: newData } = await supabase.from('streaks').insert(initial).select().single();
    return newData || initial;
  }
  return data;
};

const updateStreakAfterCompletion = async (userId: string, isDemo: boolean) => {
  const streak = await getStreak(userId, isDemo);
  const newCurrentStreak = streak.current_streak + 1;
  const newMaxStreak = Math.max(streak.max_streak, newCurrentStreak);
  const restDayNowAvailable = streak.rest_day_available || (newCurrentStreak % REST_DAY_THRESHOLD === 0);

  if (isDemo) {
    saveLocalStreak({ ...streak, current_streak: newCurrentStreak, max_streak: newMaxStreak, rest_day_available: restDayNowAvailable });
    return;
  }
  await supabase.from('streaks').update({ current_streak: newCurrentStreak, max_streak: newMaxStreak, rest_day_available: restDayNowAvailable }).eq('user_id', userId);
};

export const processMissedDays = async (userId: string, isDemo: boolean) => {
  const streak = await getStreak(userId, isDemo);
  if (streak.current_streak === 0) return;

  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const lastWorkout = await getWorkoutForDate(userId, yesterday, isDemo);
  
  if (!lastWorkout || (!lastWorkout.completed && !lastWorkout.used_rest_day)) {
    if (streak.rest_day_available) {
      await upsertWorkout(userId, yesterday, { used_rest_day: true }, isDemo);
      if (isDemo) {
        const s = getLocalStreak();
        saveLocalStreak({ ...s, rest_day_available: false });
      } else {
        await supabase.from('streaks').update({ rest_day_available: false }).eq('user_id', userId);
      }
    } else {
      if (isDemo) {
        const s = getLocalStreak();
        saveLocalStreak({ ...s, current_streak: 0 });
      } else {
        await supabase.from('streaks').update({ current_streak: 0 }).eq('user_id', userId);
      }
    }
  }
};

export const getAllStats = async (userId: string, isDemo: boolean) => {
  if (isDemo) {
    const history = getLocalWorkouts();
    const totals = history.reduce((acc, curr) => ({
      pushups: acc.pushups + curr.pushups_count,
      pullups: acc.pullups + curr.pullups_count,
      squats: acc.squats + curr.squats_count,
    }), { pushups: 0, pullups: 0, squats: 0 });
    return { totals, history };
  }
  const { data } = await supabase.from('daily_workouts').select('*').eq('user_id', userId);
  const totals = (data || []).reduce((acc, curr) => ({
    pushups: acc.pushups + (curr.pushups_count || 0),
    pullups: acc.pullups + (curr.pullups_count || 0),
    squats: acc.squats + (curr.squats_count || 0),
  }), { pushups: 0, pullups: 0, squats: 0 });
  return { totals, history: data || [] };
};
