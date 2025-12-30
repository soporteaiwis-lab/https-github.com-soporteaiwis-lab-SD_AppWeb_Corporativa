import { User, UserRole, Project, Gem } from './types';

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
    projects: ['PROYECTO_001', 'PROYECTO_003']
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
    projects: ['PROYECTO_001', 'PROYECTO_002']
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
    projects: ['PROYECTO_001']
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
    projects: ['PROYECTO_001', 'PROYECTO_003']
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
    projects: ['PROYECTO_002']
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
    projects: ['PROYECTO_003']
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
    projects: ['PROYECTO_002']
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
    projects: ['PROYECTO_001', 'PROYECTO_003']
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
    projects: ['PROYECTO_002']
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PROYECTO_001',
    name: 'Sistema de Facturación Interna',
    client: 'Interno SimpleData',
    encargadoCliente: 'Gerencia Admin',
    leadId: 'u2',
    teamIds: ['u3', 'u4', 'u8'],
    status: 'En Curso',
    isOngoing: true,
    report: true,
    startDate: '2025-01-15',
    deadline: '2025-06-30',
    progress: 45,
    year: 2025,
    description: 'Desarrollar un sistema interno para la facturación y cobranza de servicios. Debe integrarse con el sistema de contabilidad.',
    technologies: ['AWS', 'Python', 'Spark', 'Terraform'],
    logs: [
      { id: 'l1', date: '2025-02-10T10:00:00', text: 'Inicio de la fase de diseño de arquitectura.', author: 'Armin Salazar' },
      { id: 'l2', date: '2025-02-12T14:30:00', text: 'Reunión con contabilidad para definir esquema de base de datos.', author: 'Gabriel Martinez' }
    ],
    driveLink: 'https://drive.google.com/drive/folders/1S3Zavf6xdp9WaM8-gowBJImdkmSD_Niw',
    githubLink: 'https://github.com/soporteaiwis-lab/SIMPLEDATA-APP'
  },
  {
    id: 'PROYECTO_002',
    name: 'Desarrollo de App Móvil Clientes',
    client: 'Cliente Retail XYZ',
    encargadoCliente: 'Gerente de Innovación',
    leadId: 'u2',
    teamIds: ['u5', 'u7', 'u9'],
    status: 'En Curso',
    isOngoing: true,
    report: true,
    startDate: '2025-03-01',
    deadline: '2025-09-01',
    progress: 10,
    year: 2025,
    description: 'App móvil para iOS y Android que permita a los clientes finales visualizar su estado de cuenta, revisar catálogos y realizar compras.',
    technologies: ['React Native', 'Node.js', 'Firebase'],
    logs: [],
    driveLink: '',
    githubLink: 'https://github.com/soporteaiwis-lab/SIMPLEDATA-APP'
  },
  {
    id: 'PROYECTO_003',
    name: 'Migración de Servidores a la Nube',
    client: 'Empresa Logística ABC',
    encargadoCliente: 'Jefe de IT',
    leadId: 'u1',
    teamIds: ['u4', 'u6', 'u8'],
    status: 'Finalizado',
    isOngoing: false,
    report: false,
    startDate: '2024-10-01',
    deadline: '2024-12-20',
    progress: 100,
    year: 2024,
    description: 'Migrar la infraestructura on-premise del cliente a un entorno cloud en AWS, optimizando costos y mejorando la escalabilidad.',
    technologies: ['AWS', 'Docker', 'Linux'],
    logs: [
       { id: 'l1', date: '2024-12-20T18:00:00', text: 'Proyecto finalizado y entregado al cliente.', author: 'Gonzalo Arias' }
    ],
    driveLink: '',
    githubLink: ''
  }
];

export const INITIAL_GEMS: Gem[] = [
    { id: 'g1', url: 'https://gemini.google.com/gem/6257c452aac9', name: 'COTIZACIONES', description: 'Asistente experto en la generación y análisis de cotizaciones.', icon: 'fa-calculator' },
    { id: 'g2', url: 'https://gemini.google.com/gem/fa10051c004b', name: 'PIPELINES AZURE', description: 'Especialista en crear pipelines de Azure y archivos JSON.', icon: 'fa-cloud' },
    { id: 'g3', url: 'https://gemini.google.com/gem/4ca9a51fdffc', name: 'MAPEO DATA BRICKS', description: 'Analista de código para mapear y entender notebooks de Data Bricks.', icon: 'fa-project-diagram' },
    { id: 'g4', url: 'https://gemini.google.com/gem/1dbe6e06847f', name: 'FACTORIA COBOL', description: 'Herramienta para la modernización y análisis de código COBOL.', icon: 'fa-code' },
    { id: 'g5', url: 'https://gemini.google.com/gem/910761c1caf2', name: 'ANALIZADOR REQUERMIENTOS', description: 'IA para analizar y desglosar requerimientos de software complejos.', icon: 'fa-brain' },
    { id: 'g6', url: 'https://gemini.google.com/gem/5745999ccff7', name: 'QUIZ CAPACITACIONES', description: 'Generador de cuestionarios y quizzes para material de capacitación.', icon: 'fa-graduation-cap' }
];

export const TOOLS_LINKS = [
  { name: 'VS Code Web', url: 'https://vscode.dev', icon: 'fa-code', color: 'text-blue-500' },
  { name: 'Azure Portal', url: 'https://portal.azure.com', icon: 'fa-cloud', color: 'text-blue-400' },
  { name: 'AWS Console', url: 'https://aws.amazon.com/console/', icon: 'fa-server', color: 'text-orange-500' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'fa-bolt', color: 'text-emerald-500' },
  { name: 'Gemini', url: 'https://gemini.google.com', icon: 'fa-gem', color: 'text-purple-500' },
  { name: 'Firebase Console', url: 'https://console.firebase.google.com', icon: 'fa-fire', color: 'text-yellow-500' },
  { name: 'MongoDB Atlas', url: 'https://cloud.mongodb.com', icon: 'fa-leaf', color: 'text-green-500' },
  { name: 'GitHub', url: 'https://github.com', icon: 'fa-github', color: 'text-slate-800' },
];