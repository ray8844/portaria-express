
import React, { useState } from 'react';
import { useInternalAuth } from '../context/InternalAuthContext';
import { useAuth } from '../context/AuthContext';

const InternalLogin: React.FC = () => {
  const { loginInternal, loading, error } = useInternalAuth();
  // const { signOut } = useAuth(); // Removido acesso direto para segurança
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginInternal(username, password);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[100]">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
             <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Login Operacional</h2>
          <p className="text-slate-400 text-xs mt-1">Identifique-se para acessar o sistema</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Usuário</label>
            <input
              type="text"
              required
              autoFocus
              className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
              placeholder="Ex: adm"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Senha</label>
            <input
              type="password"
              required
              className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-4 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 flex justify-center items-center uppercase tracking-wide"
          >
            {loading ? 'Validando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InternalLogin;
