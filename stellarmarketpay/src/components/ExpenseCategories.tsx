'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/auth';

interface Category {
  id: string;
  name: string;
  color: string;
  budget: number;
  spent: number;
  description: string;
}

interface ExpenseCategoriesProps {
  user: User;
}

export default function ExpenseCategories({ user }: ExpenseCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: 'blue',
    budget: '',
    description: ''
  });

  const colorOptions = [
    { id: 'blue', name: 'Blue', class: 'bg-blue-500' },
    { id: 'green', name: 'Green', class: 'bg-green-500' },
    { id: 'red', name: 'Red', class: 'bg-red-500' },
    { id: 'yellow', name: 'Yellow', class: 'bg-yellow-500' },
    { id: 'purple', name: 'Purple', class: 'bg-purple-500' },
    { id: 'orange', name: 'Orange', class: 'bg-orange-500' },
    { id: 'pink', name: 'Pink', class: 'bg-pink-500' },
    { id: 'gray', name: 'Gray', class: 'bg-gray-500' }
  ];

  useEffect(() => {
    loadCategories();
  }, [user.id]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      // Load categories from localStorage (in production, this would be from a database)
      const storedCategories = localStorage.getItem(`expense_categories_${user.id}`);
      if (storedCategories) {
        const parsedCategories = JSON.parse(storedCategories);
        setCategories(parsedCategories);
      } else {
        // Generate default categories for demonstration
        const defaultCategories = getDefaultCategories();
        setCategories(defaultCategories);
        localStorage.setItem(`expense_categories_${user.id}`, JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultCategories = (): Category[] => {
    return [
      {
        id: 'business',
        name: 'Business Operations',
        color: 'blue',
        budget: 1000,
        spent: 450,
        description: 'General business expenses and operations'
      },
      {
        id: 'marketing',
        name: 'Marketing',
        color: 'purple',
        budget: 500,
        spent: 320,
        description: 'Marketing and advertising expenses'
      },
      {
        id: 'development',
        name: 'Development',
        color: 'green',
        budget: 800,
        spent: 600,
        description: 'Software development and tools'
      },
      {
        id: 'office',
        name: 'Office Supplies',
        color: 'yellow',
        budget: 200,
        spent: 150,
        description: 'Office supplies and equipment'
      },
      {
        id: 'travel',
        name: 'Travel',
        color: 'red',
        budget: 600,
        spent: 400,
        description: 'Business travel and accommodations'
      },
      {
        id: 'utilities',
        name: 'Utilities',
        color: 'orange',
        budget: 300,
        spent: 280,
        description: 'Utilities and recurring expenses'
      }
    ];
  };

  const saveCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    localStorage.setItem(`expense_categories_${user.id}`, JSON.stringify(updatedCategories));
  };

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.budget) {
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      color: newCategory.color,
      budget: parseFloat(newCategory.budget),
      spent: 0,
      description: newCategory.description
    };

    const updatedCategories = [...categories, category];
    saveCategories(updatedCategories);

    // Reset form
    setNewCategory({
      name: '',
      color: 'blue',
      budget: '',
      description: ''
    });
    setShowAddForm(false);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name || !newCategory.budget) {
      return;
    }

    const updatedCategories = categories.map(category =>
      category.id === editingCategory.id
        ? {
            ...category,
            name: newCategory.name,
            color: newCategory.color,
            budget: parseFloat(newCategory.budget),
            description: newCategory.description
          }
        : category
    );

    saveCategories(updatedCategories);
    setEditingCategory(null);
    setNewCategory({
      name: '',
      color: 'blue',
      budget: '',
      description: ''
    });
  };

  const handleDeleteCategory = (id: string) => {
    const updatedCategories = categories.filter(category => category.id !== id);
    saveCategories(updatedCategories);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color,
      budget: category.budget.toString(),
      description: category.description
    });
    setShowAddForm(true);
  };

  const getColorClass = (colorId: string) => {
    const color = colorOptions.find(c => c.id === colorId);
    return color?.class || 'bg-gray-500';
  };

  const getTotalBudget = () => {
    return categories.reduce((sum, category) => sum + category.budget, 0);
  };

  const getTotalSpent = () => {
    return categories.reduce((sum, category) => sum + category.spent, 0);
  };

  const getBudgetUtilization = (category: Category) => {
    return category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
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
        <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm"
        >
          {showAddForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {getTotalBudget().toFixed(2)} XLM
          </div>
          <div className="text-blue-100 text-sm">Total Budget</div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {getTotalSpent().toFixed(2)} XLM
          </div>
          <div className="text-red-100 text-sm">Total Spent</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {getTotalBudget() > 0 ? ((getTotalSpent() / getTotalBudget()) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-green-100 text-sm">Budget Used</div>
        </div>
      </div>

      {/* Add/Edit Category Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Marketing"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input
                type="number"
                step="0.01"
                value={newCategory.budget}
                onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <select
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {colorOptions.map(color => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Category description"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingCategory(null);
                setNewCategory({
                  name: '',
                  color: 'blue',
                  budget: '',
                  description: ''
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              disabled={!newCategory.name || !newCategory.budget}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md"
            >
              {editingCategory ? 'Update' : 'Add'} Category
            </button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const utilization = getBudgetUtilization(category);
          const isOverBudget = utilization > 100;
          const isNearBudget = utilization > 80 && utilization <= 100;
          
          return (
            <div key={category.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 ${getColorClass(category.color)} rounded-full`}></div>
                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">{category.budget.toFixed(2)} XLM</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-medium">{category.spent.toFixed(2)} XLM</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining:</span>
                  <span className={`font-medium ${
                    isOverBudget ? 'text-red-600' : isNearBudget ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {(category.budget - category.spent).toFixed(2)} XLM
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Budget Used</span>
                    <span>{utilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' : isNearBudget ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    ></div>
                  </div>
                  {isOverBudget && (
                    <p className="text-xs text-red-600 mt-1">Over budget by {(category.spent - category.budget).toFixed(2)} XLM</p>
                  )}
                  {isNearBudget && !isOverBudget && (
                    <p className="text-xs text-yellow-600 mt-1">Approaching budget limit</p>
                  )}
                </div>
                
                {category.description && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Budget Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-red-900 mb-2">Over Budget Categories</h5>
            <ul className="text-sm text-red-800 space-y-1">
              {categories.filter(c => getBudgetUtilization(c) > 100).length === 0 ? (
                <li>· No categories over budget</li>
              ) : (
                categories
                  .filter(c => getBudgetUtilization(c) > 100)
                  .map(category => (
                    <li key={category.id}>· {category.name}: {getBudgetUtilization(category).toFixed(1)}%</li>
                  ))
              )}
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-yellow-900 mb-2">Near Budget Categories</h5>
            <ul className="text-sm text-yellow-800 space-y-1">
              {categories.filter(c => getBudgetUtilization(c) > 80 && getBudgetUtilization(c) <= 100).length === 0 ? (
                <li>· No categories near budget limit</li>
              ) : (
                categories
                  .filter(c => getBudgetUtilization(c) > 80 && getBudgetUtilization(c) <= 100)
                  .map(category => (
                    <li key={category.id}>· {category.name}: {getBudgetUtilization(category).toFixed(1)}%</li>
                  ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
