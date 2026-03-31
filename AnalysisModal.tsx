import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './services/supabaseClient';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { RefreshCw } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

/**
 * App.tsx
 * Punto de entrada principal con orquestación de autenticación y vistas
 */
export const ThemeContext = createContext<{ darkMode: boolean; toggleDarkMode: () => void } | undefined>(undefined);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="font-bold text-slate-500">Iniciando Sistema de Seguridad...</p>
      </div>
    );
  }

  return (
    <div className={`antialiased ${darkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen`}>
      <Toaster position="top-right" />
      {session ? (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
          <Dashboard session={session} />
        </ThemeContext.Provider>
      ) : (
        <Login onLogin={() => {}} />
      )}
    </div>
  );
}

