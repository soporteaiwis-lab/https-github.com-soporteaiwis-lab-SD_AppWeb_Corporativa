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
  const [showEditModal, setShowEditModal] = useState(false); // State for Edit Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filters, setFilters] = useState({ name: '', client: '', jp: '', year: '', status: '' });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{file: File, projectId: string, type: 'drive' | 'github'} | null>(null);

  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', client: '', status: 'En Curso', progress: 0, description: '', driveLink: '', githubLink: 'https://github.com/soporteaiwis-lab/SIMPLEDATA-APP'
  });

  // Edit Project State
  const [editProjectData, setEditProjectData] = useState<Partial<Project>>({});

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

  const handleOpenEdit = (p: Project) => {
    setSelectedProject(p);
    setEditProjectData({ ...p });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (selectedProject && editProjectData) {
      onUpdateProject({ ...selectedProject, ...editProjectData });
      setShowEditModal(false);
    }
  };

  const toggleReport = (project: Project) => {
    onUpdateProject({ ...project, report: !project.report });
  };

  const triggerUpload = (projectId: string, type: 'drive' | 'github') => {
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

  const handleMenuClick = (id: string) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleOpenLog = (p: Project) => { setSelectedProject(p); setShowLogModal(true); };
  const handleOpenTeam = (p: Project) => { setSelectedProject(p); setShowTeamModal(true); };
  const handleOpenReq = (p: Project) => { setSelectedProject(p); setShowReqModal(true); };
  const handleSaveTeam = () => { if (selectedProject) { onUpdateProject(selectedProject); setShowTeamModal(false); }};
  const handleToggleTeamMember = (id: string) => { 
      if (!selectedProject) return;
      const currentIds = selectedProject.teamIds || [];
      const newIds = currentIds.includes(id) ? currentIds.filter(uid => uid !== id) : [...currentIds, id];
      setSelectedProject({ ...selectedProject, teamIds: newIds }); 
  };

  const filteredProjects = projects.filter(p => {
    const matchName = p.name.toLowerCase().includes(filters.name.toLowerCase()) || p.id.toLowerCase().includes(filters.name.toLowerCase());
    const matchClient = p.client.toLowerCase().includes(filters.client.toLowerCase());
    const matchYear = filters.year ? p.year.toString().includes(filters.year) : true;
    const matchStatus = filters.status ? p.status === filters.status : true;
    return matchName && matchClient && matchYear && matchStatus;
  });

  return (
    <div className="space-y-6 print:hidden pb-24 lg:pb-0">
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

       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-2xl font-bold text-simple-900">Gestión de Proyectos</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full lg:w-auto bg-simple-600 hover:bg-simple-700 text-white px-4 py-3 lg:py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
        >
          <Icon name="fa-plus" className="mr-2" /> Nuevo Proyecto
        </button>
      </div>

      {/* --- DESKTOP TABLE VIEW (Hidden on Mobile) --- */}
      {/* CAMBIO CLAVE: hidden lg:block */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold text-slate-700 w-1/4">Proyecto</th>
                <th className="p-3 font-semibold text-slate-700 w-1/5">Cliente</th>
                <th className="p-3 font-semibold text-slate-700 text-center w-32">Equipo</th>
                <th className="p-3 font-semibold text-slate-700 w-32">Fechas</th>
                <th className="p-3 font-semibold text-slate-700 text-center w-24">Estado</th>
                <th className="p-3 font-semibold text-slate-700 text-center w-28">Repositorios</th>
                <th className="p-3 font-semibold text-slate-700 text-center w-32">Acciones</th>
              </tr>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="p-2"><input className="w-full border rounded px-2 py-1 text-xs font-normal" placeholder="Filtrar..." value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} /></th>
                <th className="p-2"><input className="w-full border rounded px-2 py-1 text-xs font-normal" placeholder="Filtrar..." value={filters.client} onChange={e => setFilters({...filters, client: e.target.value})} /></th>
                <th colSpan={2} className="p-2"></th>
                <th className="p-2">
                   <select className="w-full border rounded px-1 py-1 text-xs font-normal" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                      <option value="">Todos</option>
                      <option value="En Curso">En Curso</option>
                      <option value="Finalizado">Finalizado</option>
                   </select>
                </th>
                <th colSpan={2} className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map(project => {
                const lead = users.find(u => u.id === project.leadId);
                return (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-mono font-bold hidden xl:block">{project.id.replace('PROYECTO_', 'P')}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate" title={project.name}>{project.name}</p>
                          <button onClick={() => handleOpenReq(project)} className="text-simple-600 hover:underline text-xs flex items-center gap-1">
                            <Icon name="fa-file-alt" /> Ver Resumen
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-middle">
                      <p className="font-medium text-slate-800 text-sm truncate" title={project.client}>{project.client}</p>
                      <p className="text-xs text-slate-500 truncate">{project.encargadoCliente || 'N/A'}</p>
                    </td>
                    <td className="p-3 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <button onClick={() => handleOpenTeam(project)} className="w-8 h-8 rounded-full bg-white text-slate-500 border border-slate-300 hover:bg-slate-100 flex items-center justify-center transition-colors">
                          <Icon name="fa-users-cog" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-600 align-middle">
                      <div className="whitespace-nowrap"><strong>In:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</div>
                      <div className="whitespace-nowrap"><strong>Fin:</strong> {new Date(project.deadline).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3 text-center align-middle">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        project.status === 'En Curso' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {project.status === 'En Curso' ? 'Activo' : 'Fin'}
                      </span>
                    </td>
                    <td className="p-3 text-center align-middle relative">
                       <div className="flex justify-center gap-2">
                          <div className="relative">
                            <button 
                                onClick={() => handleMenuClick(`${project.id}-drive`)}
                                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${project.driveLink ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-slate-100 text-slate-300'}`}
                            >
                                <Icon name="fab fa-google-drive" />
                            </button>
                            {activeMenuId === `${project.id}-drive` && (
                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-[100] text-left overflow-hidden">
                                    <a href={project.driveLink || 'https://drive.google.com'} target="_blank" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 border-b"><Icon name="fa-external-link-alt" className="mr-2" /> Abrir Drive</a>
                                    <button onClick={() => triggerUpload(project.id, 'drive')} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 border-b"><Icon name="fa-upload" className="mr-2" /> Subir Archivo...</button>
                                </div>
                            )}
                          </div>
                          <div className="relative">
                            <button 
                                onClick={() => handleMenuClick(`${project.id}-github`)}
                                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${project.githubLink ? 'bg-slate-800 text-white hover:bg-black' : 'bg-slate-100 text-slate-300'}`}
                            >
                                <Icon name="fab fa-github" />
                            </button>
                            {activeMenuId === `${project.id}-github` && (
                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-[100] text-left overflow-hidden">
                                    <a href={project.githubLink || 'https://github.com'} target="_blank" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 border-b"><Icon name="fa-external-link-alt" className="mr-2" /> Abrir Repo</a>
                                    <button onClick={() => triggerUpload(project.id, 'github')} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 border-b"><Icon name="fa-upload" className="mr-2" /> Subir Archivo...</button>
                                </div>
                            )}
                          </div>
                       </div>
                    </td>
                    <td className="p-3 text-center align-middle">
                      <div className="flex justify-center items-center gap-2">
                         <button onClick={() => handleOpenEdit(project)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Editar"><Icon name="fa-pen" /></button>
                        <button onClick={() => handleOpenLog(project)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Bitácora"><Icon name="fa-history" /></button>
                        <button onClick={() => onDeleteProject(project.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar"><Icon name="fa-trash-alt" /></button>
                        {project.isOngoing && (
                          <div className="flex items-center">
                            <input type="checkbox" checked={project.report} onChange={() => toggleReport(project)} className="w-4 h-4 text-simple-600 rounded cursor-pointer" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW (Visible only on Mobile) --- */}
      {/* CAMBIO CLAVE: lg:hidden */}
      <div className="lg:hidden space-y-4">
        {filteredProjects.map(project => (
           <div key={project.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{project.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{project.client}</p>
                 </div>
                 <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${project.status === 'En Curso' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {project.status === 'En Curso' ? 'Activo' : 'Fin'}
                 </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                 <div>
                    <span className="block text-slate-400 font-bold uppercase">Inicio</span>
                    {new Date(project.startDate || '').toLocaleDateString()}
                 </div>
                 <div>
                    <span className="block text-slate-400 font-bold uppercase">Fin</span>
                    {new Date(project.deadline).toLocaleDateString()}
                 </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                 <div className="flex gap-2">
                     <button onClick={() => handleMenuClick(`${project.id}-drive`)} className={`w-10 h-10 rounded-lg flex items-center justify-center border ${project.driveLink ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-300 border-slate-200'}`}>
                        <Icon name="fab fa-google-drive" className="text-lg" />
                     </button>
                     <button onClick={() => handleMenuClick(`${project.id}-github`)} className={`w-10 h-10 rounded-lg flex items-center justify-center border ${project.githubLink ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-50 text-slate-300 border-slate-200'}`}>
                        <Icon name="fab fa-github" className="text-lg" />
                     </button>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(project)} className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center">
                        <Icon name="fa-pen" />
                    </button>
                    <button onClick={() => handleOpenLog(project)} className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center">
                        <Icon name="fa-history" />
                    </button>
                    <button onClick={() => onDeleteProject(project.id)} className="w-10 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center">
                        <Icon name="fa-trash" />
                    </button>
                 </div>
              </div>

              {/* Mobile Dropdowns for Drive/Github */}
              {activeMenuId === `${project.id}-drive` && (
                  <div className="bg-green-50 rounded-lg p-2 animate-fade-in border border-green-100">
                      <a href={project.driveLink || 'https://drive.google.com'} target="_blank" className="block p-2 text-xs text-green-800 font-medium border-b border-green-200/50"><Icon name="fa-external-link-alt" className="mr-2" /> Abrir Drive</a>
                      <button onClick={() => triggerUpload(project.id, 'drive')} className="w-full text-left p-2 text-xs text-green-800"><Icon name="fa-upload" className="mr-2" /> Subir Archivo...</button>
                  </div>
              )}
              {activeMenuId === `${project.id}-github` && (
                  <div className="bg-slate-100 rounded-lg p-2 animate-fade-in border border-slate-200">
                      <a href={project.githubLink || 'https://github.com'} target="_blank" className="block p-2 text-xs text-slate-800 font-medium border-b border-slate-200"><Icon name="fa-external-link-alt" className="mr-2" /> Abrir Repo</a>
                      <button onClick={() => triggerUpload(project.id, 'github')} className="w-full text-left p-2 text-xs text-slate-800"><Icon name="fa-upload" className="mr-2" /> Subir Archivo...</button>
                  </div>
              )}
           </div>
        ))}
      </div>
      
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[600px] shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4">Nuevo Proyecto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input className="border p-2 rounded" placeholder="Nombre" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                <input className="border p-2 rounded" placeholder="Cliente" value={newProject.client} onChange={e => setNewProject({...newProject, client: e.target.value})} />
                <input className="border p-2 rounded" placeholder="Drive URL" value={newProject.driveLink} onChange={e => setNewProject({...newProject, driveLink: e.target.value})} />
                <input className="border p-2 rounded" placeholder="GitHub URL" value={newProject.githubLink} onChange={e => setNewProject({...newProject, githubLink: e.target.value})} />
            </div>
            <textarea className="w-full border p-2 rounded mb-4" placeholder="Descripción" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
            <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500">Cancelar</button>
                <button onClick={handleCreate} className="px-4 py-2 bg-simple-600 text-white rounded">Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - New Feature */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[600px] shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Icon name="fa-pen" /> Editar Proyecto</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                    <input className="w-full border p-2 rounded" value={editProjectData.name} onChange={e => setEditProjectData({...editProjectData, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                    <input className="w-full border p-2 rounded" value={editProjectData.client} onChange={e => setEditProjectData({...editProjectData, client: e.target.value})} />
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-sm mb-3">Enlaces de Repositorios</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><Icon name="fab fa-google-drive" /> Drive URL</label>
                            <input className="w-full border p-2 rounded text-sm" placeholder="https://drive.google.com/..." value={editProjectData.driveLink} onChange={e => setEditProjectData({...editProjectData, driveLink: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><Icon name="fab fa-github" /> GitHub URL</label>
                            <input className="w-full border p-2 rounded text-sm" placeholder="https://github.com/..." value={editProjectData.githubLink} onChange={e => setEditProjectData({...editProjectData, githubLink: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-500">Cancelar</button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-simple-600 text-white rounded font-bold">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {showLogModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-[600px] h-[500px] shadow-2xl flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="font-bold">Bitácora: {selectedProject.name}</h3>
                      <button onClick={()=>setShowLogModal(false)}><Icon name="fa-times"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {selectedProject.logs?.map(log => (
                        <div key={log.id} className="bg-slate-50 p-3 rounded text-sm">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>{new Date(log.date).toLocaleDateString()}</span>
                                <span>{log.author}</span>
                            </div>
                            <p>{log.text}</p>
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};