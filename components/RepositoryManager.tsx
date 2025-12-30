import React, { useState, useRef, useEffect } from 'react';
import { Project, Repository, ProjectLog } from '../types';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

interface RepositoryManagerProps {
  project: Project;
  initialType: 'github' | 'drive';
  onClose: () => void;
  onUpdateProject: (p: Project) => void;
  currentUser: { name: string };
}

export const RepositoryManager = ({ project, initialType, onClose, onUpdateProject, currentUser }: RepositoryManagerProps) => {
  const [activeTab, setActiveTab] = useState<'github' | 'drive'>(initialType);
  const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
  
  // GitHub Token State (Persisted in LocalStorage for UX)
  const [githubToken, setGithubToken] = useState(localStorage.getItem('simpledata_github_pat') || '');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Add New Repo State
  const [newRepo, setNewRepo] = useState({ alias: '', url: '' });

  // Upload State
  const [uploadState, setUploadState] = useState<'idle' | 'selecting' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const repositories = project.repositories?.filter(r => r.type === activeTab) || [];

  useEffect(() => {
      if (githubToken) {
          localStorage.setItem('simpledata_github_pat', githubToken);
      }
  }, [githubToken]);

  const handleAddRepo = () => {
      if (!newRepo.alias || !newRepo.url) return;
      const updatedRepositories = [
          ...(project.repositories || []),
          { 
              id: `r_${Date.now()}`, 
              type: activeTab, 
              alias: newRepo.alias, 
              url: newRepo.url 
          } as Repository
      ];
      onUpdateProject({ ...project, repositories: updatedRepositories });
      setNewRepo({ alias: '', url: '' });
      setViewMode('list');
  };

  const handleDeleteRepo = (repoId: string) => {
      if (!confirm("¿Eliminar este enlace del proyecto?")) return;
      const updatedRepositories = project.repositories.filter(r => r.id !== repoId);
      onUpdateProject({ ...project, repositories: updatedRepositories });
  };

  const handleTriggerUpload = (repoId: string) => {
      if (activeTab === 'github' && !githubToken) {
          alert("⚠️ Para subir archivos directo a GitHub, necesitas configurar tu Token de Acceso (PAT) primero.");
          setShowTokenInput(true);
          return;
      }
      setSelectedRepoId(repoId);
      if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedFile(file);
          setUploadState('uploading');
          setUploadStatusMsg('Preparando archivo...');
          
          const repo = project.repositories?.find(r => r.id === selectedRepoId);
          if (!repo) return;

          // --- LOGIC SPLIT: REAL GITHUB API vs DRIVE LINK ---
          if (activeTab === 'github') {
             await uploadToGitHubReal(file, repo);
          } else {
             // Drive Logic (Link Opener)
             window.open(repo.url, '_blank');
             simulateDriveUpload(file);
          }
      }
  };

  // --- REAL GITHUB API UPLOAD ---
  const uploadToGitHubReal = async (file: File, repo: Repository) => {
      try {
          setUploadStatusMsg('Conectando con GitHub API...');
          setProgress(10);

          // 1. Parse Repo URL to get Owner and Repo Name
          // Supports: https://github.com/owner/repo or https://github.com/owner/repo/tree/main...
          const cleanUrl = repo.url.replace(/\/$/, "").replace(/\.git$/, "");
          const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          
          if (!match) throw new Error("URL de repositorio inválida. No se pudo detectar usuario/repo.");
          const owner = match[1];
          const repoName = match[2];

          // 2. Read File as Base64
          setUploadStatusMsg('Procesando binarios...');
          const base64Content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                  const result = reader.result as string;
                  // Remove "data:*/*;base64," prefix for GitHub API
                  const base64 = result.split(',')[1];
                  resolve(base64);
              };
              reader.onerror = error => reject(error);
          });
          setProgress(40);

          // 3. API PUT Request (Create/Update File)
          setUploadStatusMsg(`Subiendo ${file.name} a ${owner}/${repoName}...`);
          const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${file.name}`; // Upload to root for now
          
          const response = await fetch(apiUrl, {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/vnd.github.v3+json'
              },
              body: JSON.stringify({
                  message: `Add ${file.name} via SimpleData Portal`,
                  content: base64Content,
                  // Note: If updating an existing file, 'sha' is required. 
                  // For this prototype, we assume new files or overwrite blindly (which API might reject without SHA, but let's try basic create)
              })
          });

          setProgress(80);

          if (!response.ok) {
              const errorData = await response.json();
              if (response.status === 422) throw new Error("El archivo ya existe o hubo un conflicto de validación (SHA).");
              if (response.status === 401) throw new Error("Token inválido o expirado.");
              if (response.status === 404) throw new Error("Repositorio no encontrado o sin permisos.");
              throw new Error(errorData.message || "Error desconocido de GitHub.");
          }

          const data = await response.json();
          setProgress(100);
          completeUpload(file, repo, data.content?.html_url || repo.url);

      } catch (error: any) {
          console.error(error);
          setUploadState('error');
          setUploadStatusMsg(error.message);
      }
  };

  const simulateDriveUpload = (file: File) => {
      // Keep existing simulation for Drive since we can't do direct upload without complex OAuth
      let pct = 0;
      const interval = setInterval(() => {
          pct += 10;
          if (pct > 100) {
              pct = 100;
              clearInterval(interval);
              completeUpload(file, project.repositories.find(r => r.id === selectedRepoId)!);
          }
          setProgress(pct);
      }, 200);
  };

  const completeUpload = (file: File, repo: Repository, finalUrl?: string) => {
      const newLog: ProjectLog = {
          id: `log_${Date.now()}`,
          date: new Date().toISOString(),
          author: currentUser.name,
          text: `✅ ARCHIVO SUBIDO: "${file.name}" a ${repo.alias} (GitHub Direct)`,
          link: finalUrl || repo.url
      };
      onUpdateProject({ 
          ...project, 
          logs: [...(project.logs || []), newLog] 
      });
      
      setUploadState('success');
      setUploadStatusMsg('¡Sincronización Completada!');
      setTimeout(() => {
          setUploadState('idle');
          setSelectedFile(null);
          setProgress(0);
          setUploadStatusMsg('');
      }, 2500);
  };

  const themeColor = activeTab === 'github' ? 'slate' : 'green';
  const themeIcon = activeTab === 'github' ? 'fab fa-github' : 'fab fa-google-drive';

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] md:h-auto">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

            {/* Header */}
            <div className={`p-6 bg-${themeColor}-900 text-white flex justify-between items-center transition-colors duration-300`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl`}>
                        <Icon name={themeIcon} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Gestor de Repositorios</h2>
                        <p className="text-white/60 text-sm">{project.name}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><Icon name="fa-times" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => { setActiveTab('github'); setViewMode('list'); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'github' ? 'bg-slate-50 text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Icon name="fab fa-github" className="mr-2" /> GITHUB (API)
                </button>
                <button 
                    onClick={() => { setActiveTab('drive'); setViewMode('list'); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'drive' ? 'bg-green-50 text-green-800 border-b-2 border-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Icon name="fab fa-google-drive" className="mr-2" /> GOOGLE DRIVE
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
                
                {/* UPLOAD OVERLAY */}
                {uploadState === 'uploading' && (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-20 h-20 mb-6 relative mx-auto">
                            <Icon name="fa-circle-notch" className={`text-6xl text-${themeColor}-200 animate-spin absolute inset-0`} />
                            <Icon name="fa-cloud-upload-alt" className={`text-2xl text-${themeColor}-600 absolute inset-0 m-auto`} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Sincronizando...</h3>
                        <p className="text-slate-500 mb-6 font-medium">{uploadStatusMsg}</p>
                        
                        <div className="w-full max-w-md bg-slate-100 rounded-full h-4 overflow-hidden mx-auto">
                            <div className={`h-full bg-${themeColor}-600 transition-all duration-200`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* ERROR OVERLAY */}
                {uploadState === 'error' && (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 text-4xl mx-auto">
                            <Icon name="fa-exclamation-triangle" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Error de Sincronización</h3>
                        <p className="text-red-500 font-medium mb-6 bg-red-50 p-3 rounded border border-red-100">{uploadStatusMsg}</p>
                        <button onClick={() => setUploadState('idle')} className="px-6 py-2 bg-slate-800 text-white rounded-lg">Intentar de nuevo</button>
                    </div>
                )}

                {/* SUCCESS OVERLAY */}
                {uploadState === 'success' && (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 animate-scale-up">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 text-4xl">
                            <Icon name="fa-check" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Sincronización Exitosa!</h3>
                        <p className="text-slate-500 text-center">{uploadStatusMsg}</p>
                    </div>
                )}

                {/* VIEW MODE: LIST */}
                {viewMode === 'list' && (
                    <div className="space-y-4">
                        {activeTab === 'github' && (
                            <div className="bg-slate-800 text-slate-300 p-4 rounded-xl mb-4 text-xs border border-slate-700">
                                <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowTokenInput(!showTokenInput)}>
                                    <div className="flex items-center gap-2">
                                        <Icon name="fa-key" className="text-yellow-500" />
                                        <span className="font-bold text-white">Configuración API GitHub</span>
                                        {githubToken ? <span className="text-green-400">(Token Activo)</span> : <span className="text-red-400">(Requerido)</span>}
                                    </div>
                                    <Icon name={showTokenInput ? "fa-chevron-up" : "fa-chevron-down"} />
                                </div>
                                {showTokenInput && (
                                    <div className="mt-3 animate-fade-in">
                                        <p className="mb-2">Para subir archivos directo, ingresa tu <a href="https://github.com/settings/tokens" target="_blank" className="underline text-blue-400">Personal Access Token (Classic)</a> con permisos de <code>repo</code>.</p>
                                        <input 
                                            type="password" 
                                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono"
                                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                            value={githubToken}
                                            onChange={e => setGithubToken(e.target.value)}
                                        />
                                        <p className="mt-1 text-slate-500">Se guardará localmente en tu navegador.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                {activeTab === 'drive' ? 'Carpetas Vinculadas' : 'Repositorios Vinculados'} ({repositories.length})
                            </h3>
                            <button onClick={() => setViewMode('add')} className={`text-xs font-bold text-${themeColor}-600 hover:underline flex items-center gap-1`}>
                                <Icon name="fa-plus" /> Agregar Nuevo
                            </button>
                        </div>

                        {repositories.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                                <Icon name="fa-folder-open" className="text-4xl text-slate-300 mb-2" />
                                <p className="text-slate-400 font-medium">No hay rutas configuradas.</p>
                                <button onClick={() => setViewMode('add')} className={`mt-4 px-4 py-2 bg-${themeColor}-600 text-white rounded-lg text-sm font-bold`}>
                                    Vincular {activeTab === 'drive' ? 'Carpeta' : 'Repositorio'}
                                </button>
                            </div>
                        ) : (
                            repositories.map(repo => (
                                <div key={repo.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-600 text-xl`}>
                                                <Icon name={activeTab === 'drive' ? 'fa-folder' : 'fa-code-branch'} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{repo.alias}</h4>
                                                <a href={repo.url} target="_blank" className="text-xs text-slate-400 hover:text-blue-500 truncate max-w-[200px] block underline">
                                                    {repo.url}
                                                </a>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteRepo(repo.id)} className="text-slate-300 hover:text-red-500 px-2">
                                            <Icon name="fa-trash" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={() => window.open(repo.url, '_blank')}
                                            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 flex items-center justify-center gap-2"
                                        >
                                            <Icon name="fa-external-link-alt" /> Abrir Link
                                        </button>
                                        <button 
                                            onClick={() => handleTriggerUpload(repo.id)}
                                            className={`flex-1 py-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm`}
                                        >
                                            <Icon name="fa-cloud-upload-alt" /> {activeTab === 'github' ? 'Subir (Directo)' : 'Subir Archivo'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW MODE: ADD */}
                {viewMode === 'add' && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Nuevo Enlace</h3>
                            <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-600 text-sm">Cancelar</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre / Alias</label>
                                <input 
                                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder={activeTab === 'drive' ? 'Ej. Carpeta Facturas 2025' : 'Ej. Backend API Repo'} 
                                    value={newRepo.alias}
                                    onChange={e => setNewRepo({...newRepo, alias: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Exacta</label>
                                <input 
                                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" 
                                    placeholder="https://..." 
                                    value={newRepo.url}
                                    onChange={e => setNewRepo({...newRepo, url: e.target.value})}
                                />
                            </div>
                            <div className="pt-4">
                                <button 
                                    onClick={handleAddRepo}
                                    disabled={!newRepo.alias || !newRepo.url}
                                    className={`w-full py-3 bg-${themeColor}-600 hover:bg-${themeColor}-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg`}
                                >
                                    Guardar Enlace
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer Tip */}
            {viewMode === 'list' && (
                <div className="p-4 bg-slate-100 text-center text-xs text-slate-500 border-t border-slate-200">
                    <Icon name="fa-info-circle" /> {activeTab === 'github' ? 'Usa tu Token para subir archivos directo.' : 'Gestiona carpetas de Drive.'}
                </div>
            )}
        </div>
    </div>
  );
};