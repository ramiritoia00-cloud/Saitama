
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Profile, Streak } from '../types';
import { getStreak } from '../services/workoutService';

interface AuthContextType {
  user: User | any | null;
  profile: Profile | null;
  streak: Streak | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshStreak: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchProfile = async (userId: string) => {
    if (isDemo) {
      setProfile({ user_id: userId, name: 'Saitama (Demo)', weight: 70, created_at: '', updated_at: '' });
      return;
    }
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (!error) setProfile(data);
    } catch (e) { console.error(e); }
  };

  const fetchStreak = async (userId: string) => {
    try {
      const s = await getStreak(userId);
      setStreak(s);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    // Verificar si hay una sesión demo guardada
    const demoSession = localStorage.getItem('demo_session');
    if (demoSession) {
      const demoUser = JSON.parse(demoSession);
      setUser(demoUser);
      setIsDemo(true);
      fetchProfile(demoUser.id);
      fetchStreak(demoUser.id);
      setLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await Promise.all([fetchProfile(session.user.id), fetchStreak(session.user.id)]);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    initSession();
  }, [isDemo]);

  const loginAsDemo = () => {
    const demoUser = { id: 'demo-user-id', email: 'admin@test.com' };
    localStorage.setItem('demo_session', JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemo(true);
  };

  const signOut = async () => {
    localStorage.removeItem('demo_session');
    setIsDemo(false);
    setUser(null);
    setProfile(null);
    setStreak(null);
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };
  const refreshStreak = async () => { if (user) await fetchStreak(user.id); };

  return (
    <AuthContext.Provider value={{ user, profile, streak, loading, isDemo, signOut, refreshProfile, refreshStreak, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
