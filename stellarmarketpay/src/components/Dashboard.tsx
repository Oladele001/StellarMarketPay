'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { StellarService } from '@/lib/stellar';
import { AuthService } from '@/lib/auth';
import CreatePaymentModal from './CreatePaymentModal';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState('0');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [successToast, setSuccessToast] = useState<{show: boolean, memo: string, message: string}>({ show: false, memo: '', message: '' });

  // Initial Data Load
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [account, history] = await Promise.all([
          StellarService.loadAccount(user.stellarPublicKey).catch(() => ({ balance: '0' })),
          StellarService.getTransactionHistory(user.stellarPublicKey).catch(() => [])
        ]);

        if (isMounted) {
          setBalance(account.balance);
          setRecentTransactions(history);
        }
      } catch (error) {
        console.error('Failed to load Dashboard data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user.stellarPublicKey]);

  // Real-time Transaction Polling
  useEffect(() => {
    const cleanupStream = StellarService.streamTransactions(user.stellarPublicKey, async (tx) => {
      console.log('New Transaction via Stream:', tx);
      
      // Flash success toast
      const memo = tx.memo || 'No Memo';
      setSuccessToast({
        show: true,
        memo,
        message: 'Payment Received!'
      });

      // Refetch balance
      try {
        const account = await StellarService.loadAccount(user.stellarPublicKey);
        setBalance(account.balance);
      } catch (e) {}

      // Add to recent history (optimistic or actual)
      setRecentTransactions((prev) => [tx, ...prev].slice(0, 10));

      // Hide toast after 5s
      setTimeout(() => {
        setSuccessToast(prev => ({ ...prev, show: false }));
      }, 5000);
    });

    return () => {
      cleanupStream();
    };
  }, [user.stellarPublicKey]);

  const handleLogout = () => {
    AuthService.clearAuth();
    onLogout();
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const truncatedKey = `${user.stellarPublicKey.substring(0, 6)}...${user.stellarPublicKey.substring(user.stellarPublicKey.length - 4)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-green-400 font-medium">Syncing with Horizon Testnet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-green-500/30">
      
      {/* Success Toast Overlay */}
      {successToast.show && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 p-4 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.4)] flex items-center space-x-3 border-2 border-green-400">
             <div className="bg-white/20 rounded-full p-1 animate-bounce">
               <svg className="w-6 h-6 text-gray-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
             </div>
             <div>
               <p className="font-bold text-lg leading-tight">{successToast.message}</p>
               <p className="text-sm font-medium text-green-900">Memo: {successToast.memo}</p>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 backdrop-blur-sm bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <span className="text-green-400">⚡</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                StellarMarketPay
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-gray-300">Testnet</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 text-sm font-medium transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Row: Balance & Wallet Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 rounded-3xl shadow-2xl p-8 border border-green-700/50">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h2 className="text-green-100/80 font-medium text-sm uppercase tracking-wider mb-1">Available Balance</h2>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-extrabold text-white tracking-tight">
                    {parseFloat(balance).toFixed(2)}
                  </span>
                  <span className="text-xl font-bold text-green-200">XLM</span>
                </div>
              </div>
              
              <div className="mt-8 flex items-center space-x-4">
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <span>Create Payment</span>
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Info Card */}
          <div className="bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-800 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Connected Wallet</h3>
            <div className="bg-gray-950 rounded-2xl p-4 border border-gray-800 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-gray-300 text-lg">{truncatedKey}</span>
                <button
                  onClick={() => copyToClipboard(user.stellarPublicKey)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                  title="Copy Full Key"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 leading-relaxed">
              Share your public key to receive instant, near-zero fee payments anywhere in the world.
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📱', title: 'QR Scan', desc: 'Accept in-person', action: () => setShowPaymentModal(true) },
            { icon: '🔗', title: 'Payment Link', desc: 'Share on WhatsApp', action: () => setShowPaymentModal(true) },
            { icon: '📊', title: 'Analytics', desc: 'View profit/loss', action: () => {} },
            { icon: '💸', title: 'Send', desc: 'Transfer funds', action: () => {} }
          ].map((action, i) => (
            <div 
              key={i} 
              onClick={action.action}
              className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-green-500/50 hover:bg-gray-800/80 transition-all cursor-pointer group shadow-sm hover:shadow-green-900/20"
            >
              <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform">{action.icon}</div>
              <h3 className="font-semibold text-gray-200 mb-1">{action.title}</h3>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="px-8 py-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-100">Recent Activity</h3>
            <button className="text-sm text-green-500 hover:text-green-400 font-medium">View All</button>
          </div>
          <div className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                  <span className="text-2xl text-gray-500">📋</span>
                </div>
                <p className="text-gray-300 font-medium text-lg">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  Start by generating a QR code or payment link to accept your first payment.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-950 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium rounded-tl-lg">Date</th>
                    <th className="px-6 py-4 font-medium">Memo</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right rounded-tr-lg">Link ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentTransactions.map((tx: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-400 font-semibold">
                        {tx.memo || 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                          {tx.successful ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-right">
                        ...{tx.id.substring(tx.id.length - 8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Render Payment Modal */}
      {showPaymentModal && (
        <CreatePaymentModal 
          publicKey={user.stellarPublicKey} 
          onClose={() => setShowPaymentModal(false)} 
        />
      )}
    </div>
  );
}
