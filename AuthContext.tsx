import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

/* ===============================
   Tipagem do Context
================================ */
interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/* ===============================
   Context
================================ */
const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
});

/* ===============================
   Provider
================================ */
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    // Inicializa sessão corretamente
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao pegar sessão:', error);
        }

        setSession(data.session);
      } catch (err) {
        console.error('Erro geral auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listener de login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  /* ===============================
     Logout
  ================================ */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  /* ===============================
     Provider
  ================================ */
  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ===============================
   Hook
================================ */
export const useAuth = () => {
  return useContext(AuthContext);
};
