import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Get client IP for security logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';

    // Log the analytics event
    console.log('Analytics event received:', {
      event: body.event,
      category: body.category,
      userId: body.userId,
      clientIP,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Store analytics data (in production, use a proper database)
    const analyticsData = {
      ...body,
      clientIP,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // For demo purposes, store in localStorage (in production, use database)
    if (typeof window !== 'undefined') {
      const existingData = localStorage.getItem('analytics_data');
      const analytics = existingData ? JSON.parse(existingData) : [];
      analytics.push(analyticsData);
      
      // Keep only last 1000 events
      if (analytics.length > 1000) {
        analytics.splice(0, analytics.length - 1000);
      }
      
      localStorage.setItem('analytics_data', JSON.stringify(analytics));
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Analytics event recorded',
        id: analyticsData.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return analytics data for dashboard
    if (typeof window !== 'undefined') {
      const existingData = localStorage.getItem('analytics_data');
      const analytics = existingData ? JSON.parse(existingData) : [];
      
      // Calculate basic metrics
      const totalEvents = analytics.length;
      const authEvents = analytics.filter((event: any) => event.category === 'auth').length;
      const paymentEvents = analytics.filter((event: any) => event.category === 'payment').length;
      const errorEvents = analytics.filter((event: any) => event.category === 'error').length;
      
      // Last 24 hours
      const last24Hours = analytics.filter((event: any) => {
        const eventTime = new Date(event.timestamp);
        const now = new Date();
        return (now.getTime() - eventTime.getTime()) < 24 * 60 * 60 * 1000;
      });

      return NextResponse.json({
        totalEvents,
        authEvents,
        paymentEvents,
        errorEvents,
        last24Hours: last24Hours.length,
        recentEvents: last24Hours.slice(-10).reverse()
      });
    }

    return NextResponse.json(
      { error: 'Analytics data not available' },
      { status: 503 }
    );

  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
