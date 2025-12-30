import React, { useState, useRef, useEffect } from 'react';
import { Project, Repository, ProjectLog } from '../types';
import { APP_CONFIG } from '../constants'; // Import Env Config

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

declare var google: any; // Declare google global for GIS

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
  
  // GitHub Token Logic
  const envToken = APP_CONFIG.GITHUB_TOKEN;
  const isEnvConfigured = !!envToken && envToken.length > 5;
  const [githubToken, setGithubToken] = useState(envToken || localStorage.getItem('simpledata_github_pat') || '');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Drive Token State (New: To manage UI state after auth)
  const [driveToken, setDriveToken] = useState<string>('');

  // Add New Repo State
  const [newRepo, setNewRepo] = useState({ alias: '', url: '' });

  // Upload State
  const [uploadState, setUploadState] = useState<'idle' | 'selecting' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const repositories = project.repositories?.filter(r => r.type === activeTab) || [];

  // If using manual token (not env), save to local storage
  useEffect(() => {
      if (githubToken && !isEnvConfigured) {
          localStorage.setItem('simpledata_github_pat', githubToken);
      }
  }, [githubToken, isEnvConfigured]);

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
      setSelectedRepoId(repoId);

      // 1. GITHUB FLOW
      if (activeTab === 'github') {
          if (!githubToken) {
              alert("⚠️ Para subir archivos directo a GitHub, necesitas configurar tu Token de Acceso (PAT) primero.");
              setShowTokenInput(true);
              return;
          }
          if (fileInputRef.current) fileInputRef.current.click();
          return;
      }

      // 2. GOOGLE DRIVE FLOW
      if (activeTab === 'drive') {
          // If we already have a token from this session, skip Auth and go straight to file select
          if (driveToken) {
              if (fileInputRef.current) fileInputRef.current.click();
              return;
          }

          if (!APP_CONFIG.GOOGLE_CLIENT_ID) {
              alert("⚠️ Faltante: GOOGLE_CLIENT_ID.\n\nPara subir directo a Drive, el administrador debe configurar un Client ID de Google OAuth en el Dashboard (Icono engranaje).");
              return;
          }
          
          if (typeof google === 'undefined' || !google.accounts) {
             alert("Error: Librería Google Identity Services no cargada. Por favor recarga la página o revisa tu conexión.");
             return;
          }

          // Trigger OAuth Popup
          try {
             const client = google.accounts.oauth2.initTokenClient({
                  client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
                  scope: 'https://www.googleapis.com/auth/drive.file',
                  callback: (tokenResponse: any) => {
                      if (tokenResponse && tokenResponse.access_token) {
                          // 1. Save Token to State (Updates UI)
                          setDriveToken(tokenResponse.access_token);
                          
                          // 2. Try to auto-open file selector
                          // Note: Some browsers block this inside async callbacks. 
                          // If blocked, the user will see the button change to "Seleccionar Archivo" and can click again.
                          setTimeout(() => {
                              if (fileInputRef.current) fileInputRef.current.click();
                          }, 100);
                      } else {
                          console.error("No access token received from Google");
                      }
                  },
              });
              client.requestAccessToken();
          } catch (e) {
              console.error(e);
              alert("Error iniciando Google Auth: " + e);
          }
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedFile(file);
          
          const repo = project.repositories?.find(r => r.id === selectedRepoId);
          if (!repo) return;

          setUploadState('uploading');

          if (activeTab === 'github') {
             await uploadToGitHubReal(file, repo);
          } else {
             // Use the state token
             await uploadToDriveReal(file, repo, driveToken);
          }
      }
      // Reset input to allow selecting same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- REAL GOOGLE DRIVE API UPLOAD ---
  const uploadToDriveReal = async (file: File, repo: Repository, accessToken: string) => {
      setUploadStatusMsg('Iniciando carga segura...');
      setProgress(5);

      if (!accessToken) {
          setUploadState('error');
          setUploadStatusMsg('Sesión expirada. Por favor intente nuevamente.');
          return;
      }

      // 1. Extract Folder ID
      let folderId = '';
      const folderMatch = repo.url.match(/(?:folders\/|id=)([\w-]+)/);
      if (folderMatch) {
          folderId = folderMatch[1];
      } else {
          setUploadState('error');
          setUploadStatusMsg('No se pudo detectar el ID de la carpeta en la URL. Asegúrate que el link sea de una carpeta de Drive.');
          return;
      }

      // 2. Upload
      try {
          setUploadStatusMsg('Enviando datos a Google Drive...');
          setProgress(30);

          const metadata = {
              name: file.name,
              parents: [folderId]
          };

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', file);

          // Use XMLHttpRequest for better progress tracking if needed, but fetch is simpler for now
          const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${accessToken}`
              },
              body: form
          });

          setProgress(80);

          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error?.message || "Error al subir a Drive");
          }

          const data = await response.json();
          setProgress(100);
          completeUpload(file, repo, data.webViewLink);

      } catch (e: any) {
          console.error(e);
          setUploadState('error');
          setUploadStatusMsg('Fallo en la subida: ' + e.message);
      }
  };

  // --- REAL GITHUB API UPLOAD ---
  const uploadToGitHubReal = async (file: File, repo: Repository) => {
      try {
          setUploadStatusMsg('Conectando con GitHub API...');
          setProgress(10);

          // 1. Parse Repo URL
          const cleanUrl = repo.url.replace(/\/$/, "").replace(/\.git$/, "");
          const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          
          if (!match) throw new Error("URL de repositorio inválida.");
          const owner = match[1];
          const repoName = match[2];

          // 2. Read File as Base64
          setUploadStatusMsg('Procesando archivo...');
          const base64Content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                  const result = reader.result as string;
                  const base64 = result.split(',')[1];
                  resolve(base64);
              };
              reader.onerror = error => reject(error);
          });
          setProgress(40);

          // 3. API PUT Request
          setUploadStatusMsg(`Subiendo a ${owner}/${repoName}...`);
          const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${file.name}`; 
          
          const response = await fetch(apiUrl, {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/vnd.github.v3+json'
              },
              body: JSON.stringify({
                  message: `Add ${file.name} via SimpleData Portal`,
                  content: base64Content
              })
          });

          setProgress(80);

          if (!response.ok) {
              const errorData = await response.json();
              if (response.status === 422) throw new Error("El archivo ya existe.");
              if (response.status === 401) throw new Error("Token inválido.");
              throw new Error(errorData.message || "Error desconocido.");
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

  const completeUpload = (file: File, repo: Repository, finalUrl?: string) => {
      const newLog: ProjectLog = {
          id: `log_${Date.now()}`,
          date: new Date().toISOString(),
          author: currentUser.name,
          text: `✅ ARCHIVO CARGADO: "${file.name}" a ${repo.alias} (${repo.type === 'github' ? 'GitHub API' : 'Google Drive'})`,
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
                
                {/* UPLOAD OVERLAY: PROGRESS */}
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
                        {/* Status Bar for Drive */}
                        {activeTab === 'drive' && driveToken && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-xs font-bold border border-green-200 animate-fade-in mb-4">
                                <Icon name="fa-check-circle" /> Sesión de Google Drive Activa. Listo para subir archivos.
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
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
                                                activeTab === 'drive' && !driveToken 
                                                    ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50' 
                                                    : `bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white`
                                            }`}
                                        >
                                            {activeTab === 'drive' && !driveToken ? (
                                                <><Icon name="fab fa-google" /> Conectar & Subir</>
                                            ) : (
                                                <><Icon name="fa-cloud-upload-alt" /> {activeTab === 'github' ? 'Subir' : 'Seleccionar Archivo'}</>
                                            )}
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
                    <Icon name="fa-info-circle" /> {activeTab === 'github' ? 'API Directa (Con Token)' : 'OAuth 2.0 Secure Upload'}
                </div>
            )}
        </div>
    </div>
  );
};