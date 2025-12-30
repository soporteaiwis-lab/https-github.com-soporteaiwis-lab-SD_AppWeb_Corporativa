import React from 'react';
import { User, Project } from '../types';
import { APP_CONFIG } from '../constants'; // Import to check status

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

export const Dashboard = ({ currentUser, projects }: { currentUser: User, projects: Project[] }) => {
  const activeProjects = projects.filter(p => p.status === 'En Curso');
  
  // Check System Status
  const isGeminiReady = !!APP_CONFIG.GEMINI_API_KEY && APP_CONFIG.GEMINI_API_KEY.length > 5;
  const isGithubReady = !!APP_CONFIG.GITHUB_TOKEN && APP_CONFIG.GITHUB_TOKEN.length > 5;

  return (
    <div className="space-y-6 animate-fade-in print:hidden pb-20 lg:pb-0">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-2">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-simple-900">Hola, {currentUser.name.split(' ')[0]}</h2>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">Bienvenido al ecosistema corporativo SimpleData.</p>
        </div>
        <div className="flex gap-4">
             {/* System Status Widget */}
             <div className="hidden md:flex gap-3 bg-white p-2 px-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2" title={isGeminiReady ? "Gemini AI: Conectado" : "Gemini AI: Sin Llave (.env)"}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isGeminiReady ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                    <span className="text-xs font-bold text-slate-600">AI</span>
                </div>
                <div className="w-[1px] bg-slate-200"></div>
                <div className="flex items-center gap-2" title={isGithubReady ? "GitHub API: Token Configurado" : "GitHub API: Manual (.env)"}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isGithubReady ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                    <span className="text-xs font-bold text-slate-600">Git</span>
                </div>
             </div>
             
             <div className="text-left lg:text-right w-full lg:w-auto self-center">
                <p className="text-xs lg:text-sm font-medium text-slate-400">{new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
             </div>
        </div>
      </header>

      {/* Google Integrations Bar - Optimized for Mobile (No Scrolling) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6">
        <h3 className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Integraciones Google Workspace</h3>
        {/* GRID LAYOUT: 2 cols on mobile, 4 on desktop. No scrolling. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <a href="https://meet.google.com" target="_blank" className="flex items-center gap-3 p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-100">
             <Icon name="fa-video" className="text-xl" />
             <span className="font-semibold text-sm">Meet</span>
          </a>
          <a href="https://mail.google.com" target="_blank" className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-100">
             <Icon name="fa-envelope" className="text-xl" />
             <span className="font-semibold text-sm">Gmail</span>
          </a>
          <a href="https://calendar.google.com" target="_blank" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100">
             <Icon name="fa-calendar-alt" className="text-xl" />
             <span className="font-semibold text-sm">Calendar</span>
          </a>
          <a href="https://drive.google.com" target="_blank" className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors border border-yellow-100">
             <Icon name="fa-google-drive" className="text-xl" /> 
             <span className="font-semibold text-sm">Drive</span>
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Icon name="fa-layer-group" className="text-xl" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-simple-900">{activeProjects.length}</h3>
          <p className="text-slate-500 text-sm">Proyectos Activos</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Icon name="fa-clock" className="text-xl" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-simple-900">En Curso</h3>
          <p className="text-slate-500 text-sm">Estado General</p>
        </div>

        <div className="bg-gradient-to-br from-simple-600 to-simple-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Icon name="fa-wand-magic-sparkles" className="text-xl" />
            </div>
             <div className="flex gap-1">
                 {isGeminiReady && <span title="AI Conectada" className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>}
             </div>
          </div>
          <h3 className="text-lg font-bold mb-1">SimpleData AI</h3>
          <p className="text-white/80 text-sm">{isGeminiReady ? 'Conexión segura establecida.' : 'Modo Offline (Sin API Key)'}</p>
        </div>
      </div>
    </div>
  );
};