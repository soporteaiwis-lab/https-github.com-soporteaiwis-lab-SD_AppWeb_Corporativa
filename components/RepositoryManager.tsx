import React, { useState, useRef, useEffect } from 'react';
import { Project, Repository, ProjectLog } from '../types';
import { APP_CONFIG } from '../constants'; // Import Env Config

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

declare var google: any; // Declare google global for GIS

// Predefined Folder Structure
const FOLDER_STRUCTURE = [
  "01_Documentacion",
  "02_Proceso",
  "03_Cuadratura",
  "04_QA",
  "05_Entrega_Interna",
  "06_Entrega",
  "07_PostEntrega",
  "10_Revision_Archivos"
];

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

  // Drive Token State
  const [driveToken, setDriveToken] = useState<string>('');

  // Add New Repo State (Manual)
  const [newRepo, setNewRepo] = useState({ alias: '', url: '' });

  // Drive Structure Generator State
  const [correlative, setCorrelative] = useState(project.id.replace(/\D/g, '') || '001');
  const [creationStatus, setCreationStatus] = useState<'idle' | 'auth' | 'creating' | 'success' | 'error'>('idle');
  const [creationLog, setCreationLog] = useState('');

  // --- NEW: FOLDER PICKER STATE ---
  const [targetParent, setTargetParent] = useState<{id: string, name: string}>({ id: 'root', name: 'Mi Unidad (Raíz)' });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerItems, setPickerItems] = useState<any[]>([]);
  const [pickerCurrentFolder, setPickerCurrentFolder] = useState<{id: string, name: string}>({ id: 'root', name: 'Mi Unidad' });
  const [pickerBreadcrumb, setPickerBreadcrumb] = useState<{id: string, name: string}[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

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

  // --- ACTIONS ---

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

  // --- DRIVE AUTH HELPER ---
  const authenticateDrive = (): Promise<string> => {
      return new Promise((resolve, reject) => {
          if (driveToken) {
              resolve(driveToken);
              return;
          }
          if (!APP_CONFIG.GOOGLE_CLIENT_ID) {
            reject("Falta GOOGLE_CLIENT_ID en configuración.");
            return;
          }
          try {
             const client = google.accounts.oauth2.initTokenClient({
                  client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
                  scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
                  callback: (tokenResponse: any) => {
                      if (tokenResponse && tokenResponse.access_token) {
                          setDriveToken(tokenResponse.access_token);
                          resolve(tokenResponse.access_token);
                      } else {
                          reject("No se obtuvo token de Google.");
                      }
                  },
              });
              client.requestAccessToken();
          } catch (e) {
              reject(e);
          }
      });
  };

  // --- DRIVE FOLDER PICKER LOGIC ---
  const fetchDriveFolders = async (parentId: string, token: string) => {
      const query = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=100&orderBy=name`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Error listando carpetas");
      const data = await response.json();
      return data.files || [];
  };

  const openPicker = async () => {
      setIsPickerOpen(true);
      setPickerLoading(true);
      try {
          const token = await authenticateDrive();
          const rootFolders = await fetchDriveFolders('root', token);
          setPickerItems(rootFolders);
          setPickerCurrentFolder({ id: 'root', name: 'Mi Unidad' });
          setPickerBreadcrumb([{ id: 'root', name: 'Mi Unidad' }]);
      } catch (e) {
          console.error(e);
          alert("Error abriendo selector: " + e);
          setIsPickerOpen(false);
      } finally {
          setPickerLoading(false);
      }
  };

  const handleEnterFolder = async (folder: {id: string, name: string}) => {
      setPickerLoading(true);
      try {
          const token = await authenticateDrive();
          const items = await fetchDriveFolders(folder.id, token);
          setPickerItems(items);
          setPickerCurrentFolder(folder);
          setPickerBreadcrumb([...pickerBreadcrumb, folder]);
      } catch (e) {
          console.error(e);
      } finally {
          setPickerLoading(false);
      }
  };

  const handleNavigateUp = async (index: number) => {
      const target = pickerBreadcrumb[index];
      const newBreadcrumb = pickerBreadcrumb.slice(0, index + 1);
      setPickerLoading(true);
      try {
          const token = await authenticateDrive();
          const items = await fetchDriveFolders(target.id, token);
          setPickerItems(items);
          setPickerCurrentFolder(target);
          setPickerBreadcrumb(newBreadcrumb);
      } catch (e) {
          console.error(e);
      } finally {
          setPickerLoading(false);
      }
  };

  const confirmSelection = () => {
      setTargetParent(pickerCurrentFolder);
      setIsPickerOpen(false);
  };


  // --- DRIVE FOLDER CREATION LOGIC ---
  const createDriveFolder = async (name: string, parentId: string | null, token: string) => {
      const metadata: any = {
          name: name,
          mimeType: 'application/vnd.google-apps.folder'
      };
      // Use selected parent or 'root' if null
      if (parentId && parentId !== 'root') {
          metadata.parents = [parentId];
      }

      const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(metadata)
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || "Error creando carpeta");
      }
      return await response.json(); // returns { id, webViewLink }
  };

  const handleCreateStructure = async () => {
      setCreationStatus('auth');
      setCreationLog('Autenticando...');
      
      try {
          const token = await authenticateDrive();
          
          setCreationStatus('creating');
          
          // 1. Construct Root Name: [CORRELATIVO]_[NOMBRE]_[ENCARGADO]
          const safeName = project.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "");
          const safeManager = (project.encargadoCliente || 'SinAsignar').replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "");
          const rootFolderName = `${correlative}_${safeName}_${safeManager}`;

          setCreationLog(`Creando carpeta raíz: ${rootFolderName}...`);
          
          // 2. Create Root in the selected Target Parent
          const rootFolder = await createDriveFolder(rootFolderName, targetParent.id, token);
          
          // 3. Create Subfolders
          let createdCount = 0;
          for (const subName of FOLDER_STRUCTURE) {
              setCreationLog(`Creando subcarpeta (${createdCount + 1}/${FOLDER_STRUCTURE.length}): ${subName}...`);
              await createDriveFolder(subName, rootFolder.id, token);
              createdCount++;
          }

          setCreationLog('¡Estructura creada exitosamente!');
          setCreationStatus('success');

          // 4. Link to Project
          const newRepoLink: Repository = {
              id: `r_${Date.now()}`,
              type: 'drive',
              alias: `🗂️ ${rootFolderName}`,
              url: rootFolder.webViewLink
          };

          const updatedRepositories = [...(project.repositories || []), newRepoLink];
          onUpdateProject({ ...project, repositories: updatedRepositories });

          // 5. Add Log
          const newLog: ProjectLog = {
            id: `log_${Date.now()}`,
            date: new Date().toISOString(),
            author: currentUser.name,
            text: `✅ ESTRUCTURA DRIVE CREADA: ${rootFolderName} en ${targetParent.name}`,
            link: rootFolder.webViewLink
          };
          onUpdateProject({ ...project, repositories: updatedRepositories, logs: [...(project.logs || []), newLog] });

          setTimeout(() => {
              setViewMode('list');
              setCreationStatus('idle');
          }, 2000);

      } catch (e: any) {
          console.error(e);
          setCreationStatus('error');
          setCreationLog('Error: ' + e.message);
      }
  };

  // --- UPLOAD LOGIC ---
  const handleTriggerUpload = async (repoId: string) => {
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
          try {
              const token = await authenticateDrive();
              // Try auto-open, fallback to user click if blocked
               setTimeout(() => {
                  if (fileInputRef.current) fileInputRef.current.click();
              }, 100);
          } catch (e: any) {
              alert("Error Auth Drive: " + e);
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
             await uploadToDriveReal(file, repo, driveToken);
          }
      }
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
      let folderId = '';
      const folderMatch = repo.url.match(/(?:folders\/|id=)([\w-]+)/);
      if (folderMatch) {
          folderId = folderMatch[1];
      } else {
          setUploadState('error');
          setUploadStatusMsg('No se pudo detectar el ID de la carpeta en la URL.');
          return;
      }
      try {
          setUploadStatusMsg('Enviando datos a Google Drive...');
          setProgress(30);
          const metadata = { name: file.name, parents: [folderId] };
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', file);

          const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}` },
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
          const cleanUrl = repo.url.replace(/\/$/, "").replace(/\.git$/, "");
          const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (!match) throw new Error("URL de repositorio inválida.");
          const owner = match[1];
          const repoName = match[2];
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
      onUpdateProject({ ...project, logs: [...(project.logs || []), newLog] });
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
        {/* RESPONSIVE CONTAINER FIX: h-[90vh] on mobile to prevent overflow, md:h-auto for desktop */}
        <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

            {/* Header */}
            <div className={`p-6 bg-${themeColor}-900 text-white flex justify-between items-center transition-colors duration-300 shrink-0`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl`}>
                        <Icon name={themeIcon} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Gestor de Repositorios</h2>
                        <p className="text-white/60 text-sm truncate max-w-[200px]">{project.name}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><Icon name="fa-times" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
                <button 
                    onClick={() => { setActiveTab('github'); setViewMode('list'); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'github' ? 'bg-slate-50 text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Icon name="fab fa-github" className="mr-2" /> GITHUB
                </button>
                <button 
                    onClick={() => { setActiveTab('drive'); setViewMode('list'); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'drive' ? 'bg-green-50 text-green-800 border-b-2 border-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Icon name="fab fa-google-drive" className="mr-2" /> DRIVE
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative">
                
                {/* PICKER OVERLAY - RESPONSIVE FIX */}
                {isPickerOpen && (
                    <div className="absolute inset-0 bg-white z-50 flex flex-col p-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-4 border-b pb-2 shrink-0">
                             <div>
                                 <h3 className="font-bold text-slate-800">Seleccionar Carpeta</h3>
                                 <p className="text-xs text-slate-500">Navega y selecciona destino.</p>
                             </div>
                             <button onClick={() => setIsPickerOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon name="fa-times" /></button>
                        </div>
                        
                        {/* Breadcrumbs */}
                        <div className="flex gap-1 text-xs mb-3 overflow-x-auto whitespace-nowrap pb-2 shrink-0">
                            {pickerBreadcrumb.map((crumb, idx) => (
                                <div key={crumb.id} className="flex items-center">
                                    <button 
                                        onClick={() => handleNavigateUp(idx)}
                                        className={`hover:underline ${idx === pickerBreadcrumb.length - 1 ? 'font-bold text-slate-800' : 'text-blue-600'}`}
                                    >
                                        {crumb.name}
                                    </button>
                                    {idx < pickerBreadcrumb.length - 1 && <Icon name="fa-chevron-right" className="mx-1 text-slate-300 text-[8px]" />}
                                </div>
                            ))}
                        </div>

                        {/* List - Flex 1 to take available space */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg border border-slate-200 p-2 space-y-1">
                             {pickerLoading ? (
                                 <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                                     <Icon name="fa-circle-notch" className="animate-spin" /> Cargando Drive...
                                 </div>
                             ) : pickerItems.length === 0 ? (
                                 <div className="flex items-center justify-center h-full text-slate-400 text-sm">Carpeta vacía</div>
                             ) : (
                                 pickerItems.map(item => (
                                     <div key={item.id} className="flex items-center justify-between p-3 hover:bg-white hover:shadow-sm rounded cursor-pointer group border-b border-transparent hover:border-slate-100" onClick={() => handleEnterFolder(item)}>
                                          <div className="flex items-center gap-3">
                                              <Icon name="fa-folder" className="text-yellow-400 text-lg" />
                                              <span className="text-sm text-slate-700 font-medium truncate max-w-[180px]">{item.name}</span>
                                          </div>
                                          <Icon name="fa-chevron-right" className="text-slate-300 text-xs group-hover:text-slate-500" />
                                     </div>
                                 ))
                             )}
                        </div>

                        {/* Actions - Fixed at bottom via shrink-0 in parent flex */}
                        <div className="mt-4 shrink-0 flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="text-xs text-blue-800 truncate mr-2">
                                Selección:<br/>
                                <strong className="text-sm">{pickerCurrentFolder.name}</strong>
                            </div>
                            <button 
                                onClick={confirmSelection}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-all shrink-0"
                            >
                                <Icon name="fa-check" /> Seleccionar
                            </button>
                        </div>
                    </div>
                )}

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
                {(uploadState === 'error' || creationStatus === 'error') && (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 text-4xl mx-auto">
                            <Icon name="fa-exclamation-triangle" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Error</h3>
                        <p className="text-red-500 font-medium mb-6 bg-red-50 p-3 rounded border border-red-100">{uploadStatusMsg || creationLog}</p>
                        <button onClick={() => { setUploadState('idle'); setCreationStatus('idle'); }} className="px-6 py-2 bg-slate-800 text-white rounded-lg">Volver</button>
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
                        {activeTab === 'drive' && driveToken && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-xs font-bold border border-green-200 animate-fade-in mb-4">
                                <Icon name="fa-check-circle" /> Sesión Activa
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                {activeTab === 'drive' ? 'Carpetas' : 'Repositorios'} ({repositories.length})
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
                                                <a href={repo.url} target="_blank" className="text-xs text-slate-400 hover:text-blue-500 truncate max-w-[150px] md:max-w-[200px] block underline">
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
                                                <><Icon name="fab fa-google" /> Conectar</>
                                            ) : (
                                                <><Icon name="fa-cloud-upload-alt" /> {activeTab === 'github' ? 'Subir' : 'Elegir'}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW MODE: ADD */}
                {viewMode === 'add' && !isPickerOpen && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Nuevo Enlace</h3>
                            <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-600 text-sm">Cancelar</button>
                        </div>

                        {/* OPTION 1: AUTOMATIC STRUCTURE (DRIVE ONLY) */}
                        {activeTab === 'drive' && (
                            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-200 shadow-sm relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl shrink-0">
                                            <Icon name="fa-magic" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-green-900">Generador de Estructura Automática</h4>
                                            <p className="text-sm text-green-700/80 mt-1">
                                                Crea la estructura estándar de 8 carpetas.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* TARGET FOLDER SELECTOR */}
                                    <div className="mb-4 bg-white/60 p-2 rounded border border-green-100 flex items-center justify-between">
                                        <div className="text-xs text-green-800 overflow-hidden mr-2">
                                            <span className="font-bold uppercase opacity-60">Crear en:</span><br/>
                                            <span className="font-bold flex items-center gap-1 truncate"><Icon name="fa-folder-open" /> {targetParent.name}</span>
                                        </div>
                                        <button 
                                            onClick={openPicker}
                                            className="text-[10px] bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded font-bold transition-colors shrink-0"
                                        >
                                            Cambiar
                                        </button>
                                    </div>

                                    {creationStatus === 'idle' ? (
                                        <div className="flex items-end gap-3">
                                             <div className="flex-1 min-w-[50px]">
                                                <label className="block text-[10px] font-bold text-green-800 uppercase mb-1">ID</label>
                                                <input 
                                                    value={correlative} 
                                                    onChange={e => setCorrelative(e.target.value)}
                                                    className="w-full border border-green-300 rounded p-2 text-sm text-center font-mono font-bold"
                                                    placeholder="000"
                                                />
                                             </div>
                                             <div className="flex-[3] overflow-hidden">
                                                <label className="block text-[10px] font-bold text-green-800 uppercase mb-1">Nombre Previsto</label>
                                                <div className="w-full bg-white/50 border border-green-200 rounded p-2 text-sm text-green-900 font-mono truncate">
                                                    {correlative}_{project.name.replace(/\s+/g, "")}_{project.encargadoCliente?.replace(/\s+/g, "") || 'Manager'}
                                                </div>
                                             </div>
                                             <button 
                                                onClick={handleCreateStructure}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-lg transition-transform active:scale-95 shrink-0"
                                             >
                                                Generar
                                             </button>
                                        </div>
                                    ) : (
                                        <div className="bg-white/80 p-4 rounded border border-green-200 text-center">
                                            {creationStatus === 'creating' && <Icon name="fa-circle-notch" className="animate-spin text-green-600 mr-2" />}
                                            {creationStatus === 'success' && <Icon name="fa-check-circle" className="text-green-600 mr-2" />}
                                            <span className="text-sm font-bold text-green-800">{creationLog}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* OPTION 2: MANUAL LINK */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">O vincular manualmente</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre / Alias</label>
                                    <input 
                                        className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                        placeholder={activeTab === 'drive' ? 'Ej. Carpeta Manual' : 'Ej. Backend API Repo'} 
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
                                        className={`w-full py-3 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg`}
                                    >
                                        Guardar Enlace Manual
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};