
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { InternalUser } from '../types';
import bcrypt from 'bcryptjs';

interface InternalAuthContextType {
  internalUser: InternalUser | null;
  isAuthenticated: boolean;
  loginInternal: (username: string, password: string) => Promise<boolean>;
  logoutInternal: () => void;
  changePassword: (newPassword: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const InternalAuthContext = createContext<InternalAuthContextType | undefined>(undefined);

export const InternalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading: authLoading } = useAuth();
  const [internalUser, setInternalUser] = useState<InternalUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se o nível 1 ainda está carregando, o nível 2 espera
    if (authLoading) return;

    // Se não há sessão Supabase, não há o que validar no interno
    if (!session) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    const checkInternalSession = async () => {
      try {
        const { data: users, error: fetchError } = await supabase
          .from('internal_users')
          .select('*')
          .eq('supabase_user_id', session.user.id);

        if (fetchError) throw fetchError;

        // Se a tabela estiver vazia, cria o ADM padrão e carrega ele
        if (!users || users.length === 0) {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash('123', salt);
          const { data: newUser, error: insertError } = await supabase.from('internal_users').insert({
            supabase_user_id: session.user.id,
            username: 'adm',
            password_hash: hash,
            role: 'admin',
            must_change_password: true
          }).select().single();

          if (insertError) throw insertError;
          
          // Em vez de reload(), vamos apenas setar o estado
          if (newUser) {
             // Não loga automaticamente para forçar o usuário a ver a tela de login operacional
             setLoading(false);
             return;
          }
        }

        // Tenta recuperar sessão salva
        const saved = localStorage.getItem('portaria_express_internal_session');
        if (saved && users) {
          const { username } = JSON.parse(saved);
          const matchedUser = users.find(u => u.username === username);
          if (matchedUser) {
            setInternalUser(matchedUser);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error("InternalAuth: Erro ao verificar sessão operacional:", err);
      } finally {
        setLoading(false);
      }
    };

    checkInternalSession();
  }, [session, authLoading]);

  const loginInternal = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!session) throw new Error("Sessão Supabase expirada.");

      const { data: user, error: userError } = await supabase
        .from('internal_users')
        .select('*')
        .eq('supabase_user_id', session.user.id)
        .eq('username', username)
        .single();

      if (userError || !user) {
        setError("Usuário não encontrado.");
        setLoading(false);
        return false;
      }

      const isValid = await bcrypt.compare(password, user.password_hash);

      if (isValid) {
        setInternalUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('portaria_express_internal_session', JSON.stringify({ username }));
        setLoading(false);
        return true;
      } else {
        setError("Senha incorreta.");
        setLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || "Erro no servidor.");
      setLoading(false);
      return false;
    }
  };

  const logoutInternal = () => {
    localStorage.removeItem('portaria_express_internal_session');
    setInternalUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (!internalUser) return false;
    setLoading(true);
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      const { error: updateError } = await supabase
        .from('internal_users')
        .update({ password_hash: hash, must_change_password: false })
        .eq('id', internalUser.id);
      
      if (updateError) throw updateError;
      
      setInternalUser({ ...internalUser, password_hash: hash, must_change_password: false });
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  return (
    <InternalAuthContext.Provider value={{
      internalUser,
      isAuthenticated,
      loginInternal,
      logoutInternal,
      changePassword,
      loading,
      error
    }}>
      {children}
    </InternalAuthContext.Provider>
  );
};

export const useInternalAuth = () => {
  const context = useContext(InternalAuthContext);
  if (context === undefined) {
    throw new Error('useInternalAuth must be used within an InternalAuthProvider');
  }
  return context;
};
