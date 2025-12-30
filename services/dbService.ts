import { User, Project, Gem, ProjectLog } from '../types';
import { INITIAL_USERS, INITIAL_PROJECTS, INITIAL_GEMS } from '../constants';

// Local Storage Keys
// BUMPED TO V6 to force Armin's new project data to load
const USERS_KEY = 'simpledata_users_v6'; 
const PROJECTS_KEY = 'simpledata_projects_v6';
const GEMS_KEY = 'simpledata_gems_v6';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DBService {
  private users: User[] = [];
  private projects: Project[] = [];
  private gems: Gem[] = [];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    // 1. Load raw data from LocalStorage
    const savedUsers = localStorage.getItem(USERS_KEY);
    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    const savedGems = localStorage.getItem(GEMS_KEY);

    let localUsers: User[] = savedUsers ? JSON.parse(savedUsers) : [];
    let localProjects: Project[] = savedProjects ? JSON.parse(savedProjects) : [];
    let localGems: Gem[] = savedGems ? JSON.parse(savedGems) : [];

    // 2. SMART MERGE STRATEGY (Users)
    const mergedUsersMap = new Map<string, User>();
    // First local
    localUsers.forEach(u => mergedUsersMap.set(u.id, u));
    // Then code (Initial) overrides critical structural fields to ensure consistency
    INITIAL_USERS.forEach(initUser => {
        const existingUser = mergedUsersMap.get(initUser.id);
        if (existingUser) {
            // MERGE: Keep local changes but FORCE project list sync from code if it's the default user
            // This fixes the issue where Armin shows 2 projects instead of 4
            const combinedProjects = Array.from(new Set([...initUser.projects, ...existingUser.projects]));
            
            mergedUsersMap.set(initUser.id, {
                ...existingUser,
                projects: combinedProjects, // Ensure code-defined projects are present
                role: initUser.role, // Force role update from code
                name: initUser.name
            });
        } else {
            mergedUsersMap.set(initUser.id, initUser);
        }
    });
    this.users = Array.from(mergedUsersMap.values());

    // 3. SMART MERGE STRATEGY (Projects)
    const mergedProjectsMap = new Map<string, Project>();
    localProjects.forEach(p => mergedProjectsMap.set(p.id, p));
    INITIAL_PROJECTS.forEach(initProj => {
        const existingProj = mergedProjectsMap.get(initProj.id);
        if (existingProj) {
            mergedProjectsMap.set(initProj.id, {
                ...existingProj,
                // Force critical fields from code
                client: initProj.client,
                name: initProj.name,
                teamIds: Array.from(new Set([...initProj.teamIds, ...existingProj.teamIds]))
            });
        } else {
            mergedProjectsMap.set(initProj.id, initProj);
        }
    });
    this.projects = Array.from(mergedProjectsMap.values());

    // 4. Gems
    const mergedGemsMap = new Map<string, Gem>();
    localGems.forEach(g => mergedGemsMap.set(g.id, g));
    INITIAL_GEMS.forEach(g => mergedGemsMap.set(g.id, g));
    this.gems = Array.from(mergedGemsMap.values());

    this.saveAll();
  }

  private saveAll() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects));
    localStorage.setItem(GEMS_KEY, JSON.stringify(this.gems));
  }

  // --- FORCE RESET ---
  async resetToDefaults(): Promise<void> {
      await delay(500);
      // Hard reset to constants
      this.users = [...INITIAL_USERS];
      this.projects = [...INITIAL_PROJECTS];
      this.gems = [...INITIAL_GEMS];
      this.saveAll();
  }

  // --- User Operations ---
  async getUsers(): Promise<User[]> {
    await delay(300);
    return [...this.users];
  }

  async addUser(user: User): Promise<void> {
    await delay(500);
    this.users.push(user);
    this.saveAll();
  }

  async updateUser(user: User): Promise<void> {
    await delay(300);
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
      this.saveAll();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    await delay(400);
    this.users = this.users.filter(u => u.id !== userId);
    this.saveAll();
  }

  // --- Project Operations ---
  async getProjects(): Promise<Project[]> {
    await delay(300);
    return [...this.projects];
  }

  async addProject(project: Project): Promise<void> {
    await delay(500);
    this.projects.push(project);
    this.saveAll();
  }

  async updateProject(project: Project): Promise<void> {
    await delay(300);
    const index = this.projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      this.projects[index] = project;
      this.saveAll();
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    await delay(400);
    this.projects = this.projects.filter(p => p.id !== projectId);
    this.saveAll();
  }

  async addProjectLog(projectId: string, log: ProjectLog): Promise<void> {
    await delay(300);
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
        if (!project.logs) project.logs = [];
        project.logs.push(log);
        this.saveAll();
    }
  }

  // --- Gem Operations ---
  async getGems(): Promise<Gem[]> {
    await delay(200);
    return [...this.gems];
  }

  async addGem(gem: Gem): Promise<void> {
    await delay(300);
    this.gems.push(gem);
    this.saveAll();
  }
}

export const db = new DBService();