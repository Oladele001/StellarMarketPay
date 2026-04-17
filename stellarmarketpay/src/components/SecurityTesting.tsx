'use client';

import { useState } from 'react';
import { SecurityService } from '@/lib/security';

interface SecurityTest {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'warning';
  details?: string;
  timestamp: Date;
}

export default function SecurityTesting() {
  const [testResults, setTestResults] = useState<SecurityTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSecurityTests = async () => {
    setIsRunning(true);
    const results: SecurityTest[] = [];

    // Test 1: Input Validation
    const inputTests = [
      {
        id: 'test-1',
        name: 'Email Validation - Valid Email',
        description: 'Test valid email format',
        test: () => {
          const result = SecurityService.validateEmail('test@example.com');
          return {
            status: result.isValid ? 'passed' : 'failed',
            details: result.isValid ? 'Email format is valid' : `Error: ${result.error}`,
            timestamp: new Date()
          };
        }
      },
      {
        id: 'test-2',
        name: 'Email Validation - Invalid Email',
        description: 'Test invalid email format',
        test: () => {
          const result = SecurityService.validateEmail('invalid-email');
          return {
            status: result.isValid ? 'passed' : 'failed',
            details: result.isValid ? 'Email format is valid' : `Error: ${result.error}`,
            timestamp: new Date()
          };
        }
      },
      {
        id: 'test-3',
        name: 'Password Validation - Strong Password',
        description: 'Test strong password requirements',
        test: () => {
          const result = SecurityService.validatePassword('StrongPass123!');
          return {
            status: result.isValid ? 'passed' : 'failed',
            details: result.isValid ? 'Password meets all requirements' : `Error: ${result.errors.join(', ')}`,
            timestamp: new Date()
          };
        }
      },
      {
        id: 'test-4',
        name: 'Password Validation - Weak Password',
        description: 'Test weak password detection',
        test: () => {
          const result = SecurityService.validatePassword('weak');
          return {
            status: result.isValid ? 'passed' : 'failed',
            details: result.isValid ? 'Password is weak' : `Error: ${result.errors.join(', ')}`,
            timestamp: new Date()
          };
        }
      },
      {
        id: 'test-5',
        name: 'Stellar Public Key Validation',
        description: 'Test Stellar public key format',
        test: () => {
          const result = SecurityService.validateStellarPublicKey('GABC123456789ABCDEF1234567890');
          return {
            status: result.isValid ? 'passed' : 'failed',
            details: result.isValid ? 'Stellar key format is valid' : `Error: ${result.error}`,
            timestamp: new Date()
          };
        }
      },
      {
        id: 'test-6',
        name: 'Amount Validation',
        description: 'Test amount validation',
        test: () => {
          const result = SecurityService.validateAmount('100.50');
          return {
            status: result.isValid ? 'passed' : 'failed',
            details: result.isValid ? 'Amount format is valid' : `Error: ${result.error}`,
            timestamp: new Date()
          };
        }
      },
      {
        id: 'test-7',
        name: 'Attack Pattern Detection',
        description: 'Test common attack patterns',
        test: () => {
          const testInputs = [
            '<script>alert("XSS")</script>',
            'SELECT * FROM users',
            '../../../etc/passwd',
            'javascript:alert(1)',
            '<img src=x onerror=alert(1)>',
            'path/to/file'
          ];

          const results = testInputs.map((input, index) => {
            const detection = SecurityService.detectAttackPattern(input);
            return {
              status: detection.isAttack ? 'failed' : 'passed',
              details: detection.isAttack ? `Attack pattern detected: ${detection.type}` : 'No attack pattern detected',
              timestamp: new Date()
            };
          });

          return {
            id: `test-7-${index}`,
            name: `Attack Test ${index + 1}`,
            description: `Test ${input}`,
            ...results[index]
          };
        }).flat();
        }
      },
      {
        id: 'test-8',
        name: 'Rate Limiting',
        description: 'Test rate limiting functionality',
        test: () => {
          // Simulate multiple rapid attempts
          for (let i = 0; i < 6; i++) {
            SecurityService.recordRateLimitAttempt('login', 'test-user');
          }

          const isLimited = SecurityService.isRateLimited('login', 'test-user');
          return {
            status: isLimited ? 'passed' : 'failed',
            details: isLimited ? 'Rate limiting is working correctly' : 'Rate limiting is not working',
            timestamp: new Date()
          };
        }
      },
      {
        id: 'test-9',
        name: 'Session Validation',
        description: 'Test session token validation',
        test: () => {
          const validToken = SecurityService.generateSecureToken(32);
          const invalidToken = 'short';
          const emptyToken = '';

          const validResult = SecurityService.validateSession(validToken);
          const invalidResult = SecurityService.validateSession(invalidToken);
          const emptyResult = SecurityService.validateSession(emptyToken);

          return [
            {
              id: 'test-9-1',
              name: 'Session Validation - Valid Token',
              description: 'Test valid session token',
              ...validResult,
              timestamp: new Date()
            },
            {
              id: 'test-9-2',
              name: 'Session Validation - Invalid Token',
              description: 'Test invalid session token',
              ...invalidResult,
              timestamp: new Date()
            },
            {
              id: 'test-9-3',
              name: 'Session Validation - Empty Token',
              description: 'Test empty session token',
              ...emptyResult,
              timestamp: new Date()
            }
          ];
        }
      }
    ];

    // Run all tests
    for (const testSuite of inputTests) {
      try {
        const result = await testSuite.test();
        results.push(result);
      } catch (error) {
        results.push({
          id: testSuite.id,
          name: testSuite.name,
          description: testSuite.description,
          status: 'failed',
          details: `Test execution error: ${error}`,
          timestamp: new Date()
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const runAllTests = async () => {
    await runSecurityTests();
  };

  const getTestSummary = () => {
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    const warnings = testResults.filter(t => t.status === 'warning').length;
    const total = testResults.length;

    return {
      total,
      passed,
      failed,
      warnings,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : '0',
      status: failed === 0 ? 'passed' : warnings > 0 ? 'warning' : 'failed'
    };
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Security Testing Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Comprehensive security testing for StellarMarketPay authentication and payment flows.
            Test input validation, rate limiting, attack detection, and session management.
          </p>

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run All Security Tests'}
            </button>
            
            {testResults.length > 0 && (
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Clear Results
              </button>
            )}
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-medium">Passed: {getTestSummary().passed}</div>
                    <div className="text-red-600">Failed: {getTestSummary().failed}</div>
                    <div className="text-yellow-600">Warnings: {getTestSummary().warnings}</div>
                    <div className="text-gray-600">Total: {getTestSummary().total}</div>
                    <div className="text-green-700 font-medium">Pass Rate: {getTestSummary().passRate}%</div>
                  </div>
                </div>
              </div>

              {/* Individual Test Results */}
              <div className="space-y-3">
                {testResults.map((test) => (
                  <div
                    key={test.id}
                    className={`border rounded-lg p-4 ${
                      test.status === 'passed'
                        ? 'bg-green-50 border-green-200'
                        : test.status === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{test.name}</h3>
                        <p className="text-sm text-gray-600">{test.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        test.status === 'passed'
                          ? 'bg-green-100 text-green-800'
                          : test.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {test.status}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">{test.details}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tested at: {test.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
