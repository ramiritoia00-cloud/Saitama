
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { LogOut, Save, User as UserIcon, Weight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { profile, signOut, refreshProfile, isDemo } = useAuth();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setWeight(profile.weight?.toString() || '');
    }
  }, [profile]);

  useEffect(() => {
    if (status.type !== '') {
      const timer = setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 600));
        setStatus({ type: 'success', message: 'Modo Demo: Cambios simulados.' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          name, 
          weight: weight ? parseFloat(weight) : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;
      
      await refreshProfile();
      setStatus({ type: 'success', message: '¡Perfil de héroe actualizado!' });
    } catch (err: any) {
      console.error("Save profile error:", err);
      setStatus({ type: 'error', message: err.message || 'Error al guardar cambios' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-8">
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center border-4 border-zinc-900 shadow-xl shadow-red-600/20 mb-4">
          <UserIcon size={48} className="text-white" />
        </div>
        <h2 className="text-2xl font-black uppercase italic">{profile?.name || 'Héroe'}</h2>
        <p className="text-zinc-500 text-sm font-bold tracking-tighter">{isDemo ? 'MODO DEMO' : 'RANGO S - CLASE 1'}</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl relative">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
            <UserIcon size={12} /> Nombre de Héroe
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Saitama"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none transition-all placeholder:text-zinc-700"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
            <Weight size={12} /> Peso Actual (kg)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none transition-all placeholder:text-zinc-700"
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-white text-zinc-950 p-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:bg-zinc-200"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Cambios</>}
          </button>
        </div>

        {/* Feedback Visual Status */}
        {status.type && (
          <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
            status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-xs font-bold uppercase tracking-wider">{status.message}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => signOut()}
        className="w-full bg-zinc-900/50 text-zinc-500 p-4 rounded-xl font-bold border border-zinc-800 flex items-center justify-center gap-2 transition-all hover:bg-red-950/20 hover:text-red-500 hover:border-red-900/30"
      >
        <LogOut size={20} /> Cerrar Sesión
      </button>
    </div>
  );
};

export default Profile;
