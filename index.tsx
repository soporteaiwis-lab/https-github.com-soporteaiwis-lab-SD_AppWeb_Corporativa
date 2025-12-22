import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { TOOLS_LINKS } from './constants';
import { User, Project, AppRoute, UserRole, ChatMessage } from './types';
import { generateText } from './services/geminiService';
import { db } from './services/dbService';

// --- Icons ---
const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

// --- Components ---

// 1. Sidebar
const Sidebar = ({ 
  currentUser, 
  currentRoute, 
  onNavigate, 
  onLogout 
}: { 
  currentUser: User, 
  currentRoute: AppRoute, 
  onNavigate: (r: AppRoute) => void,
  onLogout: () => void
}) => {
  const menuItems = [
    { id: AppRoute.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-line' },
    { id: AppRoute.PROJECTS, label: 'Projects', icon: 'fa-kanban' },
    { id: AppRoute.TEAM, label: 'Team & Skills', icon: 'fa-users' },
    { id: AppRoute.REPORTS, label: 'Weekly Reports', icon: 'fa-file-contract' },
    { id: AppRoute.TOOLS, label: 'Dev Tools', icon: 'fa-screwdriver-wrench' },
  ];

  return (
    <div className="w-64 bg-simple-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 shadow-xl z-20">
      <div className="p-6 flex items-center gap-3 border-b border-simple-800">
        <div className="w-10 h-10 bg-gradient-to-br from-simple-500 to-simple-accent rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
          S
        </div>
        <div>
          <h1 className="text-white font-bold tracking-tight">SimpleData</h1>
          <p className="text-xs text-simple-accent uppercase tracking-wider">Portal v2.0</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentRoute === item.id 
                ? 'bg-simple-600 text-white shadow-lg shadow-simple-900/50' 
                : 'hover:bg-simple-800 hover:text-white'
            }`}
          >
            <Icon name={item.icon} className={`text-lg ${currentRoute === item.id ? 'text-white' : 'text-slate-500 group-hover:text-simple-accent'}`} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-simple-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-simple-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser.role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-simple-800 rounded-lg transition-colors">
          <Icon name="fa-sign-out-alt" /> Sign Out
        </button>
      </div>
    </div>
  );
};

// 2. Dashboard View
const Dashboard = ({ currentUser, projects, users }: { currentUser: User, projects: Project[], users: User[] }) => {
  const activeProjects = projects.filter(p => p.status === 'In Progress');
  
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-simple-900">Welcome back, {currentUser.name.split(' ')[0]}</h2>
          <p className="text-slate-500 mt-1">Here's what's happening at SimpleData ecosystem today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400">{new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Icon name="fa-layer-group" className="text-xl" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">+12%</span>
          </div>
          <h3 className="text-3xl font-bold text-simple-900">{activeProjects.length}</h3>
          <p className="text-slate-500 text-sm">Active Projects</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Icon name="fa-clock" className="text-xl" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-simple-900">32h</h3>
          <p className="text-slate-500 text-sm">Hours Tracked this Week</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Icon name="fa-check-circle" className="text-xl" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Pending</span>
          </div>
          <h3 className="text-3xl font-bold text-simple-900">3</h3>
          <p className="text-slate-500 text-sm">Code Reviews</p>
        </div>

        <div className="bg-gradient-to-br from-simple-600 to-simple-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Icon name="fa-wand-magic-sparkles" className="text-xl" />
            </div>
          </div>
          <h3 className="text-lg font-bold mb-1">SimpleData AI</h3>
          <p className="text-white/80 text-sm">Your assistant is ready to generate reports.</p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-simple-900 mb-4 flex items-center gap-2">
            <Icon name="fa-rocket" className="text-simple-500" /> Active Priorities
          </h3>
          <div className="space-y-4">
            {projects.slice(0, 3).map(p => (
              <div key={p.id} className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-simple-200 hover:bg-slate-50 transition-all">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                  ${p.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-simple-900">{p.name}</h4>
                  <p className="text-xs text-slate-500">{p.client} • Due {new Date(p.deadline).toLocaleDateString()}</p>
                </div>
                <div className="w-24">
                   <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span className="font-bold">{p.progress}%</span>
                   </div>
                   <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-simple-500 h-full rounded-full" style={{ width: `${p.progress}%` }}></div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-simple-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
             <button className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-slate-600 flex flex-col items-center gap-2">
                <Icon name="fa-video" className="text-2xl" />
                <span className="text-xs font-medium">New Meeting</span>
             </button>
             <button className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all text-slate-600 flex flex-col items-center gap-2">
                <Icon name="fa-file-excel" className="text-2xl" />
                <span className="text-xs font-medium">Open Sheets</span>
             </button>
             <button className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-all text-slate-600 flex flex-col items-center gap-2">
                <Icon name="fa-envelope" className="text-2xl" />
                <span className="text-xs font-medium">Draft Email</span>
             </button>
             <button className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all text-slate-600 flex flex-col items-center gap-2">
                <Icon name="fa-bug" className="text-2xl" />
                <span className="text-xs font-medium">Report Bug</span>
             </button>
          </div>
          
          <div className="mt-6">
             <h4 className="text-sm font-semibold text-slate-900 mb-3">Team Status</h4>
             <div className="space-y-3">
                {users.filter(u => u.id !== currentUser.id).slice(0, 4).map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="relative">
                      <img src={u.avatar} className="w-8 h-8 rounded-full" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700">{u.name}</p>
                      <p className="text-xs text-slate-400">Online</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Project View (With Create/Delete)
const ProjectsView = ({ 
  projects, 
  users, 
  onAddProject, 
  onDeleteProject 
}: { 
  projects: Project[], 
  users: User[],
  onAddProject: (p: Project) => void,
  onDeleteProject: (id: string) => void
}) => {
  const [showModal, setShowModal] = useState(false);
  
  // Create Project Form State
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', client: '', status: 'Planning', progress: 0, description: ''
  });

  const handleCreate = () => {
    if (!newProject.name || !newProject.client) return;
    const project: Project = {
      id: 'p' + Date.now(),
      name: newProject.name,
      client: newProject.client,
      status: newProject.status as any,
      description: newProject.description || '',
      progress: newProject.progress || 0,
      deadline: new Date().toISOString(),
      leadId: users[0].id,
      teamIds: [],
      technologies: ['Pending']
    };
    onAddProject(project);
    setShowModal(false);
    setNewProject({ name: '', client: '', status: 'Planning', progress: 0, description: '' });
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-simple-900">Project Management</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-simple-600 hover:bg-simple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Icon name="fa-plus" className="mr-2" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow relative group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-semibold 
                  ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                    project.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                    'bg-slate-100 text-slate-700'}`}>
                  {project.status}
                </span>
                <button 
                  onClick={() => onDeleteProject(project.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Project"
                >
                  <Icon name="fa-trash" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{project.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{project.client}</p>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{project.description}</p>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map(tech => (
                    <span key={tech} className="px-2 py-1 bg-slate-50 text-slate-600 rounded border border-slate-200 text-xs">{tech}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex -space-x-2">
                   {project.teamIds.map(uid => {
                     const u = users.find(user => user.id === uid);
                     return u ? <img key={uid} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-200" title={u.name} /> : null;
                   })}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">{project.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Modal for New Project */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">New Project</h3>
            <div className="space-y-3">
              <input 
                className="w-full border p-2 rounded-lg text-sm" 
                placeholder="Project Name"
                value={newProject.name}
                onChange={e => setNewProject({...newProject, name: e.target.value})}
              />
              <input 
                className="w-full border p-2 rounded-lg text-sm" 
                placeholder="Client Name"
                value={newProject.client}
                onChange={e => setNewProject({...newProject, client: e.target.value})}
              />
              <textarea 
                className="w-full border p-2 rounded-lg text-sm" 
                placeholder="Description"
                value={newProject.description}
                onChange={e => setNewProject({...newProject, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="text-slate-500 text-sm px-3 py-2">Cancel</button>
              <button onClick={handleCreate} className="bg-simple-600 text-white text-sm px-4 py-2 rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Team View (With Add/Delete)
const TeamView = ({ 
  users, 
  onAddUser, 
  onDeleteUser 
}: { 
  users: User[],
  onAddUser: (u: User) => void,
  onDeleteUser: (id: string) => void
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.DEVELOPER });

  const handleAdd = () => {
    if(!newUser.name || !newUser.email) return;
    const u: User = {
      id: 'u' + Date.now(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`,
      skills: [],
      projects: []
    };
    onAddUser(u);
    setShowModal(false);
    setNewUser({ name: '', email: '', role: UserRole.DEVELOPER });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-simple-900">SimpleData Team</h2>
        <button onClick={() => setShowModal(true)} className="bg-simple-600 hover:bg-simple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Icon name="fa-user-plus" className="mr-2" /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 relative group">
            <button 
              onClick={() => onDeleteUser(user.id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon name="fa-trash" />
            </button>
            
            <div className="flex-shrink-0 flex flex-col items-center">
              <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-slate-100 mb-3" />
              <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
              <span className="text-sm text-simple-600 font-medium bg-simple-50 px-3 py-1 rounded-full">{user.role}</span>
              <span className="text-xs text-slate-400 mt-2">{user.email}</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Core Skills</h4>
              <div className="space-y-3">
                {user.skills.length > 0 ? user.skills.map(skill => (
                  <div key={skill.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{skill.name}</span>
                      <span className="text-slate-500">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-simple-500 to-simple-accent h-full rounded-full" 
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-400 italic">No skills listed yet.</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Add Team Member</h3>
            <div className="space-y-3">
              <input 
                className="w-full border p-2 rounded-lg text-sm" 
                placeholder="Full Name"
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
              />
              <input 
                className="w-full border p-2 rounded-lg text-sm" 
                placeholder="Email Address"
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
              />
              <select 
                className="w-full border p-2 rounded-lg text-sm"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
              >
                {Object.values(UserRole).map(role => (
                   <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="text-slate-500 text-sm px-3 py-2">Cancel</button>
              <button onClick={handleAdd} className="bg-simple-600 text-white text-sm px-4 py-2 rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Tools View
const ToolsView = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-simple-900">Developer Ecosystem</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {TOOLS_LINKS.map((tool, idx) => (
          <a 
            key={idx} 
            href={tool.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-xl border border-slate-200 hover:border-simple-400 hover:shadow-lg transition-all group flex flex-col items-center justify-center text-center gap-3 aspect-square"
          >
            <div className={`w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-white flex items-center justify-center text-3xl transition-colors ${tool.color}`}>
              <Icon name={tool.icon} />
            </div>
            <span className="font-medium text-slate-700 group-hover:text-simple-900">{tool.name}</span>
          </a>
        ))}
        {/* Add custom local tools */}
        <button className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-simple-400 hover:bg-white transition-all flex flex-col items-center justify-center text-center gap-3 aspect-square text-slate-400 hover:text-simple-500">
           <Icon name="fa-plus" className="text-2xl" />
           <span className="font-medium">Add Tool</span>
        </button>
      </div>
    </div>
  );
}

// 6. Reports View (With AI)
const ReportsView = ({ currentUser, projects }: { currentUser: User, projects: Project[] }) => {
  const [reportContent, setReportContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIAutoDraft = async () => {
    setIsGenerating(true);
    // Construct context from user's active projects
    const userProjects = projects.filter(p => currentUser.projects.includes(p.id));
    const context = `
      User: ${currentUser.name} (${currentUser.role})
      Active Projects: ${userProjects.map(p => `${p.name} (Status: ${p.status}, Progress: ${p.progress}%)`).join(', ')}
      Date: ${new Date().toLocaleDateString()}
    `;
    
    try {
      const draft = await generateText(
        `Draft a weekly professional status report for ${currentUser.name}. Use the project data provided. Format it with markdown headers and bullet points. Include a section for "Key Achievements" and "Upcoming Focus".`,
        `You are a helpful project management assistant for SimpleData. Use this context: ${context}`
      );
      setReportContent(draft);
    } catch (e) {
      setReportContent("Error generating report. Please check API configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-simple-900">Weekly Status Report</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleAIAutoDraft}
            disabled={isGenerating}
            className={`bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md flex items-center gap-2 ${isGenerating ? 'opacity-70' : ''}`}
          >
            {isGenerating ? <Icon name="fa-spinner" className="fa-spin" /> : <Icon name="fa-wand-magic-sparkles" />}
            AI Auto-Draft
          </button>
          <button className="bg-simple-600 hover:bg-simple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Submit Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4 text-sm text-slate-500">
          Week of <span className="font-semibold text-slate-700">{new Date().toLocaleDateString()}</span>
        </div>
        <textarea 
          className="w-full h-96 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-simple-500 focus:border-transparent outline-none font-mono text-sm bg-slate-50 resize-none"
          placeholder="Type your report here or use AI Auto-Draft..."
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
        ></textarea>
        <div className="mt-4 flex justify-between items-center text-xs text-slate-400">
           <span>Markdown supported</span>
           <span>{reportContent.length} chars</span>
        </div>
      </div>
    </div>
  );
}

// 7. AI Chat Overlay
const AIChatOverlay = ({ isOpen, onClose, currentUser }: { isOpen: boolean, onClose: () => void, currentUser: User }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: `Hi ${currentUser.name.split(' ')[0]}! I'm the SimpleData AI. I can help you query database schemas, draft emails, or analyze project risks. What do you need?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await generateText(input, `You are SimpleData's corporate AI assistant. You are helpful, professional, and concise. Current user is ${currentUser.name} (${currentUser.role}).`);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'model', text: "I'm having trouble connecting to the neural network.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-slide-up font-sans">
      <div className="bg-simple-900 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
           <span className="font-semibold">SimpleData Assistant</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="fa-times" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-simple-600 text-white rounded-br-none' 
                : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-none'
            }`}>
              {msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-simple-500 outline-none text-sm"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-2 p-1.5 text-simple-600 hover:bg-white rounded-lg transition-colors"
          >
            <Icon name="fa-paper-plane" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- App Root ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Data
  const loadData = async () => {
    try {
      const [u, p] = await Promise.all([db.getUsers(), db.getProjects()]);
      setDbUsers(u);
      setDbProjects(p);
    } catch (e) {
      console.error("Failed to load DB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddProject = async (p: Project) => {
    await db.addProject(p);
    loadData();
  };

  const handleDeleteProject = async (id: string) => {
    if(confirm('Are you sure you want to delete this project?')) {
      await db.deleteProject(id);
      loadData();
    }
  };

  const handleAddUser = async (u: User) => {
    await db.addUser(u);
    loadData();
  };

  const handleDeleteUser = async (id: string) => {
    if(confirm('Are you sure you want to remove this user from SimpleData?')) {
      await db.deleteUser(id);
      loadData();
    }
  }

  // Login Screen
  if (!user) {
    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading SimpleData Ecosystem...</div>;

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-simple-900 rounded-2xl items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
              S
            </div>
            <h1 className="text-2xl font-bold text-simple-900">SimpleData Portal</h1>
            <p className="text-slate-500">Secure Access Login</p>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {dbUsers.map(u => (
              <button 
                key={u.id}
                onClick={() => setUser(u)}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-simple-200 transition-all group text-left"
              >
                <img src={u.avatar} className="w-10 h-10 rounded-full group-hover:ring-2 ring-simple-500 transition-all" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide truncate">{u.email}</p>
                </div>
                <Icon name="fa-chevron-right" className="ml-auto text-slate-300 group-hover:text-simple-500" />
              </button>
            ))}
          </div>
          <div className="mt-6 text-center text-xs text-slate-400">
             Protected by SimpleData Auth v2.1
          </div>
        </div>
      </div>
    );
  }

  // Main App Layout
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar 
        currentUser={user} 
        currentRoute={route} 
        onNavigate={setRoute} 
        onLogout={() => setUser(null)} 
      />
      
      <main className="pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-8">
          {route === AppRoute.DASHBOARD && <Dashboard currentUser={user} projects={dbProjects} users={dbUsers} />}
          {route === AppRoute.PROJECTS && <ProjectsView projects={dbProjects} users={dbUsers} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} />}
          {route === AppRoute.TEAM && <TeamView users={dbUsers} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />}
          {route === AppRoute.REPORTS && <ReportsView currentUser={user} projects={dbProjects} />}
          {route === AppRoute.TOOLS && <ToolsView />}
        </div>
      </main>

      {/* Chat FAB */}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-simple-900 text-white rounded-full shadow-lg hover:bg-simple-800 hover:scale-110 transition-all flex items-center justify-center text-2xl z-40"
        >
          <Icon name="fa-comment-dots" />
        </button>
      )}

      <AIChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUser={user} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);