import React, { useState, useRef } from 'react';
import { Project, User, UserRole, ProjectLog } from '../types';
import { UploadAssistantModal } from './UploadAssistantModal';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

export const ProjectsView = ({ 
  projects, 
  users, 
  currentUser,
  onAddProject, 
  onDeleteProject,
  onUpdateProject
}: { 
  projects: Project[], 
  users: User[],
  currentUser: User,
  onAddProject: (p: Project) => void,
  onDeleteProject: (id: string) => void,
  onUpdateProject: (p: Project) => void
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filters, setFilters] = useState({ name: '', client: '', jp: '', year: '', status: '' });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{file: File, projectId: string, type: 'drive' | 'github'} | null>(null);

  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', client: '', status: 'En Curso', progress: 0, description: '', driveLink: '', githubLink: 'https://github.com/soporteaiwis-lab/SIMPLEDATA-APP'
  });

  const [editProjectData, setEditProjectData] = useState<Partial<Project>>({});

  // --- Handlers ---
  const handleCreate = () => {
    if (!newProject.name || !newProject.client) return;
    const project: Project = {
      id: 'PROYECTO_' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      name: newProject.name,
      client: newProject.client,
      encargadoCliente: newProject.encargadoCliente || 'Sin Asignar',
      status: newProject.status as any,
      description: newProject.description || '',
      progress: newProject.progress || 0,
      deadline: newProject.deadline || new Date().toISOString(),
      startDate: newProject.startDate || new Date().toISOString(),
      leadId: newProject.leadId || users[0].id,
      teamIds: [],
      technologies: [],
      isOngoing: newProject.status === 'En Curso',
      report: newProject.status === 'En Curso',
      year: parseInt(newProject.year as any) || new Date().getFullYear(),
      logs: [],
      driveLink: newProject.driveLink || '',
      githubLink: newProject.githubLink || ''
    };
    onAddProject(project);
    setShowCreateModal(false);
    setNewProject({ name: '', client: '', status: 'En Curso', progress: 0, description: '', driveLink: '', githubLink: 'https://github.com/soporteaiwis-lab/SIMPLEDATA-APP' });
  };

  const handleOpenEdit = (p: Project) => { setSelectedProject(p); setEditProjectData({ ...p }); setShowEditModal(true); };
  const handleUpdate = () => { if (selectedProject && editProjectData) { onUpdateProject({ ...selectedProject, ...editProjectData }); setShowEditModal(false); } };
  const toggleReport = (project: Project) => { onUpdateProject({ ...project, report: !project.report }); };
  const triggerUpload = (projectId: string, type: 'drive' | 'github') => { if (fileInputRef.current) { fileInputRef.current.setAttribute('data-pid', projectId); fileInputRef.current.setAttribute('data-type', type); fileInputRef.current.click(); } setActiveMenuId(null); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pid = e.target.getAttribute('data-pid'); const type = e.target.getAttribute('data-type') as 'drive' | 'github';
    if (e.target.files && e.target.files[0] && pid && type) { setPendingUpload({ file: e.target.files[0], projectId: pid, type: type }); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleConfirmUpload = () => {
      if (!pendingUpload) return;
      const { file, projectId, type } = pendingUpload;
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const targetUrl = type === 'drive' ? (project.driveLink || 'https://drive.google.com') : (project.githubLink || 'https://github.com');
        const newLog: ProjectLog = { id: 'up' + Date.now(), date: new Date().toISOString(), text: `✅ ARCHIVO CARGADO: ${file.name} (Ver en ${type === 'drive' ? 'Drive' : 'GitHub'}) - ${targetUrl}`, author: currentUser.name };
        onUpdateProject({ ...project, logs: [...(project.logs || []), newLog] });
      }
      setPendingUpload(null);
  };
  const handleMenuClick = (id: string) => { setActiveMenuId(activeMenuId === id ? null : id); };
  
  const handleOpenLog = (p: Project) => { setSelectedProject(p); setShowLogModal(true); };
  const handleOpenTeam = (p: Project) => { setSelectedProject(p); setShowTeamModal(true); };
  const handleOpenReq = (p: Project) => { setSelectedProject(p); setShowReqModal(true); };
  
  const handleToggleTeamMember = (id: string) => { 
      if (!selectedProject) return;
      const currentIds = selectedProject.teamIds || [];
      const newIds = currentIds.includes(id) ? currentIds.filter(uid => uid !== id) : [...currentIds, id];
      const updatedProject = { ...selectedProject, teamIds: newIds };
      setSelectedProject(updatedProject); 
      onUpdateProject(updatedProject);
  };

  const filteredProjects = projects.filter(p => {
    const matchName = p.name.toLowerCase().includes(filters.name.toLowerCase()) || p.id.toLowerCase().includes(filters.name.toLowerCase());
    return matchName && p.client.toLowerCase().includes(filters.client.toLowerCase()) && (filters.status ? p.status === filters.status : true);
  });

  return (
    <div className="space-y-6 print:hidden pb-24 lg:pb-0">
       <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
       {pendingUpload && <UploadAssistantModal file={pendingUpload.file} project={projects.find(p => p.id === pendingUpload.projectId)!} type={pendingUpload.type} onClose={() => setPendingUpload(null)} onConfirm={handleConfirmUpload} />}

       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-2xl font-bold text-simple-900">Gestión de Proyectos</h2>
        <button onClick={() => setShowCreateModal(true)} className="w-full lg:w-auto bg-simple-600 hover:bg-simple-700 text-white px-4 py-3 lg:py-2 rounded-lg text-sm font-medium transition-colors shadow-md flex items-center justify-center">
          <Icon name="fa-plus" className="mr-2" /> Nuevo Proyecto
        </button>
      </div>

      {/* --- DESKTOP TABLE VIEW (Hidden on Mobile) --- */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 w-1/4">Proyecto</th> <th className="p-3 w-1/5">Cliente</th> <th className="p-3 text-center w-24">Equipo</th> <th className="p-3 w-32">Fechas</th> <th className="p-3 text-center w-24">Estado</th> <th className="p-3 text-center w-28">Repos</th> <th className="p-3 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="p-3"><div className="font-bold truncate">{project.name}</div><button onClick={()=>handleOpenReq(project)} className="text-xs text-blue-500 hover:underline">Ver Resumen</button></td>
                    <td className="p-3"><div className="truncate">{project.client}</div></td>
                    <td className="p-3 text-center"><button onClick={()=>handleOpenTeam(project)} className="w-8 h-8 rounded-full border hover:bg-slate-100"><Icon name="fa-users-cog"/></button></td>
                    <td className="p-3 text-xs"><div>In: {new Date(project.startDate || '').toLocaleDateString()}</div><div>Fin: {new Date(project.deadline).toLocaleDateString()}</div></td>
                    <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${project.status === 'En Curso'?'bg-green-100 text-green-700':'bg-slate-100'}`}>{project.status==='En Curso'?'Activo':'Fin'}</span></td>
                    <td className="p-3 text-center"><div className="flex justify-center gap-1"><button onClick={()=>triggerUpload(project.id,'drive')} className="p-1"><Icon name="fab fa-google-drive" className={project.driveLink?'text-green-600':'text-slate-300'}/></button><button onClick={()=>triggerUpload(project.id,'github')} className="p-1"><Icon name="fab fa-github" className={project.githubLink?'text-black':'text-slate-300'}/></button></div></td>
                    <td className="p-3 text-center"><div className="flex justify-center gap-1"><button onClick={()=>handleOpenEdit(project)} className="p-1.5 hover:bg-slate-100 rounded"><Icon name="fa-pen"/></button><button onClick={()=>handleOpenLog(project)} className="p-1.5 hover:bg-slate-100 rounded text-blue-500"><Icon name="fa-history"/></button><button onClick={()=>onDeleteProject(project.id)} className="p-1.5 hover:bg-slate-100 rounded text-red-500"><Icon name="fa-trash"/></button></div></td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW (Full Features) --- */}
      <div className="lg:hidden space-y-4">
        {filteredProjects.map(project => (
           <div key={project.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                 <div className="flex-1 mr-2">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{project.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{project.client}</p>
                 </div>
                 <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${project.status === 'En Curso' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {project.status === 'En Curso' ? 'Activo' : 'Fin'}
                 </span>
              </div>
              
              {/* Feature Buttons Row */}
              <div className="flex gap-2 my-1">
                  <button onClick={() => handleOpenTeam(project)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100">
                      <Icon name="fa-users" /> Equipo
                  </button>
                  <button onClick={() => handleOpenReq(project)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100">
                      <Icon name="fa-file-alt" /> Resumen
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                 <div><span className="block text-slate-400 font-bold uppercase">Inicio</span>{new Date(project.startDate || '').toLocaleDateString()}</div>
                 <div><span className="block text-slate-400 font-bold uppercase">Fin</span>{new Date(project.deadline).toLocaleDateString()}</div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                 <div className="flex gap-2">
                     <button onClick={() => handleMenuClick(`${project.id}-drive`)} className={`w-10 h-10 rounded-lg flex items-center justify-center border ${project.driveLink ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-300 border-slate-200'}`}><Icon name="fab fa-google-drive" className="text-lg" /></button>
                     <button onClick={() => handleMenuClick(`${project.id}-github`)} className={`w-10 h-10 rounded-lg flex items-center justify-center border ${project.githubLink ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-50 text-slate-300 border-slate-200'}`}><Icon name="fab fa-github" className="text-lg" /></button>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(project)} className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><Icon name="fa-pen" /></button>
                    <button onClick={() => handleOpenLog(project)} className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Icon name="fa-history" /></button>
                    <button onClick={() => onDeleteProject(project.id)} className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Icon name="fa-trash" /></button>
                 </div>
              </div>
              {/* Dropdowns (Same as before) */}
              {activeMenuId === `${project.id}-drive` && (<div className="bg-green-50 rounded-lg p-2 animate-fade-in"><a href={project.driveLink || '#'} target="_blank" className="block p-2 text-xs font-bold text-green-800">Abrir Drive</a><button onClick={()=>triggerUpload(project.id,'drive')} className="block w-full text-left p-2 text-xs text-green-800">Subir Archivo...</button></div>)}
           </div>
        ))}
      </div>
      
      {/* --- MODALS (Full Screen on Mobile) --- */}
      
      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-[60] bg-white md:bg-black/50 flex flex-col md:justify-center md:items-center">
          <div className="w-full h-full md:h-auto md:max-w-[600px] bg-white md:rounded-2xl flex flex-col shadow-2xl">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50 md:bg-white md:rounded-t-2xl">
                <h3 className="text-lg font-bold">{showEditModal ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
                <button onClick={() => {setShowCreateModal(false); setShowEditModal(false);}} className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full"><Icon name="fa-times"/></button>
             </div>
             <div className="p-6 overflow-y-auto flex-1 space-y-4">
                 <input className="w-full border p-3 rounded-lg" placeholder="Nombre Proyecto" value={showEditModal ? editProjectData.name : newProject.name} onChange={e => showEditModal ? setEditProjectData({...editProjectData, name: e.target.value}) : setNewProject({...newProject, name: e.target.value})} />
                 <input className="w-full border p-3 rounded-lg" placeholder="Cliente" value={showEditModal ? editProjectData.client : newProject.client} onChange={e => showEditModal ? setEditProjectData({...editProjectData, client: e.target.value}) : setNewProject({...newProject, client: e.target.value})} />
                 <textarea className="w-full border p-3 rounded-lg h-32" placeholder="Descripción" value={showEditModal ? editProjectData.description : newProject.description} onChange={e => showEditModal ? setEditProjectData({...editProjectData, description: e.target.value}) : setNewProject({...newProject, description: e.target.value})} />
             </div>
             <div className="p-4 border-t bg-slate-50 md:rounded-b-2xl">
                <button onClick={showEditModal ? handleUpdate : handleCreate} className="w-full py-3 bg-simple-600 text-white font-bold rounded-lg shadow-lg">Guardar</button>
             </div>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && selectedProject && (
          <div className="fixed inset-0 z-[60] bg-white md:bg-black/50 flex flex-col md:justify-center md:items-center">
              <div className="w-full h-full md:h-[600px] md:max-w-[600px] bg-white md:rounded-2xl flex flex-col shadow-2xl">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">Bitácora</h3>
                      <button onClick={()=>setShowLogModal(false)} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><Icon name="fa-times"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {selectedProject.logs?.length === 0 && <p className="text-center text-slate-400 mt-10">Sin registros.</p>}
                    {selectedProject.logs?.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">
                                <span>{new Date(log.date).toLocaleDateString()}</span>
                                <span>{log.author}</span>
                            </div>
                            <p className="text-slate-800 text-sm leading-relaxed">{log.text}</p>
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      )}

      {/* Team Modal */}
      {showTeamModal && selectedProject && (
          <div className="fixed inset-0 z-[60] bg-white md:bg-black/50 flex flex-col md:justify-center md:items-center">
              <div className="w-full h-full md:h-[600px] md:max-w-[500px] bg-white md:rounded-2xl flex flex-col shadow-2xl">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">Asignar Equipo</h3>
                      <button onClick={()=>setShowTeamModal(false)} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><Icon name="fa-times"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                     {users.map(u => {
                         const isSelected = selectedProject.teamIds.includes(u.id);
                         return (
                             <div key={u.id} onClick={() => handleToggleTeamMember(u.id)} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'bg-simple-50 border-simple-200' : 'bg-white border-slate-100'}`}>
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-simple-600 border-simple-600' : 'border-slate-300'}`}>
                                     {isSelected && <Icon name="fa-check" className="text-white text-xs"/>}
                                 </div>
                                 <img src={u.avatar} className="w-8 h-8 rounded-full" />
                                 <div>
                                     <p className="font-bold text-sm">{u.name}</p>
                                     <p className="text-xs text-slate-500">{u.role}</p>
                                 </div>
                             </div>
                         )
                     })}
                  </div>
              </div>
          </div>
      )}

      {/* Requirements/Summary Modal */}
      {showReqModal && selectedProject && (
          <div className="fixed inset-0 z-[60] bg-white md:bg-black/50 flex flex-col md:justify-center md:items-center">
              <div className="w-full h-full md:h-auto md:max-w-[600px] bg-white md:rounded-2xl flex flex-col shadow-2xl">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">Resumen Proyecto</h3>
                      <button onClick={()=>setShowReqModal(false)} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><Icon name="fa-times"/></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                      <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Descripción General</h4>
                      <p className="text-slate-800 text-lg leading-relaxed mb-6">{selectedProject.description}</p>
                      
                      <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Tecnologías</h4>
                      <div className="flex flex-wrap gap-2 mb-6">
                          {selectedProject.technologies.map(t => (
                              <span key={t} className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">{t}</span>
                          ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-xl">
                              <p className="text-green-800 font-bold text-2xl">{selectedProject.progress}%</p>
                              <p className="text-green-600 text-xs font-bold uppercase">Progreso Global</p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-xl">
                              <p className="text-blue-800 font-bold text-2xl">{selectedProject.logs.length}</p>
                              <p className="text-blue-600 text-xs font-bold uppercase">Entradas Bitácora</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};