
import { supabase } from './supabaseClient';
import { DailyWorkout, Streak, ExerciseType } from '../types';
import { EXERCISE_GOALS, REST_DAY_THRESHOLD } from '../constants';
import { format, subDays } from 'date-fns';

/**
 * HELPER: Mapea la estructura relacional de la BD al objeto DailyWorkout que usa la UI
 */
const mapToDailyWorkout = (workout: any, logs: any[]): DailyWorkout => {
  const findCount = (type: string) => logs.find(l => l.exercise_type === type)?.reps || 0;
  
  return {
    id: workout.id,
    user_id: workout.user_id,
    date: workout.date,
    pushups_count: findCount(ExerciseType.PUSHUPS),
    pullups_count: findCount(ExerciseType.PULLUPS),
    squats_count: findCount(ExerciseType.SQUATS),
    completed: workout.completed || false,
    used_rest_day: workout.used_rest_day || false
  };
};

/**
 * LÓGICA GET-OR-CREATE: Asegura que exista un registro padre para hoy
 */
const ensureWorkoutExists = async (userId: string, date: string, isDemo: boolean): Promise<string> => {
  if (isDemo) return 'demo-id';

  // 1. Intentar obtener el entrenamiento existente
  const { data: existing } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (existing) return existing.id;

  // 2. Si no existe, crearlo (Lógica Defensiva)
  const { data: created, error } = await supabase
    .from('workouts')
    .insert({ 
      user_id: userId, 
      date: date,
      name: `Entrenamiento ${date}`,
      completed: false 
    })
    .select('id')
    .single();

  if (error) {
    // Si hubo un error de duplicado por carrera crítica, re-intentar búsqueda
    if (error.code === '23505') {
       const { data: retry } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
       return retry?.id;
    }
    throw error;
  }
  
  return created.id;
};

export const getWorkoutForDate = async (userId: string, date: string, isDemo: boolean): Promise<DailyWorkout | null> => {
  if (isDemo) {
    const workouts = JSON.parse(localStorage.getItem('workouts_mock') || '[]');
    return workouts.find((w: any) => w.date === date) || null;
  }

  // Obtenemos el padre y sus hijos en una sola consulta eficiente
  const { data: workout, error } = await supabase
    .from('workouts')
    .select('*, workout_logs(*)')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!workout) return null;

  return mapToDailyWorkout(workout, workout.workout_logs);
};

export const updateExerciseCount = async (userId: string, date: string, type: ExerciseType, increment: number, isDemo: boolean): Promise<DailyWorkout> => {
  if (isDemo) {
    // Lógica Mock simplificada para demo
    const workouts = JSON.parse(localStorage.getItem('workouts_mock') || '[]');
    let w = workouts.find((item: any) => item.date === date);
    if (!w) {
      w = { id: Math.random().toString(), user_id: userId, date, pushups_count: 0, pullups_count: 0, squats_count: 0, completed: false };
      workouts.push(w);
    }
    const key = `${type}_count` as keyof DailyWorkout;
    (w as any)[key] = (Number((w as any)[key]) || 0) + increment;
    
    w.completed = w.pushups_count >= EXERCISE_GOALS[ExerciseType.PUSHUPS].goal &&
                  w.pullups_count >= EXERCISE_GOALS[ExerciseType.PULLUPS].goal &&
                  w.squats_count >= EXERCISE_GOALS[ExerciseType.SQUATS].goal;

    localStorage.setItem('workouts_mock', JSON.stringify(workouts));
    return w;
  }

  // 1. Asegurar registro PADRE (workouts)
  const workoutId = await ensureWorkoutExists(userId, date, isDemo);

  // 2. Obtener logs actuales para este ejercicio
  const { data: existingLog } = await supabase
    .from('workout_logs')
    .select('reps')
    .eq('workout_id', workoutId)
    .eq('exercise_type', type)
    .single();

  const newReps = (existingLog?.reps || 0) + increment;

  // 3. Upsert en tabla HIJA (workout_logs)
  const { error: logError } = await supabase
    .from('workout_logs')
    .upsert({ 
      workout_id: workoutId, 
      exercise_type: type, 
      reps: newReps 
    }, { onConflict: 'workout_id,exercise_type' });

  if (logError) throw logError;

  // 4. Recalcular completado
  const { data: allLogs } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('workout_id', workoutId);

  const logs = allLogs || [];
  const isCompleted = 
    (logs.find(l => l.exercise_type === ExerciseType.PUSHUPS)?.reps || 0) >= EXERCISE_GOALS[ExerciseType.PUSHUPS].goal &&
    (logs.find(l => l.exercise_type === ExerciseType.PULLUPS)?.reps || 0) >= EXERCISE_GOALS[ExerciseType.PULLUPS].goal &&
    (logs.find(l => l.exercise_type === ExerciseType.SQUATS)?.reps || 0) >= EXERCISE_GOALS[ExerciseType.SQUATS].goal;

  // 5. Actualizar estado en PADRE
  const { data: updatedWorkout } = await supabase
    .from('workouts')
    .update({ completed: isCompleted })
    .eq('id', workoutId)
    .select()
    .single();

  if (isCompleted) {
    await updateStreakAfterCompletion(userId, isDemo);
  }

  return mapToDailyWorkout(updatedWorkout, logs);
};

export const getStreak = async (userId: string, isDemo: boolean): Promise<Streak> => {
  if (isDemo) {
    return JSON.parse(localStorage.getItem('streak_mock') || JSON.stringify({ user_id: 'demo-user-id', current_streak: 0, max_streak: 0, rest_day_available: false }));
  }
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
    localStorage.setItem('streak_mock', JSON.stringify({ ...streak, current_streak: newCurrentStreak, max_streak: newMaxStreak, rest_day_available: restDayNowAvailable }));
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
      if (isDemo) {
        // En demo simplemente guardamos el estado
      } else {
        const workoutId = await ensureWorkoutExists(userId, yesterday, isDemo);
        await supabase.from('workouts').update({ used_rest_day: true }).eq('id', workoutId);
        await supabase.from('streaks').update({ rest_day_available: false }).eq('user_id', userId);
      }
    } else {
      if (!isDemo) {
        await supabase.from('streaks').update({ current_streak: 0 }).eq('user_id', userId);
      }
    }
  }
};

export const getAllStats = async (userId: string, isDemo: boolean) => {
  if (isDemo) {
    const history = JSON.parse(localStorage.getItem('workouts_mock') || '[]');
    const totals = history.reduce((acc: any, curr: any) => ({
      pushups: acc.pushups + curr.pushups_count,
      pullups: acc.pullups + curr.pullups_count,
      squats: acc.squats + curr.squats_count,
    }), { pushups: 0, pullups: 0, squats: 0 });
    return { totals, history };
  }

  const { data: workouts } = await supabase
    .from('workouts')
    .select('*, workout_logs(*)')
    .eq('user_id', userId);

  const mappedHistory = (workouts || []).map(w => mapToDailyWorkout(w, w.workout_logs));
  
  const totals = mappedHistory.reduce((acc, curr) => ({
    pushups: acc.pushups + curr.pushups_count,
    pullups: acc.pullups + curr.pullups_count,
    squats: acc.squats + curr.squats_count,
  }), { pushups: 0, pullups: 0, squats: 0 });

  return { totals, history: mappedHistory };
};
