
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EXERCISE_GOALS } from '../constants';
import { DailyWorkout, ExerciseType } from '../types';
import { getWorkoutForDate, updateExerciseCount, processMissedDays } from '../services/workoutService';
import { format } from 'date-fns';
import ExerciseCard from '../components/ExerciseCard';
import { Flame, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, streak, refreshStreak, isDemo } = useAuth();
  const [workout, setWorkout] = useState<DailyWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, isDemo]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await processMissedDays(user.id, isDemo);
      const w = await getWorkoutForDate(user.id, today, isDemo);
      setWorkout(w || {
        id: '',
        user_id: user.id,
        date: today,
        pushups_count: 0,
        pullups_count: 0,
        squats_count: 0,
        completed: false,
        used_rest_day: false
      });
      await refreshStreak();
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async (type: ExerciseType, amount: number) => {
    if (!user) return;
    setSaveError(null);
    try {
      const updated = await updateExerciseCount(user.id, today, type, amount, isDemo);
      setWorkout(updated);
      
      if (updated.completed) {
        await refreshStreak();
      }
    } catch (err) {
      console.error("Add exercise error:", err);
      setSaveError("No se pudo guardar. Reintenta pronto.");
      setTimeout(() => setSaveError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-zinc-500">
        <Loader2 className="animate-spin text-red-600" size={40} />
        <p className="font-bold italic uppercase tracking-widest animate-pulse">Analizando esfuerzo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
          <Flame size={32} className={`${streak?.current_streak ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'text-zinc-800'} mb-2`} />
          <span className="text-3xl font-black italic">{streak?.current_streak || 0}</span>
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Racha Actual</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
          <ShieldCheck size={32} className={`${streak?.rest_day_available ? 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'text-zinc-800'} mb-2`} />
          <span className="text-3xl font-black italic">{streak?.rest_day_available ? '1' : '0'}</span>
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Descanso Disp.</span>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-3 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
          <AlertCircle size={16} />
          <span className="text-xs font-black uppercase tracking-widest">{saveError}</span>
        </div>
      )}

      {workout?.completed && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl p-4 text-center animate-bounce">
          <h2 className="text-lg font-black italic">¡OBJETIVO COMPLETADO! 👊</h2>
          <p className="text-xs font-bold opacity-80">Tu fuerza aumenta exponencialmente.</p>
        </div>
      )}

      <div className="space-y-4">
        <ExerciseCard 
          exercise={EXERCISE_GOALS[ExerciseType.PUSHUPS]} 
          currentValue={workout?.pushups_count || 0}
          onAdd={(val) => handleAddExercise(ExerciseType.PUSHUPS, val)}
        />
        <ExerciseCard 
          exercise={EXERCISE_GOALS[ExerciseType.PULLUPS]} 
          currentValue={workout?.pullups_count || 0}
          onAdd={(val) => handleAddExercise(ExerciseType.PULLUPS, val)}
        />
        <ExerciseCard 
          exercise={EXERCISE_GOALS[ExerciseType.SQUATS]} 
          currentValue={workout?.squats_count || 0}
          onAdd={(val) => handleAddExercise(ExerciseType.SQUATS, val)}
        />
      </div>

      <div className="p-6 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl text-center">
        <p className="text-zinc-600 text-xs italic font-medium leading-relaxed">
          "La verdadera fuerza no viene de lo que puedes hacer. Viene de superar las cosas que una vez pensaste que no podías."
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
