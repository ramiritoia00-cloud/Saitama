
export interface Profile {
  user_id: string;
  name: string;
  weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface DailyWorkout {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  pushups_count: number;
  pullups_count: number;
  squats_count: number;
  completed: boolean;
  used_rest_day: boolean;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  max_streak: number;
  rest_day_available: boolean;
}

export enum ExerciseType {
  PUSHUPS = 'pushups',
  PULLUPS = 'pullups',
  SQUATS = 'squats'
}

export interface ExerciseGoal {
  type: ExerciseType;
  label: string;
  goal: number;
  color: string;
}
