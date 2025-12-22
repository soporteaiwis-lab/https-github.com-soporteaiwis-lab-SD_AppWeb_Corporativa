import { User, UserRole, Project } from './types';

// Real SimpleData Team
export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Gonzalo Arias',
    role: UserRole.CEO,
    email: 'gonzalo.arias@simpledata.cl',
    avatar: 'https://ui-avatars.com/api/?name=Gonzalo+Arias&background=0D8ABC&color=fff',
    skills: [
      { name: 'Leadership', level: 100 },
      { name: 'Strategic Planning', level: 95 },
      { name: 'Business Intelligence', level: 90 },
      { name: 'Cloud Architecture', level: 90 }
    ],
    projects: ['p1', 'p2', 'p3']
  },
  {
    id: 'u2',
    name: 'Armin Salazar',
    role: UserRole.PROJECT_MANAGER,
    email: 'soporte.aiwis@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=Armin+Salazar&background=ff0000&color=fff',
    skills: [
      { name: 'Project Management', level: 95 },
      { name: 'Scrum', level: 90 },
      { name: 'Support', level: 95 },
      { name: 'Client Relations', level: 85 }
    ],
    projects: ['p1', 'p2']
  },
  {
    id: 'u3',
    name: 'Gabriel Martinez',
    role: UserRole.DEVELOPER,
    email: 'gabriel.martinez@simpledata.cl',
    avatar: 'https://ui-avatars.com/api/?name=Gabriel+Martinez&background=random',
    skills: [
      { name: 'Full Stack', level: 90 },
      { name: 'React', level: 85 },
      { name: 'Node.js', level: 85 }
    ],
    projects: ['p1']
  },
  {
    id: 'u4',
    name: 'Francisco Valenzuela',
    role: UserRole.DEVELOPER,
    email: 'francisco.valenzuela@simpledata.cl',
    avatar: 'https://ui-avatars.com/api/?name=Francisco+Valenzuela&background=random',
    skills: [
      { name: 'Backend', level: 92 },
      { name: 'Python', level: 88 },
      { name: 'SQL', level: 90 }
    ],
    projects: ['p1', 'p3']
  },
  {
    id: 'u5',
    name: 'Anibal Alcazar',
    role: UserRole.DEVELOPER,
    email: 'anibal.alcazar@simpledata.cl',
    avatar: 'https://ui-avatars.com/api/?name=Anibal+Alcazar&background=random',
    skills: [
      { name: 'Frontend', level: 90 },
      { name: 'UI/UX Implementation', level: 85 },
      { name: 'JavaScript', level: 92 }
    ],
    projects: ['p2']
  },
  {
    id: 'u6',
    name: 'Juan Escalona',
    role: UserRole.DEVELOPER,
    email: 'juan.escalona@simpledata.cl',
    avatar: 'https://ui-avatars.com/api/?name=Juan+Escalona&background=random',
    skills: [
      { name: 'DevOps', level: 85 },
      { name: 'Cloud Infrastructure', level: 88 },
      { name: 'Security', level: 80 }
    ],
    projects: ['p3']
  },
  {
    id: 'u7',
    name: 'Cristobal Arias',
    role: UserRole.DEVELOPER,
    email: 'cristobal.ariasb@simpledata.cl',
    avatar: 'https://ui-avatars.com/api/?name=Cristobal+Arias&background=random',
    skills: [
      { name: 'Mobile Dev', level: 85 },
      { name: 'Flutter', level: 80 },
      { name: 'API Integration', level: 85 }
    ],
    projects: ['p2']
  },
  {
    id: 'u8',
    name: 'Alejandro Venegas',
    role: UserRole.ANALYST,
    email: 'alejandro.venegas@simpledata.cl',
    avatar: 'https://ui-avatars.com/api/?name=Alejandro+Venegas&background=random',
    skills: [
      { name: 'QA Automation', level: 90 },
      { name: 'Data Analysis', level: 85 },
      { name: 'Testing', level: 92 }
    ],
    projects: ['p1', 'p3']
  },
  {
    id: 'u9',
    name: 'Fernando Cid',
    role: UserRole.DESIGNER,
    email: 'fernando.cid@simpledata.cl',
    avatar: 'https://ui-avatars.com/api/?name=Fernando+Cid&background=random',
    skills: [
      { name: 'Product Design', level: 95 },
      { name: 'Figma', level: 98 },
      { name: 'Prototyping', level: 90 }
    ],
    projects: ['p2']
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Data Lake Migration',
    client: 'Retail Corp',
    leadId: 'u2',
    teamIds: ['u3', 'u4', 'u8'],
    status: 'In Progress',
    deadline: '2025-06-30',
    progress: 45,
    description: 'Migration of on-premise legacy data warehouse to AWS S3 + Glue.',
    technologies: ['AWS', 'Python', 'Spark', 'Terraform']
  },
  {
    id: 'p2',
    name: 'Sales Dashboard V2',
    client: 'FinTech Group',
    leadId: 'u2',
    teamIds: ['u5', 'u7', 'u9'],
    status: 'Planning',
    deadline: '2025-08-15',
    progress: 10,
    description: 'Real-time sales visualization using PowerBI embedded in a React app.',
    technologies: ['React', 'PowerBI', 'Azure']
  },
  {
    id: 'p3',
    name: 'Predictive Maintenance Model',
    client: 'Mining Co',
    leadId: 'u1',
    teamIds: ['u4', 'u6', 'u8'],
    status: 'Completed',
    deadline: '2025-01-20',
    progress: 100,
    description: 'ML model to predict machinery failure based on sensor logs.',
    technologies: ['Python', 'TensorFlow', 'IoT']
  }
];

export const TOOLS_LINKS = [
  { name: 'VS Code Web', url: 'https://vscode.dev', icon: 'fa-code', color: 'text-blue-500' },
  { name: 'Google Sheets', url: 'https://sheets.google.com', icon: 'fa-file-excel', color: 'text-green-600' },
  { name: 'Google Meet', url: 'https://meet.google.com', icon: 'fa-video', color: 'text-teal-500' },
  { name: 'Azure Portal', url: 'https://portal.azure.com', icon: 'fa-cloud', color: 'text-blue-400' },
  { name: 'AWS Console', url: 'https://aws.amazon.com/console/', icon: 'fa-server', color: 'text-orange-500' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'fa-bolt', color: 'text-emerald-500' },
  { name: 'Gemini', url: 'https://gemini.google.com', icon: 'fa-gem', color: 'text-purple-500' },
  { name: 'Firebase Console', url: 'https://console.firebase.google.com', icon: 'fa-fire', color: 'text-yellow-500' },
];