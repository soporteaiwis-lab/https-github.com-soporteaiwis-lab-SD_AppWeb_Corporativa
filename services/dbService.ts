import { User, Project } from '../types';
import { INITIAL_USERS, INITIAL_PROJECTS } from '../constants';

/**
 * DB SERVICE (Simulating Firebase Firestore)
 * 
 * In a real implementation, you would initialize Firebase here:
 * 
 * import { initializeApp } from "firebase/app";
 * import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
 * 
 * const firebaseConfig = { ... };
 * const app = initializeApp(firebaseConfig);
 * const db = getFirestore(app);
 */

// Local Storage Keys to persist data during simulation
const USERS_KEY = 'simpledata_users_v1';
const PROJECTS_KEY = 'simpledata_projects_v1';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DBService {
  private users: User[] = [];
  private projects: Project[] = [];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    const savedUsers = localStorage.getItem(USERS_KEY);
    const savedProjects = localStorage.getItem(PROJECTS_KEY);

    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
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
  }

  private saveUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
  }

  private saveProjects() {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects));
  }

  // --- User Operations ---

  async getUsers(): Promise<User[]> {
    await delay(300); // Simulate network
    return [...this.users];
  }

  async addUser(user: User): Promise<void> {
    await delay(500);
    this.users.push(user);
    this.saveUsers();
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

  async deleteProject(projectId: string): Promise<void> {
    await delay(400);
    this.projects = this.projects.filter(p => p.id !== projectId);
    this.saveProjects();
  }
}

export const db = new DBService();