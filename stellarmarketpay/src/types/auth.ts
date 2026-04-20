export interface User {
  id: string;
  email: string;
  name: string;
  stellarPublicKey: string;
  isVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
  networkWarning?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  businessName?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
