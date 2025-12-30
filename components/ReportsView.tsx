import React, { useState, useRef } from 'react';
import { User, Project, ProjectLog } from '../types';
import { generateText } from '../services/geminiService';
import { UploadAssistantModal } from './UploadAssistantModal';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

export const ReportsView = ({ currentUser, projects, onUpdateProject }: { currentUser: User, projects: Project[], onUpdateProject: (p: Project) => void }) => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [generalSummary, setGeneralSummary] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [newLogTexts, setNewLogTexts] = useState<{[key:string]: string}>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{file: File, projectId: string, type: 'drive' | 'github'} | null>(null);

  const allActiveProjects = projects.filter(p => p.status === 'En Curso' && (p.leadId === currentUser.id || p.teamIds?.includes(currentUser.id)));
  const displayProjects = isGlobalMode ? projects : allActiveProjects.filter(p => p.report === true);

  const toggleReportInclude = (p: Project) => onUpdateProject({ ...p, report: !p.report });

  const handleRefineWithAI = async () => {
    if (!generalSummary.trim()) return;
    setIsAiProcessing(true);
    const refined = await generateText(generalSummary, "You are a professional editor. Refine this weekly report summary to be concise, professional, and grammatically correct in Spanish.");
    setGeneralSummary(refined);
    setIsAiProcessing(false);
  };

  const handleAutoGenerate = () => {
    let draft = `RESUMEN DE AVANCES SEMANALES\n----------------------------\n\n`;
    displayProjects.forEach(p => {
        draft += `• ${p.name.toUpperCase()}:\n`;
        draft += `  - Progreso actual: ${p.progress}%\n`;
        draft += p.logs && p.logs.length > 0 ? `  - Última actividad: ${p.logs[p.logs.length - 1].text}\n` : `  - Sin novedades registradas en bitácora esta semana.\n`;
        draft += `\n`;
    });
    draft += `OBSERVACIONES GENERALES:\n- El equipo mantiene buen ritmo en los entregables.\n- Se requiere validación de cliente para fase siguiente.`;
    setGeneralSummary(draft);
  };

  const handleGlobalExport = () => {
    if (prompt("Clave CEO (1234):") === '1234') {
        setIsGlobalMode(true);
        setTimeout(() => window.print(), 800);
    } else alert("Acceso denegado.");
  };

  const handleDownloadHTML = () => {
    const htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe</title></head><body><h1>Informe ${reportDate}</h1><p>${generalSummary}</p></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_${reportDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMenuClick = (projectId: string, type: 'drive' | 'github') => {
      setActiveMenuId(activeMenuId === `${projectId}-${type}` ? null : `${projectId}-${type}`);
  };

  const triggerFileUpload = (projectId: string, type: 'drive' | 'github') => {
      if (fileInputRef.current) {
          fileInputRef.current.setAttribute('data-pid', projectId);
          fileInputRef.current.setAttribute('data-type', type);
          fileInputRef.current.click();
      }
      setActiveMenuId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const pid = e.target.getAttribute('data-pid');
      const type = e.target.getAttribute('data-type') as 'drive' | 'github';
      if (e.target.files && e.target.files[0] && pid && type) {
          setPendingUpload({
              file: e.target.files[0],
              projectId: pid,
              type: type
          });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmUpload = () => {
      if (!pendingUpload) return;
      const { file, projectId, type } = pendingUpload;
      const project = projects.find(p => p.id === projectId);
      
      if (project) {
        const targetUrl = type === 'drive' ? (project.driveLink || 'https://drive.google.com') : (project.githubLink || 'https://github.com');
        const newLog: ProjectLog = {
          id: 'up' + Date.now(),
          date: new Date().toISOString(),
          text: `✅ ARCHIVO CARGADO: ${file.name} (Ver en ${type === 'drive' ? 'Drive' : 'GitHub'}) - ${targetUrl}`,
          author: currentUser.name
        };
        onUpdateProject({ ...project, logs: [...(project.logs || []), newLog] });
      }
      setPendingUpload(null);
  };

  const handleInlineAddLog = (projectId: string) => {
    const text = newLogTexts[projectId];
    if (!text?.trim()) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newLog: ProjectLog = { id: 'log' + Date.now(), date: new Date().toISOString(), text: text, author: currentUser.name };
    onUpdateProject({ ...project, logs: [...(project.logs || []), newLog] });
    setNewLogTexts(prev => ({ ...prev, [projectId]: '' }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-24 md:pb-0">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {pendingUpload && (
           <UploadAssistantModal 
              file={pendingUpload.file} 
              project={projects.find(p => p.id === pendingUpload.projectId)!} 
              type={pendingUpload.type} 
              onClose={() => setPendingUpload(null)} 
              onConfirm={handleConfirmUpload} 
           />
       )}

      <style>{`
        @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; border: none; box-shadow: none; }
            .no-print { display: none !important; }
        }
      `}</style>

      {/* Control Panel - Mobile Friendly */}
      <div className="lg:col-span-1 space-y-6 print:hidden order-2 lg:order-1">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-simple-900 mb-4">Configuración</h2>
            <div className="space-y-4">
               {isGlobalMode && (
                   <div className="bg-slate-800 text-white p-3 rounded-lg text-sm mb-4">
                       <p className="font-bold"><Icon name="fa-globe" /> GLOBAL (CEO)</p>
                       <button onClick={() => setIsGlobalMode(false)} className="mt-2 text-xs underline text-blue-300">Salir</button>
                   </div>
               )}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                  <input type="date" className="w-full border p-2 rounded-lg" value={reportDate} onChange={e => setReportDate(e.target.value)} />
               </div>
               
               {!isGlobalMode && (
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Incluir Proyectos</label>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
                     {allActiveProjects.length > 0 ? allActiveProjects.map(p => (
                        <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded">
                           <input type="checkbox" checked={p.report} onChange={() => toggleReportInclude(p)} className="rounded text-simple-600 focus:ring-simple-500" />
                           <span className="truncate">{p.name}</span>
                        </label>
                     )) : <p className="text-xs text-slate-400 italic">Sin proyectos activos.</p>}
                  </div>
               </div>
               )}

               <button onClick={handleAutoGenerate} className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-2 font-medium text-sm">
                  <Icon name="fa-magic" /> Autogenerar Texto
               </button>
               <hr />
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => window.print()} className="py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex flex-col items-center justify-center gap-1 text-xs">
                     <Icon name="fa-print" className="text-lg" /> PDF
                  </button>
                  <button onClick={handleDownloadHTML} className="py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex flex-col items-center justify-center gap-1 text-xs">
                     <Icon name="fa-file-code" className="text-lg" /> HTML
                  </button>
               </div>
               <button onClick={handleGlobalExport} className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-black text-xs uppercase tracking-wider">
                  <Icon name="fa-globe" /> Exportar Global
               </button>
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-bold text-slate-900">Resumen</label>
               <button onClick={handleRefineWithAI} disabled={isAiProcessing} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1">
                  {isAiProcessing ? <Icon name="fa-spinner" className="fa-spin" /> : <Icon name="fa-magic" />} Mejorar
               </button>
            </div>
            <textarea 
               className="w-full border p-3 rounded-lg h-40 text-sm focus:ring-2 focus:ring-simple-500 outline-none resize-none"
               placeholder="Resumen ejecutivo..."
               value={generalSummary}
               onChange={e => setGeneralSummary(e.target.value)}
            ></textarea>
         </div>
      </div>

      {/* Report Preview */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-slate-200 p-8 min-h-[800px] print-area relative order-1 lg:order-2">
         <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 uppercase tracking-wide">{isGlobalMode ? 'REPORTE CORPORATIVO' : 'INFORME DE ACTIVIDADES'}</h1>
            <p className="text-slate-500 mt-2">SimpleData Spa</p>
         </div>

         <div className="flex justify-between mb-8 text-sm">
            <div>
               <p className="text-xs text-slate-400 uppercase font-bold">Autor</p>
               <p className="font-medium text-slate-900">{isGlobalMode ? 'CEO' : currentUser.name}</p>
            </div>
            <div className="text-right">
               <p className="text-xs text-slate-400 uppercase font-bold">Semana</p>
               <p className="font-medium text-slate-900">{reportDate}</p>
            </div>
         </div>

         {generalSummary && (
            <div className="mb-8 bg-slate-50 p-4 rounded-lg">
               <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Resumen</h3>
               <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{generalSummary}</p>
            </div>
         )}

         <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase bg-slate-100 p-2 rounded mb-4">Detalle de Proyectos</h3>
            {displayProjects.length === 0 ? (
               <p className="text-center text-slate-400 italic py-8">Sin proyectos seleccionados.</p>
            ) : (
               <div className="space-y-8">
                  {displayProjects.map(project => (
                     <div key={project.id} className="border-l-4 border-simple-600 pl-4">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-2">
                           <div>
                              <h4 className="text-lg font-bold text-slate-900">{project.name}</h4>
                              <p className="text-sm text-slate-500">{project.client} • {project.progress}%</p>
                           </div>
                           
                           {/* Simplified Action Buttons for Report View */}
                           <div className="flex gap-2 text-xs no-print w-full md:w-auto">
                              <button onClick={() => triggerFileUpload(project.id, 'drive')} className="flex-1 md:flex-none flex justify-center items-center gap-1 bg-green-50 text-green-700 px-3 py-2 rounded border border-green-200">
                                  <Icon name="fab fa-google-drive" /> <span className="md:hidden">Drive</span>
                              </button>
                              <button onClick={() => triggerFileUpload(project.id, 'github')} className="flex-1 md:flex-none flex justify-center items-center gap-1 bg-slate-50 text-slate-700 px-3 py-2 rounded border border-slate-200">
                                  <Icon name="fab fa-github" /> <span className="md:hidden">Git</span>
                              </button>
                           </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 mt-3 border border-slate-100">
                           <ul className="space-y-2 mb-3">
                                 {[...project.logs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(log => (
                                    <li key={log.id} className="text-sm text-slate-700 break-words flex gap-2">
                                        <span className="font-mono text-xs text-slate-500 shrink-0">{new Date(log.date).toLocaleDateString()}</span>
                                        <span>{log.text}</span>
                                    </li>
                                 ))}
                           </ul>
                           <div className="flex gap-2 no-print">
                               <input 
                                   className="flex-1 text-xs border p-2 rounded" 
                                   placeholder="Agregar bitácora..."
                                   value={newLogTexts[project.id] || ''}
                                   onChange={e => setNewLogTexts({...newLogTexts, [project.id]: e.target.value})}
                                   onKeyPress={e => e.key === 'Enter' && handleInlineAddLog(project.id)}
                               />
                               <button onClick={() => handleInlineAddLog(project.id)} className="bg-slate-200 px-3 rounded text-slate-600"><Icon name="fa-plus" /></button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
};