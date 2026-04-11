'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { PaymentRequest } from '@/types/stellar';

interface TransactionHistoryProps {
  user: User;
}

export default function TransactionHistory({ user }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);

  useEffect(() => {
    loadTransactions();
  }, [user.stellarPublicKey]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Mock transaction data
      const mockTransactions = generateMockTransactions();
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTransactions = (): PaymentRequest[] => {
    const transactions: PaymentRequest[] = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 90));
      
      const isIncoming = Math.random() > 0.3;
      
      transactions.push({
        id: `tx_${i}`,
        amount: (Math.random() * 1000 + 0.1).toFixed(7),
        asset: ['XLM', 'USD', 'EUR', 'NGN'][Math.floor(Math.random() * 4)],
        destination: isIncoming ? user.stellarPublicKey : 'G' + Math.random().toString(36).substr(2, 56).toUpperCase(),
        status: 'completed',
        createdAt: date,
        completedAt: date
      });
    }
    
    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'incoming' && transaction.destination === user.stellarPublicKey) ||
      (filter === 'outgoing' && transaction.destination !== user.stellarPublicKey);
    
    const matchesSearch = 
      searchTerm === '' ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const formatAddress = (address: string) => {
    return address.length > 20 ? `${address.slice(0, 10)}...${address.slice(-10)}` : address;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <div className="text-sm text-gray-600">
          {filteredTransactions.length} transactions
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'incoming' | 'outgoing')}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Transactions</option>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
        </select>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {currentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">·</div>
            <p>No transactions found</p>
          </div>
        ) : (
          currentTransactions.map((transaction) => {
            const isIncoming = transaction.destination === user.stellarPublicKey;
            return (
              <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-lg font-medium ${
                        isIncoming ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isIncoming ? '+' : '-'}{parseFloat(transaction.amount).toFixed(7)} {transaction.asset}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isIncoming ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isIncoming ? 'Received' : 'Sent'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span>Transaction ID:</span>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {transaction.id}
                        </code>
                        <button
                          onClick={() => copyToClipboard(transaction.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Copy
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span>{isIncoming ? 'From:' : 'To:'}</span>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {formatAddress(transaction.destination)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(transaction.destination)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Copy
                        </button>
                      </div>
                      
                      <div>
                        {transaction.createdAt.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Status
                    </div>
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Completed
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  currentPage === page
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            const csv = 'Transaction ID,Amount,Asset,Type,Date\n' +
              filteredTransactions.map(tx => 
                `${tx.id},${tx.amount},${tx.asset},${tx.destination === user.stellarPublicKey ? 'Incoming' : 'Outgoing'},${tx.createdAt.toISOString()}`
              ).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
        >
          Export to CSV
        </button>
      </div>
    </div>
  );
}
