'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { AuthService } from '@/lib/auth';
import { isConnected, requestAccess, getNetwork } from '@stellar/freighter-api';

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFreighter, setHasFreighter] = useState(false);

  useEffect(() => {
    const checkFreighter = async () => {
      try {
        const response = await isConnected();
        setHasFreighter(Boolean(response.isConnected));
      } catch (e) {
        setHasFreighter(false);
      }
    };
    checkFreighter();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!hasFreighter) {
        window.open('https://freighter.app/', '_blank');
        setError('Freighter wallet is not installed. Please install it and refresh.');
        return;
      }

      // 1. Get Public Key from Freighter via requestAccess
      const accessResponse = await requestAccess();
      if (accessResponse.error || !accessResponse.address) {
        setError(accessResponse.error || 'Connection request rejected.');
        return;
      }
      const publicKey = accessResponse.address;

      // 2. BLOCKING Network check
      // Network check AFTER connect (non-blocking)
      const netResponse = await getNetwork();
      console.log('Connected on network:', netResponse.network);
      let networkWarning = '';
      if (netResponse.network !== 'TESTNET') {
        networkWarning = `Warning: On ${netResponse.network}. Switch to TESTNET in extension for full features.`;
        console.warn(networkWarning);
      }

      // 3. Connect User
      const user = await AuthService.connectWallet(publicKey);
      onAuthSuccess(user);
    } catch (err: any) {
      console.error('AuthForm connect failed:', err);
        setError(`Connection failed: ${err?.message || 'Unknown error'}. Steps: 1) Unlock Freighter 2) TESTNET network 3) Disable popup blocker 4) Refresh. Check F12 console.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstall = () => {
    window.open('https://freighter.app/', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
        <div>
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <span className="text-4xl text-green-400">⚡</span>
          </div>
          <h2 className="mt-8 text-center text-3xl font-extrabold text-white tracking-tight">
            Accept instant payments with Stellar — almost zero fees
          </h2>
          <p className="mt-3 text-center text-sm text-gray-400">
            A beautiful, mobile-first app designed to help you accept instant payments securely without any middlemen.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm text-center font-medium animate-in fade-in slide-in-from-bottom-2">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isLoading || !hasFreighter}
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-gray-950 bg-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-950 mr-3"></div>
                Connecting...
              </span>
            ) : (
              'Connect Freighter Wallet'
            )}
          </button>

          {!hasFreighter && (
            <button
              onClick={handleInstall}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-gray-700 text-sm font-bold rounded-xl text-white bg-transparent hover:bg-gray-800 transition-all duration-300"
            >
              I don't have a wallet yet
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="relative flex justify-center text-xs">
            <span className="bg-gray-900 px-4 text-gray-500 flex items-center space-x-2">
              <span>Powered by Stellar Horizon Testnet</span>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
