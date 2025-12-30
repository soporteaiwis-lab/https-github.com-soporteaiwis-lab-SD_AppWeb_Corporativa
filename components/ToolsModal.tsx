import React, { useState } from 'react';
import { TOOLS_LINKS } from '../constants';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

export const ToolsModal = ({ onClose }: { onClose: () => void }) => {
  const [customTools, setCustomTools] = useState<{name: string, url: string, icon: string, color: string}[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTool, setNewTool] = useState({ name: '', url: '', icon: 'fa-cube' });

  // Merge default and custom tools
  const allTools = [...TOOLS_LINKS, ...customTools];

  const handleAddTool = () => {
    if(!newTool.name || !newTool.url) return;
    setCustomTools([...customTools, { ...newTool, color: 'text-simple-600' }]);
    setIsAdding(false);
    setNewTool({ name: '', url: '', icon: 'fa-cube' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[70] flex items-center justify-center backdrop-blur-md animate-fade-in p-4">
      <div className="w-full max-w-4xl relative">
        <button onClick={onClose} className="absolute -top-12 right-0 text-white/50 hover:text-white text-3xl transition-transform hover:rotate-90">
            <Icon name="fa-times" />
        </button>

        <div className="text-center mb-10 text-white">
            <h2 className="text-3xl font-bold mb-2">Herramientas & Utilidades</h2>
            <p className="text-white/60">Acceso rápido a tu ecosistema digital</p>
        </div>

        {/* Circular/Grid Hybrid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
            {allTools.map((tool, idx) => (
                <a 
                    key={idx} 
                    href={tool.url} 
                    target="_blank"
                    className="flex flex-col items-center gap-3 group"
                >
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:scale-110 group-hover:bg-white group-hover:border-white transition-all duration-300 shadow-xl">
                        <Icon name={tool.icon} className={`text-3xl ${tool.color}`} />
                    </div>
                    <span className="text-white text-sm font-medium group-hover:text-simple-accent transition-colors">{tool.name}</span>
                </a>
            ))}

            {/* Add Button */}
            <button 
                onClick={() => setIsAdding(true)}
                className="flex flex-col items-center gap-3 group"
            >
                <div className="w-20 h-20 bg-simple-600/20 rounded-full flex items-center justify-center border-2 border-dashed border-simple-500/50 group-hover:bg-simple-600 group-hover:border-simple-500 group-hover:scale-110 transition-all duration-300">
                    <Icon name="fa-plus" className="text-2xl text-simple-400 group-hover:text-white" />
                </div>
                <span className="text-white/50 text-sm font-medium group-hover:text-white transition-colors">Agregar</span>
            </button>
        </div>

        {/* Add Modal Internal */}
        {isAdding && (
            <div className="absolute inset-0 bg-slate-800 rounded-2xl flex items-center justify-center p-8 border border-slate-700 shadow-2xl animate-scale-up">
                <div className="w-full max-w-md space-y-4">
                    <h3 className="text-white text-xl font-bold mb-4">Nueva Herramienta</h3>
                    <input 
                        className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:ring-2 focus:ring-simple-500 outline-none" 
                        placeholder="Nombre (ej. DataBricks)" 
                        value={newTool.name}
                        onChange={e => setNewTool({...newTool, name: e.target.value})}
                    />
                    <div className="relative">
                        <input 
                            className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:ring-2 focus:ring-simple-500 outline-none pl-10" 
                            placeholder="URL (https://...) o Ruta Local" 
                            value={newTool.url}
                            onChange={e => setNewTool({...newTool, url: e.target.value})}
                        />
                        <Icon name="fa-link" className="absolute left-3 top-3.5 text-slate-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsAdding(false)} className="flex-1 py-2 text-slate-400 hover:text-white">Cancelar</button>
                        <button onClick={handleAddTool} className="flex-1 py-2 bg-simple-600 hover:bg-simple-700 text-white rounded-lg font-bold">Guardar</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};