
import { ExerciseType, ExerciseGoal } from './types';

export const EXERCISE_GOALS: Record<ExerciseType, ExerciseGoal> = {
  [ExerciseType.PUSHUPS]: {
    type: ExerciseType.PUSHUPS,
    label: 'Flexiones',
    goal: 100,
    color: '#ef4444' // red-500
  },
  [ExerciseType.PULLUPS]: {
    type: ExerciseType.PULLUPS,
    label: 'Dominadas',
    goal: 100,
    color: '#3b82f6' // blue-500
  },
  [ExerciseType.SQUATS]: {
    type: ExerciseType.SQUATS,
    label: 'Sentadillas',
    goal: 100,
    color: '#f59e0b' // amber-500
  }
};

export const REST_DAY_THRESHOLD = 3; // Days to earn a rest day
