
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAllStats } from '../services/workoutService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// Fix: Use direct named imports from date-fns subpaths to ensure they are callable and correctly typed
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { es } from 'date-fns/locale';
import { DailyWorkout } from '../types';
import { Trophy, TrendingUp, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

const Stats: React.FC = () => {
  const { user, streak, isDemo } = useAuth();
  const [stats, setStats] = useState<{ totals: any, history: DailyWorkout[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'total' | 'pushups' | 'pullups' | 'squats'>('total');

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, isDemo]);

  const loadStats = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const s = await getAllStats(user.id, isDemo);
      setStats(s);
    } catch (err) {
      console.error("Stats load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-red-600" size={32} />
    </div>
  );

  const chartData = (stats?.history || [])
    .slice(0, 7)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(w => ({
      date: format(parseISO(w.date), 'EE', { locale: es }),
      total: (w.pushups_count || 0) + (w.pullups_count || 0) + (w.squats_count || 0),
      pushups: w.pushups_count || 0,
      pullups: w.pullups_count || 0,
      squats: w.squats_count || 0,
      completed: w.completed,
      rest: w.used_rest_day
    }));

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-black uppercase italic text-white tracking-tighter">Estadísticas</h2>
        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
          <Trophy className="text-yellow-500" size={14} />
          <span className="text-xs font-black italic text-yellow-500">{streak?.max_streak || 0} MAX RACHA</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-sm">
          <TrendingUp className="text-blue-500 mb-2" size={20} />
          <div className="text-2xl font-black italic">
            {(stats?.totals.pushups || 0) + (stats?.totals.pullups || 0) + (stats?.totals.squats || 0)}
          </div>
          <div className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Total Repeticiones</div>
        </div>
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-sm">
          <CalendarIcon className="text-green-500 mb-2" size={20} />
          <div className="text-2xl font-black italic">{stats?.history.filter(w => w.completed).length || 0}</div>
          <div className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Entrenamientos</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Actividad Semanal</h3>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-zinc-800 border-none rounded-xl text-[10px] font-black uppercase py-1.5 px-3 focus:ring-1 focus:ring-red-500 text-zinc-300"
          >
            <option value="total">Total</option>
            <option value="pushups">Flexiones</option>
            <option value="pullups">Dominadas</option>
            <option value="squats">Sentadillas</option>
          </select>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#52525b', fontSize: 10, fontWeight: 800}} 
              />
              <Tooltip 
                cursor={{fill: '#27272a', radius: 8}}
                contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold'}}
                itemStyle={{color: '#fff'}}
              />
              <Bar dataKey={filter} radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.completed ? '#ef4444' : entry.rest ? '#eab308' : '#3f3f46'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 px-1">Historial Visual</h3>
        <div className="grid grid-cols-7 gap-2">
          {stats?.history.slice(0, 14).map((day, i) => (
            <div 
              key={day.date} 
              className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black border transition-all
                ${day.completed ? 'bg-red-500/20 border-red-500/40 text-red-500' : 
                  day.used_rest_day ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500' : 
                  'bg-zinc-800 border-zinc-700 text-zinc-600'}`}
              title={day.date}
            >
              {format(parseISO(day.date), 'd')}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 14 - (stats?.history.length || 0)) }).map((_, i) => (
             <div key={`empty-${i}`} className="aspect-square rounded-xl bg-zinc-950 border border-zinc-900"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;
