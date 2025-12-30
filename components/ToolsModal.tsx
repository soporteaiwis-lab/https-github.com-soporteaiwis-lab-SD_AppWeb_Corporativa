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
    // FULL SCREEN ON MOBILE (z-[70]), Centered on Desktop
    <div className="fixed inset-0 z-[70] bg-slate-900/95 md:bg-slate-900/90 flex flex-col md:justify-center md:items-center backdrop-blur-md animate-fade-in">
      
      {/* Mobile Sticky Header */}
      <div className="w-full md:hidden flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">Herramientas</h2>
          <button onClick={onClose} className="w-10 h-10 bg-slate-700 rounded-full text-white flex items-center justify-center">
              <Icon name="fa-times" />
          </button>
      </div>

      <div className="w-full md:max-w-4xl relative p-4 overflow-y-auto h-full md:h-auto">
        {/* Desktop Close Button */}
        <button onClick={onClose} className="hidden md:block absolute -top-12 right-0 text-white/50 hover:text-white text-3xl transition-transform hover:rotate-90">
            <Icon name="fa-times" />
        </button>

        <div className="text-center mb-8 md:mb-10 text-white mt-4 md:mt-0">
            <h2 className="hidden md:block text-3xl font-bold mb-2">Herramientas & Utilidades</h2>
            <p className="text-white/60 text-sm md:text-base">Acceso rápido a tu ecosistema digital</p>
        </div>

        {/* Circular/Grid Hybrid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 justify-items-center pb-20 md:pb-0">
            {allTools.map((tool, idx) => (
                <a 
                    key={idx} 
                    href={tool.url} 
                    target="_blank"
                    className="flex flex-col items-center gap-3 group w-full p-2"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:scale-110 group-hover:bg-white group-hover:border-white transition-all duration-300 shadow-xl">
                        <Icon name={tool.icon} className={`text-2xl md:text-3xl ${tool.color}`} />
                    </div>
                    <span className="text-white text-xs md:text-sm font-medium group-hover:text-simple-accent transition-colors text-center">{tool.name}</span>
                </a>
            ))}

            {/* Add Button */}
            <button 
                onClick={() => setIsAdding(true)}
                className="flex flex-col items-center gap-3 group w-full p-2"
            >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-simple-600/20 rounded-full flex items-center justify-center border-2 border-dashed border-simple-500/50 group-hover:bg-simple-600 group-hover:border-simple-500 group-hover:scale-110 transition-all duration-300">
                    <Icon name="fa-plus" className="text-xl md:text-2xl text-simple-400 group-hover:text-white" />
                </div>
                <span className="text-white/50 text-xs md:text-sm font-medium group-hover:text-white transition-colors">Agregar</span>
            </button>
        </div>

        {/* Add Modal Internal */}
        {isAdding && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center p-4 md:rounded-2xl z-20 animate-scale-up">
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
                        <button onClick={() => setIsAdding(false)} className="flex-1 py-3 md:py-2 text-slate-400 hover:text-white border border-slate-600 rounded-lg">Cancelar</button>
                        <button onClick={handleAddTool} className="flex-1 py-3 md:py-2 bg-simple-600 hover:bg-simple-700 text-white rounded-lg font-bold">Guardar</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};