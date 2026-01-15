
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { LogOut, Save, User as UserIcon, Weight } from 'lucide-react';

const Profile: React.FC = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
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
      alert('Perfil actualizado');
    } catch (err) {
      console.error(err);
      alert('Error al guardar');
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
        <p className="text-zinc-500 text-sm font-bold tracking-tighter">RANGO S - CLASE 1</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
            <UserIcon size={12} /> Nombre de Héroe
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Saitama"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
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
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-white text-zinc-950 p-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : <><Save size={20} /> Guardar Cambios</>}
        </button>
      </div>

      <button
        onClick={() => signOut()}
        className="w-full bg-zinc-900 text-zinc-400 p-4 rounded-xl font-bold border border-zinc-800 flex items-center justify-center gap-2 transition-colors hover:text-red-500"
      >
        <LogOut size={20} /> Cerrar Sesión
      </button>
    </div>
  );
};

export default Profile;
