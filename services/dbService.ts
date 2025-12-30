import { User, Project, Gem, ProjectLog } from '../types';
import { INITIAL_USERS, INITIAL_PROJECTS, INITIAL_GEMS } from '../constants';

// Local Storage Keys
const USERS_KEY = 'simpledata_users_v3'; // Version bumped to force refresh if needed, but logic below handles merges
const PROJECTS_KEY = 'simpledata_projects_v2';
const GEMS_KEY = 'simpledata_gems_v1';

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
    const savedUsers = localStorage.getItem(USERS_KEY);
    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    const savedGems = localStorage.getItem(GEMS_KEY);

    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
      // Merge strategy: Ensure initial admins/users exist if LS was cleared or old
      if (this.users.length < INITIAL_USERS.length) {
          // Rudimentary merge: Add missing INITIAL users by email
          INITIAL_USERS.forEach(initUser => {
              if (!this.users.find(u => u.email === initUser.email)) {
                  this.users.push(initUser);
              }
          });
          this.saveUsers();
      }
    } else {
      this.users = [...INITIAL_USERS];
      this.saveUsers();
    }

    if (savedProjects) {
      this.projects = JSON.parse(savedProjects);
    } else {
      this.projects = [...INITIAL_PROJECTS];
      this.saveProjects();
    }

    if (savedGems) {
      this.gems = JSON.parse(savedGems);
    } else {
      this.gems = [...INITIAL_GEMS];
      this.saveGems();
    }
  }

  private saveUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
  }

  private saveProjects() {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects));
  }

  private saveGems() {
    localStorage.setItem(GEMS_KEY, JSON.stringify(this.gems));
  }

  // --- User Operations ---
  async getUsers(): Promise<User[]> {
    await delay(300);
    return [...this.users];
  }

  async addUser(user: User): Promise<void> {
    await delay(500);
    this.users.push(user);
    this.saveUsers();
  }

  async updateUser(user: User): Promise<void> {
    await delay(300);
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
      this.saveUsers();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    await delay(400);
    this.users = this.users.filter(u => u.id !== userId);
    this.saveUsers();
  }

  // --- Project Operations ---
  async getProjects(): Promise<Project[]> {
    await delay(300);
    return [...this.projects];
  }

  async addProject(project: Project): Promise<void> {
    await delay(500);
    this.projects.push(project);
    this.saveProjects();
  }

  async updateProject(project: Project): Promise<void> {
    await delay(300);
    const index = this.projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      this.projects[index] = project;
      this.saveProjects();
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    await delay(400);
    this.projects = this.projects.filter(p => p.id !== projectId);
    this.saveProjects();
  }

  async addProjectLog(projectId: string, log: ProjectLog): Promise<void> {
    await delay(300);
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
        if (!project.logs) project.logs = [];
        project.logs.push(log);
        this.saveProjects();
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
    this.saveGems();
  }
}

export const db = new DBService();