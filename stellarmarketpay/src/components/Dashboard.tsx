'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { StellarAccount } from '@/types/stellar';
import { StellarService } from '@/lib/stellar';
import { AuthService } from '@/lib/auth';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [stellarAccount, setStellarAccount] = useState<StellarAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const account = await StellarService.loadAccount(user.stellarPublicKey);
        setStellarAccount(account);
        setBalance(account.balance);
      } catch (error) {
        console.error('Failed to load account:', error);
        // Account might not exist yet, set default values
        setStellarAccount({
          publicKey: user.stellarPublicKey,
          balance: '0',
          sequence: 0
        });
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    loadAccountData();
  }, [user.stellarPublicKey]);

  const handleLogout = () => {
    AuthService.clearAuth();
    onLogout();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // In a real app, you'd show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl">💰</span>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">StellarMarketPay</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-6 mb-8">
          <div className="text-white">
            <h2 className="text-lg font-medium mb-2">Your Balance</h2>
            <div className="text-3xl font-bold mb-4">
              {parseFloat(balance).toFixed(7)} XLM
            </div>
            <p className="text-green-100 text-sm">
              Stellar Network Balance
            </p>
          </div>
        </div>

        {/* Wallet Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stellar Wallet</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Public Key (Share this to receive payments)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={user.stellarPublicKey}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(user.stellarPublicKey)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Share this public key with customers to receive payments</p>
              <p>• Your account works on the Stellar Test Network</p>
              <p>• In production, this will be the main Stellar Network</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-green-600 text-3xl mb-4">📱</div>
            <h3 className="font-semibold text-gray-900 mb-2">QR Code</h3>
            <p className="text-sm text-gray-600">Generate payment QR code</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-blue-600 text-3xl mb-4">🔗</div>
            <h3 className="font-semibold text-gray-900 mb-2">Payment Link</h3>
            <p className="text-sm text-gray-600">Create shareable payment link</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-purple-600 text-3xl mb-4">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Sales Report</h3>
            <p className="text-sm text-gray-600">View transaction history</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-orange-600 text-3xl mb-4">💸</div>
            <h3 className="font-semibold text-gray-900 mb-2">Send Money</h3>
            <p className="text-sm text-gray-600">Transfer to family abroad</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">📋</div>
              <p>No transactions yet</p>
              <p className="text-sm mt-2">Start by generating a QR code or payment link</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
