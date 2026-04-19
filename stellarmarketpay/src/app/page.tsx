'use client';

import { useState } from 'react';
import { requestAccess } from '@stellar/freighter-api';
import Dashboard from '@/components/Dashboard';
import { AuthService } from '@/lib/auth';
import { StellarService } from '@/lib/stellar';
import { User } from '@/types/auth';

export default function Home() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState({ xlm: '0', usdc: '0' });

  const connectToFreighter = async () => {
    setIsLoading(true);

    try {
      // This MUST trigger the popup
      const result = await requestAccess();
      
      if (result.error) {
        throw new Error(result.error.message || 'Connection rejected');
      }

      const pk = result.address;
      setPublicKey(pk);
      console.log("Successfully connected:", pk);
      
      // Set user for dashboard
      const connectedUser = await AuthService.connectWallet(pk!);
      setUser(connectedUser);
      
    } catch (error: any) {
      console.error("Freighter connection error:", error);
      setError("Freighter popup did not appear. Please check console (F12) and make sure Freighter is unlocked on Testnet.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    AuthService.clearAuth();
    setPublicKey(null);
    setUser(null);
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)] mb-6">
            <span className="text-4xl text-green-400">⚡</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Accept instant payments with Stellar — almost zero fees
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Mobile-first app to accept Stellar payments securely.
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={connectToFreighter}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-gray-950 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-950 mr-3"></div>
                Connecting...
              </>
            ) : (
              'Connect Freighter Wallet'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              No wallet? <a href="https://freighter.app" target="_blank" rel="noreferrer" className="text-green-400 hover:text-green-300 font-medium">Get Freighter</a>
            </p>
          </div>

          <div className="pt-6 border-t border-gray-800 text-xs text-gray-500 text-center">
            <p>Testnet • Powered by Stellar Horizon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
