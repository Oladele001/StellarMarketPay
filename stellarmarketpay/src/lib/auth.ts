import { User } from '@/types/auth';

export class AuthService {
  private static readonly STORAGE_KEY = 'connected_stellar_wallet_user';

  // Login using Freighter public key
  static async connectWallet(publicKey: string): Promise<User> {
    // We create a mock user object for the platform based on their wallet public key.
    const user: User = {
      id: publicKey.substring(0, 10), // mock ID based on the key
      email: `${publicKey.substring(0, 8)}@stellar.wallet`, // fake email to satisfy User interface
      name: `User ${publicKey.substring(0, 5)}`,
      stellarPublicKey: publicKey,
      isVerified: true,
      createdAt: new Date(),
      lastLogin: new Date()
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
    // Secret keys fall out of scope with Freighter as Freighter manages the secrets.
    return null;
  }
}
