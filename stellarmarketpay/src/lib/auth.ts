import { User, AuthState, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth';
import { StellarService } from './stellar';

// In-memory storage for demo (replace with database in production)
let users: User[] = [];
let sessions: Map<string, User> = new Map();

export class AuthService {
  // Generate a simple JWT-like token (replace with proper JWT in production)
  private static generateToken(userId: string): string {
    return btoa(`${userId}:${Date.now()}:${Math.random()}`);
  }

  // Hash password (simple implementation - use bcrypt in production)
  private static hashPassword(password: string): string {
    return btoa(password + 'stellar_salt');
  }

  // Verify password
  private static verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  // Register new user
  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = users.find(u => u.email === credentials.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create Stellar account for the user
    const stellarAccount = StellarService.createAccount();

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email,
      name: credentials.name,
      stellarPublicKey: stellarAccount.publicKey,
      isVerified: false, // Email verification would go here
      createdAt: new Date()
    };

    // Store user (in production, store in database)
    users.push(newUser);

    // Store password separately (in production, store hashed password)
    const passwordHash = this.hashPassword(credentials.password);
    localStorage.setItem(`password_${newUser.id}`, passwordHash);

    // Store Stellar secret key securely (in production, encrypt this)
    localStorage.setItem(`stellar_secret_${newUser.id}`, stellarAccount.secretKey!);

    const token = this.generateToken(newUser.id);
    sessions.set(token, newUser);

    return {
      user: newUser,
      token
    };
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = users.find(u => u.email === credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const storedPasswordHash = localStorage.getItem(`password_${user.id}`);
    if (!storedPasswordHash || !this.verifyPassword(credentials.password, storedPasswordHash)) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();

    const token = this.generateToken(user.id);
    sessions.set(token, user);

    return {
      user,
      token
    };
  }

  // Logout user
  static logout(token: string): void {
    sessions.delete(token);
  }

  // Get user from token
  static getUserFromToken(token: string): User | null {
    return sessions.get(token) || null;
  }

  // Get user's Stellar secret key
  static getStellarSecret(userId: string): string | null {
    return localStorage.getItem(`stellar_secret_${userId}`);
  }

  // Check if user is authenticated
  static isAuthenticated(token: string): boolean {
    return sessions.has(token);
  }

  // Get current user from localStorage
  static getCurrentUser(): User | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    return this.getUserFromToken(token);
  }

  // Persist authentication
  static persistAuth(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  // Clear authentication
  static clearAuth(): void {
    localStorage.removeItem('auth_token');
  }

  // Initialize auth from localStorage
  static initializeAuth(): User | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    const user = this.getUserFromToken(token);
    if (!user) {
      this.clearAuth();
      return null;
    }
    
    return user;
  }
}
