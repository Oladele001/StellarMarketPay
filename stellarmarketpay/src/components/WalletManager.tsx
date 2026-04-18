'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { StellarAccount } from '@/types/stellar';
import { StellarService } from '@/lib/stellar';
import { AuthService } from '@/lib/auth';

interface WalletManagerProps {
  user: User;
  onAccountUpdate: (account: StellarAccount) => void;
}

export default function WalletManager({ user, onAccountUpdate }: WalletManagerProps) {
  const [stellarAccount, setStellarAccount] = useState<StellarAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountExists, setAccountExists] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [secretKey, setSecretKey] = useState<string | null>(null);

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const exists = await StellarService.accountExists(user.stellarPublicKey);
        setAccountExists(exists);

        if (exists) {
          const account = await StellarService.loadAccount(user.stellarPublicKey);
          setStellarAccount(account);
          onAccountUpdate(account);
        } else {
          const defaultAccount: StellarAccount = {
            publicKey: user.stellarPublicKey,
            balance: '0',
            sequence: 0
          };
          setStellarAccount(defaultAccount);
          onAccountUpdate(defaultAccount);
        }

        const storedSecretKey = AuthService.getStellarSecret(user.id);
        setSecretKey(storedSecretKey);
      } catch (error) {
        console.error('Failed to load account:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccountData();
  }, [user.stellarPublicKey, user.id, onAccountUpdate]);

  const fundAccount = async () => {
    if (!stellarAccount) return;
    
    setIsFunding(true);
    try {
      const success = await StellarService.fundTestnetAccount(stellarAccount.publicKey);
      if (success) {
        const updatedAccount = await StellarService.loadAccount(stellarAccount.publicKey);
        setStellarAccount(updatedAccount);
        setAccountExists(true);
        onAccountUpdate(updatedAccount);
      }
    } catch (error) {
      console.error('Failed to fund account:', error);
    } finally {
      setIsFunding(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        console.error('Clipboard API failed:', error);
      }
    }
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
  };

  const refreshBalance = async () => {
    if (!stellarAccount) return;
    
    try {
      const updatedAccount = await StellarService.loadAccount(stellarAccount.publicKey);
      setStellarAccount(updatedAccount);
      setAccountExists(true);
      onAccountUpdate(updatedAccount);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Wallet Manager</h3>
        <button
          onClick={refreshBalance}
          className="px-3 py-1 bg-primary-100 hover:bg-primary-200 rounded-md text-sm text-primary-700"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Account Status</span>
        <span className={`px-2 py-1 text-xs rounded-full ${
          accountExists 
            ? 'bg-stellar-100 text-stellar-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {accountExists ? 'Active' : 'Not Funded'}
        </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Balance</span>
            <span className="text-lg font-bold text-gray-900">
              {(stellarAccount ? parseFloat(stellarAccount.balance || '0').toFixed(7) : '0.0000000')} XLM
            </span>
          </div>
          
          {!accountExists && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
              <p className="text-sm text-yellow-800">
                Your account exists but needs funding to receive payments.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Account Information</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Public Key</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={user.stellarPublicKey}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-xs font-mono"
              />
              <button
                onClick={() => copyToClipboard(user.stellarPublicKey)}
                className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs text-gray-700"
              >
                Copy
              </button>
            </div>
          </div>

          {secretKey && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Secret Key</label>
              <div className="flex items-center space-x-2">
                <input
                  type={showSecretKey ? "text" : "password"}
                  value={secretKey}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-xs font-mono"
                />
                <button
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs text-gray-700"
                >
                  {showSecretKey ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => copyToClipboard(secretKey)}
                  className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs text-gray-700"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Keep your secret key secure and never share it with anyone!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {!accountExists && (
          <button
            onClick={fundAccount}
            disabled={isFunding}
            className="w-full px-4 py-2 bg-stellar-600 hover:bg-stellar-700 disabled:bg-stellar-300 text-white rounded-md font-medium text-sm transition-colors duration-200"
          >
            {isFunding ? 'Funding Account...' : 'Fund Testnet Account (10,000 XLM)'}
          </button>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>Testnet accounts are funded automatically for development.</p>
          <p>In production, you'll need to purchase XLM from an exchange.</p>
        </div>
      </div>
    </div>
  );
}
