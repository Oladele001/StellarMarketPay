// Monitoring and Analytics Service for StellarMarketPay

interface AnalyticsEvent {
  event: string;
  category: 'auth' | 'payment' | 'transfer' | 'qr' | 'wallet' | 'error' | 'performance';
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
  data?: any;
  metadata?: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    path?: string;
    duration?: number;
    value?: number;
    fromCountry?: string;
    toCountry?: string;
  };
}

interface PerformanceMetrics {
  pageLoad: number;
  apiResponse: number;
  renderTime: number;
  errorRate: number;
  userEngagement: number;
  conversionRate: number;
}

export class MonitoringService {
  private static readonly ANALYTICS_ENDPOINT = '/api/analytics';
  private static readonly PERFORMANCE_ENDPOINT = '/api/performance';
  
  // Track user events
  static trackEvent(event: AnalyticsEvent): void {
    try {
      const enrichedEvent = {
        ...event,
        metadata: {
          ...event.metadata,
          userAgent: navigator.userAgent,
          ip: this.getClientIP(),
          referrer: document.referrer,
          path: window.location.pathname,
          timestamp: new Date().toISOString()
        }
      };

      // Send to analytics endpoint
      fetch(this.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedEvent),
      }).catch(error => {
        console.error('Failed to track event:', error);
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Track authentication events
  static trackAuth(action: string, success: boolean, userId?: string, error?: string): void {
    this.trackEvent({
      event: action,
      category: 'auth',
      userId,
      data: { success, error },
      metadata: {
        duration: success ? 0 : 1, // 0 for success, 1 for failure
      }
    });
  }

  // Track payment events
  static trackPayment(
    paymentId: string,
    amount: string,
    currency: string,
    status: 'success' | 'failed' | 'pending',
    userId?: string,
    error?: string
  ): void {
    this.trackEvent({
      event: `payment_${status}`,
      category: 'payment',
      userId,
      data: { paymentId, amount, currency, error },
      metadata: {
        value: parseFloat(amount) || 0,
      }
    });
  }

  // Track transfer events
  static trackTransfer(
    transferId: string,
    fromCountry: string,
    toCountry: string,
    amount: string,
    currency: string,
    status: 'success' | 'failed' | 'pending',
    userId?: string
  ): void {
    this.trackEvent({
      event: `transfer_${status}`,
      category: 'transfer',
      userId,
      data: { transferId, fromCountry, toCountry, amount, currency },
      metadata: {
        value: parseFloat(amount) || 0,
        fromCountry,
        toCountry,
      }
    });
  }

  // Track QR code generation
  static trackQRGeneration(userId: string | undefined, purpose: string): void {
    this.trackEvent({
      event: 'qr_generated',
      category: 'qr',
      userId,
      data: { purpose },
    });
  }

  // Track wallet operations
  static trackWallet(action: string, userId?: string, data?: any): void {
    this.trackEvent({
      event: `wallet_${action}`,
      category: 'wallet',
      userId,
      data,
    });
  }

  // Track errors
  static trackError(error: Error, context?: string, userId?: string): void {
    this.trackEvent({
      event: 'error_occurred',
      category: 'error',
      userId,
      data: { 
        message: error.message,
        stack: error.stack,
        context 
      },
    });
  }

  // Track performance metrics
  static trackPerformance(metrics: PerformanceMetrics): void {
    this.trackEvent({
      event: 'performance_metrics',
      category: 'performance',
      data: metrics,
    });
  }

  // Track page views
  static trackPageView(path: string, title: string, userId?: string): void {
    this.trackEvent({
      event: 'page_view',
      category: 'performance',
      userId,
      data: { path, title },
      metadata: {
        referrer: document.referrer,
      }
    });
  }

  // Track user engagement
  static trackEngagement(action: string, element: string, userId?: string): void {
    this.trackEvent({
      event: `engagement_${action}`,
      category: 'performance',
      userId,
      data: { element },
    });
  }

  // Get client IP (simplified)
  private static getClientIP(): string {
    // In production, this would be handled server-side
    return 'client_ip_unknown';
  }

  // Initialize monitoring
  static initialize(): void {
    // Track page load
    const startTime = Date.now();
    
    window.addEventListener('load', () => {
      const loadTime = Date.now() - startTime;
      this.trackPerformance({
        pageLoad: loadTime,
        apiResponse: 0,
        renderTime: 0,
        errorRate: 0,
        userEngagement: 0,
        conversionRate: 0,
      });
    });

    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message || 'Unknown error'), 'global');
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason || 'Unhandled promise rejection'), 'promise');
    });

    // Track performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackPerformance({
              pageLoad: entry.duration || 0,
              apiResponse: 0,
              renderTime: 0,
              errorRate: 0,
              userEngagement: 0,
              conversionRate: 0,
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  // Create session identifier
  static createSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get session info
  static getSessionInfo(): { sessionId: string; startTime: Date } {
    let sessionId = sessionStorage.getItem('session_id');
    let startTime = sessionStorage.getItem('session_start');
    
    if (!sessionId) {
      sessionId = this.createSessionId();
      sessionStorage.setItem('session_id', sessionId);
      startTime = new Date().toISOString();
      sessionStorage.setItem('session_start', startTime);
    }
    
    return {
      sessionId: sessionId || 'unknown',
      startTime: new Date(startTime || Date.now())
    };
  }

  // End session
  static endSession(): void {
    const sessionInfo = this.getSessionInfo();
    const duration = Date.now() - sessionInfo.startTime.getTime();
    
    this.trackEvent({
      event: 'session_ended',
      category: 'performance',
      data: {
        sessionId: sessionInfo.sessionId,
        duration,
      },
    });
    
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('session_start');
  }

  // Monitor API calls
  static monitorAPICall(endpoint: string, method: string, duration: number, success: boolean, error?: string): void {
    this.trackEvent({
      event: 'api_call',
      category: 'performance',
      data: {
        endpoint,
        method,
        duration,
        success,
        error,
      },
    });
  }

  // Health check
  static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; checks: any[] }> {
    const checks = [];
    
    // Check localStorage availability
    try {
      localStorage.setItem('health_check', 'test');
      localStorage.removeItem('health_check');
      checks.push({ name: 'localStorage', status: 'pass' });
    } catch (error: any) {
      checks.push({ name: 'localStorage', status: 'fail', error: error.message });
    }
    
    // Check sessionStorage availability
    try {
      sessionStorage.setItem('health_check', 'test');
      sessionStorage.removeItem('health_check');
      checks.push({ name: 'sessionStorage', status: 'pass' });
    } catch (error: any) {
      checks.push({ name: 'sessionStorage', status: 'fail', error: error.message });
    }
    
    // Check fetch API
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      checks.push({ name: 'api', status: response.ok ? 'pass' : 'fail' });
    } catch (error: any) {
      checks.push({ name: 'api', status: 'fail', error: error.message });
    }
    
    const allPassed = checks.every(check => check.status === 'pass');
    
    return {
      status: allPassed ? 'healthy' : 'unhealthy',
      checks
    };
  }
}
