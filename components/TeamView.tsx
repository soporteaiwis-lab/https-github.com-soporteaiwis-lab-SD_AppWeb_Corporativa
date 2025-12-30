import React from 'react';
import { User } from '../types';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

export const TeamView = ({ users, onAddUser, onDeleteUser }: { users: User[], onAddUser: (u: User) => void, onDeleteUser: (id: string) => void }) => {
   return (
    <div className="space-y-6 print:hidden pb-20 md:pb-0">
      <h2 className="text-2xl font-bold text-simple-900">Equipo</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center relative group">
             <button onClick={() => onDeleteUser(user.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-2"><Icon name="fa-trash" /></button>
             <img src={user.avatar} className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-50 mb-4" />
             <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
             <p className="text-simple-600 font-medium text-sm mb-4">{user.role}</p>
          </div>
        ))}
      </div>
    </div>
   );
};