export enum UserRole {
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
  avatar: string;
  skills: { name: string; level: number }[]; // 0-100
  projects: string[]; // Project IDs
}

export interface Project {
  id: string;
  name: string;
  client: string;
  leadId: string;
  teamIds: string[];
  status: 'In Progress' | 'Completed' | 'On Hold' | 'Planning';
  deadline: string;
  progress: number; // 0-100
  description: string;
  technologies: string[];
}

export interface WeeklyReport {
  id: string;
  userId: string;
  weekStarting: string;
  content: string;
  projectsWorkedOn: string[];
  blockers: string;
  status: 'Draft' | 'Submitted';
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
  TEAM = 'team',
  REPORTS = 'reports',
  TOOLS = 'tools'
}