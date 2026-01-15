
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart2, User, Flame } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { streak } = useAuth();

  const navItems = [
    { icon: Home, label: 'Hoy', path: '/' },
    { icon: BarChart2, label: 'Stats', path: '/stats' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20 max-w-md mx-auto bg-zinc-950 border-x border-zinc-800 shadow-2xl">
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-xl font-extrabold italic tracking-tighter text-red-600">SAITAMA STREAK</h1>
        <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
          <Flame size={16} className={`${streak?.current_streak ? 'text-orange-500 fill-orange-500' : 'text-zinc-700'}`} />
          <span className="text-sm font-black text-white">{streak?.current_streak || 0}</span>
        </div>
      </header>
      
      <main className="flex-1 p-4">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 flex justify-around p-3 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-red-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
