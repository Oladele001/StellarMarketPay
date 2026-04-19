'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  asset: string;
  status: 'pending' | 'paid' | 'overdue';
  vendor?: string;
  receipt?: string;
}

interface ExpenseTrackerProps {
  user: User;
}

export default function ExpenseTracker({ user }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'business',
    description: '',
    asset: 'XLM',
    vendor: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { id: 'business', name: 'Business Operations', color: 'blue' },
    { id: 'marketing', name: 'Marketing', color: 'purple' },
    { id: 'development', name: 'Development', color: 'green' },
    { id: 'office', name: 'Office Supplies', color: 'yellow' },
    { id: 'travel', name: 'Travel', color: 'red' },
    { id: 'utilities', name: 'Utilities', color: 'orange' },
    { id: 'other', name: 'Other', color: 'gray' }
  ];

  useEffect(() => {
    loadExpenses();
  }, [user.id]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      // Load expenses from localStorage (in production, this would be from a database)
      const storedExpenses = localStorage.getItem(`expenses_${user.id}`);
      if (storedExpenses) {
        const parsedExpenses = JSON.parse(storedExpenses);
        setExpenses(parsedExpenses.map((expense: any) => ({
          ...expense,
          date: new Date(expense.date)
        })));
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveExpenses = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses);
    localStorage.setItem(`expenses_${user.id}`, JSON.stringify(updatedExpenses));
  };

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) {
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      description: newExpense.description,
      date: new Date(newExpense.date),
      asset: newExpense.asset,
      status: 'pending',
      vendor: newExpense.vendor || undefined
    };

    const updatedExpenses = [expense, ...expenses];
    saveExpenses(updatedExpenses);

    // Reset form
    setNewExpense({
      amount: '',
      category: 'business',
      description: '',
      asset: 'XLM',
      vendor: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    saveExpenses(updatedExpenses);
  };

  const handleUpdateStatus = (id: string, status: 'pending' | 'paid' | 'overdue') => {
    const updatedExpenses = expenses.map(expense =>
      expense.id === id ? { ...expense, status } : expense
    );
    saveExpenses(updatedExpenses);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'gray';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    filteredExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    return categoryTotals;
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
        <h3 className="text-lg font-semibold text-gray-900">Expense Tracker</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm"
        >
          {showAddForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Add New Expense</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.0000001"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.0000001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Expense description"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor (Optional)</label>
              <input
                type="text"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Vendor name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
              <select
                value={newExpense.asset}
                onChange={(e) => setNewExpense({ ...newExpense, asset: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="XLM">XLM</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="NGN">NGN</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExpense}
              disabled={!newExpense.amount || !newExpense.description}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md"
            >
              Add Expense
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {getTotalExpenses().toFixed(2)} XLM
          </div>
          <div className="text-red-100 text-sm">Total Expenses</div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {filteredExpenses.filter(e => e.status === 'pending').length}
          </div>
          <div className="text-yellow-100 text-sm">Pending</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {filteredExpenses.filter(e => e.status === 'paid').length}
          </div>
          <div className="text-green-100 text-sm">Paid</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900">
            Expenses ({filteredExpenses.length})
          </h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredExpenses.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">·</div>
              <p>No expenses found</p>
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full bg-${getCategoryColor(expense.category)}-100 text-${getCategoryColor(expense.category)}-800`}>
                        {getCategoryName(expense.category)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        expense.status === 'paid' ? 'bg-green-100 text-green-800' :
                        expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                    
                    <div className="font-medium text-gray-900 mb-1">
                      {expense.description}
                    </div>
                    
                    {expense.vendor && (
                      <div className="text-sm text-gray-600 mb-1">
                        Vendor: {expense.vendor}
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      {expense.date.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      {expense.amount.toFixed(2)} {expense.asset}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={expense.status}
                        onChange={(e) => handleUpdateStatus(expense.id, e.target.value as 'pending' | 'paid' | 'overdue')}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                      
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Expenses by Category</h4>
        <div className="space-y-3">
          {Object.entries(getExpensesByCategory()).map(([category, amount]) => (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 bg-${getCategoryColor(category)}-500 rounded-full`}></div>
                <span className="text-sm font-medium">{getCategoryName(category)}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{amount.toFixed(2)} XLM</div>
                <div className="text-xs text-gray-500">
                  {((amount / getTotalExpenses()) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
