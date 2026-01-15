
# Saitama Streak - OPM Workout Tracker

Aplicación de entrenamiento personal basada en el reto de One Punch Man.

## Características
- **Tracking Diario Incremental**: Suma repeticiones de flexiones, dominadas y sentadillas.
- **Sistema de Rachas**: Completa los objetivos diarios para mantener tu racha activa.
- **Descansos Automáticos**: Por cada 3 días de entrenamiento consecutivo, ganas 1 día de descanso que se consume automáticamente si fallas un día.
- **Estadísticas Visuales**: Gráficos de progreso y calendario de completado.
- **Modo Oscuro**: Diseño fitness moderno y minimalista.

## Requisitos
- Variables de entorno en un archivo `.env` o en el dashboard de Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Base de Datos (Supabase SQL)
```sql
-- Profiles table
CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily workouts table
CREATE TABLE daily_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  pushups_count INTEGER DEFAULT 0,
  pullups_count INTEGER DEFAULT 0,
  squats_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  used_rest_day BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, date)
);

-- Streaks table
CREATE TABLE streaks (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  rest_day_available BOOLEAN DEFAULT FALSE
);

-- RLS Policies (Example)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = user_id);

ALTER TABLE daily_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workouts" ON daily_workouts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own streaks" ON streaks FOR ALL USING (auth.uid() = user_id);
```

## Desarrollo
```bash
npm install
npm run dev
```
