'use client';

import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import Dashboard from '@/components/Dashboard';
import { AuthService } from '@/lib/auth';
import { User } from '@/types/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const currentUser = AuthService.initializeAuth();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading StellarMarketPay...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return <AuthForm onAuthSuccess={handleAuthSuccess} />;
}
