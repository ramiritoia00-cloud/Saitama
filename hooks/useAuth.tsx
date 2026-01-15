
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

  const fetchProfile = async (userId: string, demoMode: boolean) => {
    if (demoMode) {
      setProfile({ user_id: userId, name: 'Saitama (Demo)', weight: 70, created_at: '', updated_at: '' });
      return;
    }
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (!error) {
        setProfile(data);
      } else if (error.code === 'PGRST116') {
        const { data: newProfile } = await supabase.from('profiles').insert({ user_id: userId, name: 'Héroe Nuevo' }).select().single();
        if (newProfile) setProfile(newProfile);
      }
    } catch (e) { console.error("Error profile:", e); }
  };

  const fetchStreak = async (userId: string, demoMode: boolean) => {
    try {
      const s = await getStreak(userId, demoMode);
      setStreak(s);
    } catch (e) { console.error("Error streak:", e); }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          localStorage.removeItem('demo_session');
          setUser(session.user);
          setIsDemo(false);
          setLoading(false); // Liberar UI inmediatamente
          // Cargar datos extra en segundo plano
          fetchProfile(session.user.id, false);
          fetchStreak(session.user.id, false);
        } else {
          const demoSession = localStorage.getItem('demo_session');
          if (demoSession) {
            const demoUser = JSON.parse(demoSession);
            setUser(demoUser);
            setIsDemo(true);
            setLoading(false);
            fetchProfile(demoUser.id, true);
            fetchStreak(demoUser.id, true);
          } else {
            setUser(null);
            setIsDemo(false);
            setLoading(false);
          }
        }
      } catch (e) { 
        console.error("Session init failed", e); 
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        localStorage.removeItem('demo_session');
        setUser(session.user);
        setIsDemo(false);
        fetchProfile(session.user.id, false);
        fetchStreak(session.user.id, false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsDemo(false);
        setProfile(null);
        setStreak(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsDemo = () => {
    const demoUser = { id: 'demo-user-id', email: 'admin@test.com' };
    localStorage.setItem('demo_session', JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemo(true);
  };

  const signOut = async () => {
    localStorage.removeItem('demo_session');
    await supabase.auth.signOut();
    setIsDemo(false);
    setUser(null);
    setProfile(null);
    setStreak(null);
  };

  const refreshProfile = async () => { if (user) await fetchProfile(user.id, isDemo); };
  const refreshStreak = async () => { if (user) await fetchStreak(user.id, isDemo); };

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
