import crypto from 'crypto';

export class SecurityService {
  // Rate limiting configuration
  private static readonly RATE_LIMITS = {
    login: 5, // 5 attempts per 15 minutes
    payment: 10, // 10 payments per hour
    transfer: 5, // 5 transfers per hour
    qr: 20, // 20 QR codes per hour
  };

  // Session configuration
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Password strength requirements
  private static readonly PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    maxLength: 128,
  };

  // Input validation patterns
  private static readonly PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[1-9]\d{1,14}$/,
    stellarPublicKey: /^G[A-Z0-9]{56}$/,
    amount: /^\d+(\.\d{1,2})?$/,
    name: /^[a-zA-Z\s]{2,50}$/,
    businessName: /^[a-zA-Z0-9\s]{2,50}$/,
  };

  // Rate limiting storage
  private static getRateLimitKey(action: string, identifier: string): string {
    return `rate_limit_${action}_${identifier}`;
  }

  // Check rate limit
  static isRateLimited(action: string, identifier: string): boolean {
    const key = this.getRateLimitKey(action, identifier);
    const limit = this.RATE_LIMITS[action as keyof typeof this.RATE_LIMITS];
    const attempts = parseInt(localStorage.getItem(key) || '0');
    const windowStart = parseInt(localStorage.getItem(`${key}_window`) || '0');
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes

    if (now - windowStart < windowMs && attempts >= limit) {
      return true;
    }

    return false;
  }

  // Record rate limit attempt
  static recordRateLimitAttempt(action: string, identifier: string): void {
    const key = this.getRateLimitKey(action, identifier);
    const attempts = parseInt(localStorage.getItem(key) || '0');
    
    if (attempts === 0) {
      localStorage.setItem(`${key}_window`, Date.now().toString());
    }
    
    localStorage.setItem(key, (attempts + 1).toString());
  }

  // Reset rate limit
  static resetRateLimit(action: string, identifier: string): void {
    const key = this.getRateLimitKey(action, identifier);
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_window`);
  }

  // Validate email format
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'Email is required' };
    }

    if (!this.PATTERNS.email.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  }

  // Validate phone number format
  static validatePhone(phone: string): { isValid: boolean; error?: string } {
    if (!phone || phone.trim() === '') {
      return { isValid: true }; // Phone is optional
    }

    if (!this.PATTERNS.phone.test(phone)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    return { isValid: true };
  }

  // Validate Stellar public key
  static validateStellarPublicKey(key: string): { isValid: boolean; error?: string } {
    if (!key || key.trim() === '') {
      return { isValid: false, error: 'Stellar public key is required' };
    }

    if (!this.PATTERNS.stellarPublicKey.test(key)) {
      return { isValid: false, error: 'Invalid Stellar public key format' };
    }

    return { isValid: true };
  }

  // Validate amount
  static validateAmount(amount: string): { isValid: boolean; error?: string } {
    if (!amount || amount.trim() === '') {
      return { isValid: false, error: 'Amount is required' };
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { isValid: false, error: 'Amount must be a positive number' };
    }

    // Check for reasonable limits (prevent huge transactions)
    if (numAmount > 1000000) {
      return { isValid: false, error: 'Amount exceeds maximum limit' };
    }

    return { isValid: true };
  }

  // Validate name
  static validateName(name: string, fieldName: string): { isValid: boolean; error?: string } {
    if (!name || name.trim() === '') {
      return { isValid: false, error: `${fieldName} is required` };
    }

    if (name.length < 2 || name.length > 50) {
      return { isValid: false, error: `${fieldName} must be between 2 and 50 characters` };
    }

    if (!/^[a-zA-Z\s-']+$/.test(name)) {
      return { isValid: false, error: `${fieldName} can only contain letters, spaces, and hyphens` };
    }

    return { isValid: true };
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || password.length === 0) {
      errors.push('Password is required');
    }

    if (password.length < this.PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`Password must be at least ${this.PASSWORD_REQUIREMENTS.minLength} characters`);
    }

    if (password.length > this.PASSWORD_REQUIREMENTS.maxLength) {
      errors.push(`Password must not exceed ${this.PASSWORD_REQUIREMENTS.maxLength} characters`);
    }

    if (this.PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+=\-\[\]{};':"|.<>?\/]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize input
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*<\/script>)>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash password with proper algorithm
  static hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  // Verify password hash
  static verifyPasswordHash(password: string, hash: string, salt: string): boolean {
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hashedPassword === hash;
  }

  // Check for suspicious activity
  static detectSuspiciousActivity(attempts: number, timeWindow: number): boolean {
    return attempts > 10 && timeWindow < 60000; // 10 attempts in 1 minute
  }

  // Validate session
  static validateSession(token: string): { isValid: boolean; error?: string } {
    if (!token || token.length < 10) {
      return { isValid: false, error: 'Invalid session token' };
    }

    return { isValid: true };
  }

  // Get client IP (for logging)
  static getClientIP(): string {
    // In a real app, this would be handled server-side
    return 'client_ip_unknown';
  }

  // Log security events
  static logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      ip: this.getClientIP()
    };

    // Store in localStorage for demo (in production, send to server)
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('security_logs', JSON.stringify(logs));

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
      localStorage.setItem('security_logs', JSON.stringify(logs));
    }
  }

  // Check for common attack patterns
  static detectAttackPattern(input: string): { isAttack: boolean; type: string } {
    const patterns = {
      sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      xss: /<script[^>]*>.*?<\/script>/gi,
      pathTraversal: /\.\.\//g,
      commandInjection: /[;&|`$()]/g,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(input)) {
        return { isAttack: true, type };
      }
    }

    return { isAttack: false, type: 'none' };
  }
}
