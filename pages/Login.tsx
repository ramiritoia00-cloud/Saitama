
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Flame, Mail, Lock, Loader2, Play } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginAsDemo } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock bypass para las credenciales de admin solicitadas
    if (email === 'admin@test.com' && password === 'admin123') {
      setTimeout(() => {
        loginAsDemo();
        setLoading(false);
      }, 800);
      return;
    }

    try {
      if (isRegistering) {
        // Obtenemos la URL actual para que Supabase sepa a dónde volver tras la confirmación
        const redirectUrl = window.location.origin;
        
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: redirectUrl,
          }
        });
        if (error) throw error;
        alert('¡Registro iniciado! Revisa tu email para confirmar la cuenta. Serás redirigido de vuelta aquí.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-red-600 rounded-[2rem] rotate-12 flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-red-600/40">
          <Flame size={48} className="text-white -rotate-12" />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white">SAITAMA STREAK</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2 opacity-80">El camino del héroe comienza hoy</p>
      </div>

      <div className="w-full space-y-4">
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="email"
              placeholder="Email de héroe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 pl-12 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none transition-all placeholder:text-zinc-700"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 pl-12 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none transition-all placeholder:text-zinc-700"
              required
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Crear Cuenta' : 'Entrar al Dojo')}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600"><span className="bg-zinc-950 px-4">O</span></div>
        </div>

        <button
          onClick={loginAsDemo}
          className="w-full bg-zinc-100 hover:bg-white text-zinc-950 p-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Play size={18} fill="currentColor" /> ACCESO RÁPIDO (MODO DEMO)
        </button>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:text-zinc-300 transition-colors py-2"
        >
          {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Nuevo recluta? Regístrate gratis'}
        </button>
      </div>

      <div className="mt-auto pt-8">
        <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.5em]">Hero Association Registry</p>
      </div>
    </div>
  );
};

export default Login;
