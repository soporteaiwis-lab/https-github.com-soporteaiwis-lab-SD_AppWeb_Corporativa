
export enum UserRole {
  ADMIN = 'Super Admin',
  CEO = 'CEO',
  PROJECT_MANAGER = 'Project Manager',
  DEVELOPER = 'Developer',
  DESIGNER = 'Designer',
  ANALYST = 'Analyst'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string; // New field for authentication
  avatar: string;
  skills: { name: string; level: number }[]; // 0-100
  projects: string[]; // Project IDs
}

export interface ProjectLog {
  id: string;
  date: string; // ISO string
  text: string;
  author: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  encargadoCliente?: string; // Client Contact
  leadId: string; // Internal JP
  teamIds: string[];
  status: 'En Curso' | 'Finalizado' | 'Planning';
  isOngoing: boolean;
  report: boolean; // For weekly report inclusion
  deadline: string; // Used as End Date
  startDate?: string;
  progress: number; // 0-100
  description: string;
  technologies: string[];
  year: number;
  logs: ProjectLog[];
  driveLink?: string;
  githubLink?: string;
}

export interface Gem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  PROJECTS = 'projects',
  GEMS = 'gems',
  TEAM = 'team',
  REPORTS = 'reports',
  TOOLS = 'tools',
  ADMIN = 'admin_panel' // New Route
}
