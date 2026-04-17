import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const healthCheck = await MonitoringService.healthCheck();
    
    // Add system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      }
    };

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: healthCheck.checks,
      system: systemInfo,
      services: {
        api: 'operational',
        stellar: 'connected',
        database: 'localStorage',
        monitoring: 'active'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different health check actions
    switch (body.action) {
      case 'ping':
        return NextResponse.json({
          status: 'pong',
          timestamp: new Date().toISOString()
        });
        
      case 'deep-check':
        const deepCheck = await MonitoringService.healthCheck();
        return NextResponse.json({
          status: deepCheck.status,
          timestamp: new Date().toISOString(),
          checks: deepCheck.checks,
          detailed: true
        });
        
      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['ping', 'deep-check']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Health check POST failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
