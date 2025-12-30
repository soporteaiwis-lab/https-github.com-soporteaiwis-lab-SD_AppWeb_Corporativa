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
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center relative group">
             <button onClick={() => onDeleteUser(user.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-2"><Icon name="fa-trash" /></button>
             
             <div className="flex flex-col md:flex-row items-center gap-4 w-full mb-4">
                 <img src={user.avatar} className="w-20 h-20 md:w-16 md:h-16 rounded-full border-4 border-slate-50" />
                 <div className="text-center md:text-left">
                     <h3 className="text-lg font-bold text-slate-900 leading-tight">{user.name}</h3>
                     <p className="text-simple-600 font-medium text-sm">{user.role}</p>
                     <p className="text-slate-400 text-xs mt-1">{user.projects.length} Proyectos Activos</p>
                 </div>
             </div>

             <div className="w-full bg-slate-50 rounded-lg p-3">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-2">Habilidades Principales</p>
                 <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                     {user.skills.slice(0, 3).map((skill, idx) => (
                         <span key={idx} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 font-medium">
                             {skill.name} <span className="text-simple-400 text-[10px] ml-1">{skill.level}%</span>
                         </span>
                     ))}
                 </div>
             </div>
          </div>
        ))}
      </div>
    </div>
   );
};