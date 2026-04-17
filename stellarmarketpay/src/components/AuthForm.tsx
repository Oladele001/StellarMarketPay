'use client';

import { useState } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { AuthService } from '@/lib/auth';
import { SecurityService } from '@/lib/security';

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Sanitize input to prevent XSS
    const sanitizedValue = SecurityService.sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validate email
    if (isLogin || !isLogin) {
      const emailValidation = SecurityService.validateEmail(formData.email);
      if (!emailValidation.isValid) {
        errors.push(emailValidation.error || 'Invalid email');
      }
    }

    // Validate password
    const passwordValidation = SecurityService.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Validate name (for registration)
    if (!isLogin) {
      const nameValidation = SecurityService.validateName(formData.name, 'Name');
      if (!nameValidation.isValid) {
        errors.push(nameValidation.error || 'Invalid name');
      }
    }

    // Validate business name (for registration)
    if (!isLogin) {
      const businessValidation = SecurityService.validateName(formData.businessName, 'Business name');
      if (!businessValidation.isValid) {
        errors.push(businessValidation.error || 'Invalid business name');
      }
    }

    // Validate phone (optional)
    if (formData.phone && !isLogin) {
      const phoneValidation = SecurityService.validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        errors.push(phoneValidation.error || 'Invalid phone number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const identifier = formData.email || 'unknown';
    if (SecurityService.isRateLimited(isLogin ? 'login' : 'register', identifier)) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      setIsLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        const credentials: LoginCredentials = {
          email: formData.email,
          password: formData.password
        };
        result = await AuthService.login(credentials);
      } else {
        const credentials: RegisterCredentials = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          businessName: formData.businessName,
          phone: formData.phone
        };
        result = await AuthService.register(credentials);
      }

      AuthService.persistAuth(result.token);
      onAuthSuccess(result.user);
      
      // Log successful authentication
      SecurityService.logSecurityEvent('authentication_success', {
        action: isLogin ? 'login' : 'register',
        email: formData.email,
        success: true
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      
      // Log failed authentication
      SecurityService.logSecurityEvent('authentication_failed', {
        action: isLogin ? 'login' : 'register',
        email: formData.email,
        error: errorMessage,
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl">💰</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Access your StellarMarketPay dashboard' : 'Start accepting payments today'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name (Optional)
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-green-600 hover:text-green-500 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-blue-50 to-green-50 text-gray-500">
                Powered by Stellar Network
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
