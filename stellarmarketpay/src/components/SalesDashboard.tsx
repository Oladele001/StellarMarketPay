'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { PaymentRequest } from '@/types/stellar';
import { StellarService } from '@/lib/stellar';

interface SalesDashboardProps {
  user: User;
}

export default function SalesDashboard({ user }: SalesDashboardProps) {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [averageTransaction, setAverageTransaction] = useState(0);

  useEffect(() => {
    loadPaymentData();
  }, [user.stellarPublicKey, timeRange]);

  const loadPaymentData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from your backend
      // For now, we'll use mock data
      const mockPayments = generateMockPayments();
      setPayments(mockPayments);
      
      const total = mockPayments.reduce((sum, payment) => 
        sum + parseFloat(payment.amount), 0
      );
      setTotalRevenue(total);
      setTransactionCount(mockPayments.length);
      setAverageTransaction(mockPayments.length > 0 ? total / mockPayments.length : 0);
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPayments = (): PaymentRequest[] => {
    const payments: PaymentRequest[] = [];
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = 0; i < Math.min(daysBack * 2, 50); i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
      
      payments.push({
        id: `payment_${i}`,
        amount: (Math.random() * 100 + 1).toFixed(7),
        asset: 'XLM',
        destination: user.stellarPublicKey,
        status: 'completed',
        createdAt: date,
        completedAt: date
      });
    }
    
    return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const getDailyData = () => {
    const data: { date: string; amount: number }[] = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      
      const dayPayments = payments.filter(payment => 
        payment.createdAt.toLocaleDateString() === dateStr
      );
      
      const dayTotal = dayPayments.reduce((sum, payment) => 
        sum + parseFloat(payment.amount), 0
      );
      
      data.push({ date: dateStr, amount: dayTotal });
    }
    
    return data;
  };

  const getAssetDistribution = () => {
    const distribution: { [key: string]: number } = {};
    
    payments.forEach(payment => {
      distribution[payment.asset] = (distribution[payment.asset] || 0) + parseFloat(payment.amount);
    });
    
    return Object.entries(distribution).map(([asset, amount]) => ({
      asset,
      amount,
      percentage: (amount / totalRevenue) * 100
    }));
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

  const dailyData = getDailyData();
  const assetDistribution = getAssetDistribution();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Sales Dashboard</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {totalRevenue.toFixed(2)} XLM
          </div>
          <div className="text-green-100 text-sm">Total Revenue</div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{transactionCount}</div>
          <div className="text-blue-100 text-sm">Transactions</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {averageTransaction.toFixed(2)} XLM
          </div>
          <div className="text-purple-100 text-sm">Average Transaction</div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Daily Revenue</h4>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">·</div>
            <p>Chart visualization would go here</p>
            <p className="text-sm">In production, use Recharts or Chart.js</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-600">
          {dailyData.length > 0 && `Showing ${dailyData.length} days of data`}
        </div>
      </div>

      {/* Asset Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Asset Distribution</h4>
        <div className="space-y-3">
          {assetDistribution.map(({ asset, amount, percentage }) => (
            <div key={asset} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">{asset}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{amount.toFixed(2)} XLM</div>
                <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Transactions</h4>
        <div className="space-y-2">
          {payments.slice(0, 10).map((payment) => (
            <div key={payment.id} className="flex justify-between items-center py-2 border-b">
              <div>
                <div className="text-sm font-medium">
                  {parseFloat(payment.amount).toFixed(7)} {payment.asset}
                </div>
                <div className="text-xs text-gray-500">
                  {payment.createdAt.toLocaleString()}
                </div>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Completed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
