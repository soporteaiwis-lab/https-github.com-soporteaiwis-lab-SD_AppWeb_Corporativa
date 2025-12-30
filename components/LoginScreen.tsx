import React, { useState } from 'react';
import { User } from '../types';

export const LoginScreen = ({ users, onLogin }: { users: User[], onLogin: (u: User) => void }) => {
  const [email, setEmail] = useState('soporte.aiwis@gmail.com');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email);
    if (user && password === '1234') {
      onLogin(user);
    } else {
      setError('Credenciales inválidas. (Tip: contraseña es 1234)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-simple-900 rounded-2xl items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">S</div>
          <h1 className="text-2xl font-bold text-simple-900">SimpleData Portal</h1>
          <p className="text-slate-500">Acceso Seguro Corporativo</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
              <input type="email" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-simple-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input type="password" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-simple-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
           </div>
           {error && <p className="text-red-500 text-sm text-center">{error}</p>}
           <button type="submit" className="w-full bg-simple-600 hover:bg-simple-700 text-white font-bold py-3 rounded-lg transition-colors">Ingresar</button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">Protected by SimpleData Auth v2.1</div>
      </div>
    </div>
  );
};