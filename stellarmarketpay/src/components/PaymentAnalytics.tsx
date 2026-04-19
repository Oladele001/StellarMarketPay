'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { PaymentRequest } from '@/types/stellar';

interface PaymentAnalyticsProps {
  user: User;
}

export default function PaymentAnalytics({ user }: PaymentAnalyticsProps) {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    dailyAverage: 0,
    weeklyAverage: 0,
    monthlyAverage: 0,
    topPayers: [] as Array<{ address: string; amount: number; count: number }>,
    assetBreakdown: [] as Array<{ asset: string; amount: number; percentage: number }>,
    growthRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [user.stellarPublicKey, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const history = await StellarService.getPaymentsHistory(user.stellarPublicKey);
      const transactions = history
        .filter(tx => tx.to === user.stellarPublicKey)
        .map((tx: any) => ({
          id: tx.id,
          amount: tx.amount || '0',
          asset: tx.asset_code || 'XLM',
          destination: tx.from,
          status: 'completed',
          createdAt: new Date(tx.created_at),
          completedAt: new Date(tx.created_at)
        }));
      
      const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const totalTransactions = transactions.length;
      const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const dailyAverage = totalRevenue / days;
      const weeklyAverage = totalRevenue / (days / 7);
      const monthlyAverage = totalRevenue / (days / 30);
      
      // Top payers mock simplified to real senders
      const payerMap: { [key: string]: { amount: number; count: number } } = {};
      transactions.forEach(tx => {
        const payer = tx.destination; // from in mapped
        if (!payerMap[payer]) payerMap[payer] = { amount: 0, count: 0 };
        payerMap[payer].amount += parseFloat(tx.amount);
        payerMap[payer].count += 1;
      });
      const topPayers = Object.entries(payerMap)
        .map(([address, data]) => ({ address, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
      
      const assetMap: { [key: string]: number } = {};
      transactions.forEach(tx => {
        assetMap[tx.asset] = (assetMap[tx.asset] || 0) + parseFloat(tx.amount);
      });
      const assetBreakdown = Object.entries(assetMap)
        .map(([asset, amount]) => ({
          asset,
          amount,
          percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);
      
      const growthRate = 0; // Calculate from history if available
      
      setAnalytics({
        totalRevenue,
        totalTransactions,
        averageTransaction,
        dailyAverage,
        weeklyAverage,
        monthlyAverage,
        topPayers,
        assetBreakdown,
        growthRate
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Payment Analytics</h3>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {analytics.totalRevenue.toFixed(2)} XLM
          </div>
          <div className="text-blue-100 text-sm">Total Revenue</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
          <div className="text-green-100 text-sm">Total Transactions</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {analytics.averageTransaction.toFixed(2)} XLM
          </div>
          <div className="text-purple-100 text-sm">Average Transaction</div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {analytics.growthRate > 0 ? '+' : ''}{analytics.growthRate.toFixed(1)}%
          </div>
          <div className="text-orange-100 text-sm">Growth Rate</div>
        </div>
      </div>

      {/* Averages */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Revenue Averages</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {analytics.dailyAverage.toFixed(2)} XLM
            </div>
            <div className="text-sm text-gray-600">Daily Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {analytics.weeklyAverage.toFixed(2)} XLM
            </div>
            <div className="text-sm text-gray-600">Weekly Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {analytics.monthlyAverage.toFixed(2)} XLM
            </div>
            <div className="text-sm text-gray-600">Monthly Average</div>
          </div>
        </div>
      </div>

      {/* Asset Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Asset Breakdown</h4>
        <div className="space-y-3">
          {analytics.assetBreakdown.map(({ asset, amount, percentage }) => (
            <div key={asset} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
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

      {/* Top Payers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Top Payers</h4>
        <div className="space-y-3">
          {analytics.topPayers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No payment data available</p>
            </div>
          ) : (
            analytics.topPayers.map((payer, index) => (
              <div key={payer.address} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{payer.address}</div>
                    <div className="text-xs text-gray-500">{payer.count} transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{payer.amount.toFixed(2)} XLM</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Performance Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-green-900 mb-2">Strengths</h5>
            <ul className="text-sm text-green-800 space-y-1">
              <li>· Consistent daily revenue generation</li>
              <li>· Diverse asset portfolio</li>
              <li>· Strong transaction volume</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-blue-900 mb-2">Opportunities</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>· Increase average transaction size</li>
              <li>· Focus on high-value customers</li>
              <li>· Expand to new asset types</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
