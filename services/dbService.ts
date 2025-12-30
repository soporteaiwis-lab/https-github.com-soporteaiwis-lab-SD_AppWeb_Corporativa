import { User, Project, Gem, ProjectLog } from '../types';
import { INITIAL_USERS, INITIAL_PROJECTS, INITIAL_GEMS } from '../constants';

// Local Storage Keys
const USERS_KEY = 'simpledata_users_v4'; // Bumped version to v4 to trigger clean merge logic
const PROJECTS_KEY = 'simpledata_projects_v4';
const GEMS_KEY = 'simpledata_gems_v4';

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
    // We want to keep user-created users, but also ensure INITIAL_USERS from code are present and updated.
    const mergedUsersMap = new Map<string, User>();

    // First, load local users into map
    localUsers.forEach(u => mergedUsersMap.set(u.id, u));

    // Then, merge INITIAL_USERS
    INITIAL_USERS.forEach(initUser => {
        const existingUser = mergedUsersMap.get(initUser.id);
        if (existingUser) {
            // User exists locally. We merge critical fields that might have changed in code (like default project assignments)
            // But we preserve fields that might be user-edited (like custom skills added in UI)
            
            // Merge Projects: Union of existing IDs and Initial IDs (Deduplicated)
            const combinedProjects = Array.from(new Set([...existingUser.projects, ...initUser.projects]));
            
            mergedUsersMap.set(initUser.id, {
                ...existingUser, // Keep local changes
                projects: combinedProjects, // Ensure new code-level project assignments are added
                // Update role/email/name from code to ensure fixes apply, assuming code is source of truth for "Employees"
                // Password is kept from existingUser if set, else initUser
                role: initUser.role,
                name: initUser.name,
                email: initUser.email
            });
        } else {
            // New user in code (e.g. Armin), add them
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
            // Project exists. Ensure fields like description/technologies are updated from code
            // but keep status/progress/logs from local storage (user activity)
            mergedProjectsMap.set(initProj.id, {
                ...existingProj,
                // Optional: Update static fields if you want code to override descriptions
                description: initProj.description,
                technologies: initProj.technologies,
                // CRITICAL: Ensure startDate/deadline structure is valid
                startDate: existingProj.startDate || initProj.startDate,
                deadline: existingProj.deadline || initProj.deadline
            });
        } else {
            mergedProjectsMap.set(initProj.id, initProj);
        }
    });

    this.projects = Array.from(mergedProjectsMap.values());

    // 4. SMART MERGE STRATEGY (Gems)
    // Simple overwrite for gems usually, or append. Let's distinct by ID.
    const mergedGemsMap = new Map<string, Gem>();
    localGems.forEach(g => mergedGemsMap.set(g.id, g));
    INITIAL_GEMS.forEach(g => mergedGemsMap.set(g.id, g)); // Code overwrites local for Gems to keep URLs updated
    this.gems = Array.from(mergedGemsMap.values());

    // 5. SAVE BACK TO ENSURE PERSISTENCE
    this.saveUsers();
    this.saveProjects();
    this.saveGems();
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