
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { LogOut, Save, User as UserIcon, Weight, Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
  const { profile, signOut, refreshProfile, isDemo } = useAuth();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setWeight(profile.weight?.toString() || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      if (isDemo) {
        // En modo demo solo simulamos el guardado
        setTimeout(async () => {
          alert('Modo Demo: Perfil actualizado localmente.');
          setSaving(false);
        }, 500);
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
      alert('¡Perfil actualizado con éxito!');
    } catch (err: any) {
      console.error("Save profile error:", err);
      alert('Error al guardar: ' + (err.message || 'Error desconocido'));
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
            <UserIcon size={12} /> Nombre de Héroe
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Saitama"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none transition-all placeholder:text-zinc-600"
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
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none transition-all placeholder:text-zinc-600"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-white text-zinc-950 p-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:bg-zinc-200"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Cambios</>}
        </button>
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
