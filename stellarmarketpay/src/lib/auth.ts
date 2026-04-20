// src/lib/auth.ts
import { User } from '@/types/auth';

export class AuthService {
  private static readonly STORAGE_KEY = 'connected_stellar_wallet_user';

  // Connect wallet with optional network warning
  static async connectWallet(
    publicKey: string, 
    networkWarning: string = ''
  ): Promise<User> {
    
    const user: User = {
      id: publicKey.substring(0, 10),
      email: `${publicKey.substring(0, 8)}@stellar.wallet`,
      name: `User ${publicKey.substring(0, 5)}`,
      stellarPublicKey: publicKey,
      isVerified: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      networkWarning: networkWarning || undefined
    };
    
    this.persistAuth(user);
    return user;
  }

  // Logout user
  static logout(): void {
    this.clearAuth();
  }

  // Persist authentication in localStorage
  private static persistAuth(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      }));
    }
  }

  // Clear authentication
  static clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Initialize auth from localStorage
  static initializeAuth(): User | null {
    if (typeof window === 'undefined') return null;
    
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    if (!storedUser) return null;
    
    try {
      const parsed = JSON.parse(storedUser);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastLogin: parsed.lastLogin ? new Date(parsed.lastLogin) : undefined
      };
    } catch (e) {
      this.clearAuth();
      return null;
    }
  }

  static getStellarSecret(userId: string): string | null {
    return null;
  }
}