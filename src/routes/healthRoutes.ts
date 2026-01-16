// Comprehensive Health Check Endpoints
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { validateBackendStartup } from '../utils/startup-validation.js';

const router = express.Router();

/**
 * Basic health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check with all components
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const health = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    components: {
      server: {
        status: 'healthy',
        port: process.env.PORT || 5000,
        nodeVersion: process.version,
      },
      database: {
        status: mongoStatus === 1 ? 'healthy' : 'unhealthy',
        state: mongoStatusMap[mongoStatus] || 'unknown',
        host: mongoose.connection.host || 'not connected',
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    },
  };

  const statusCode = mongoStatus === 1 ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Startup validation check
 */
router.get('/health/validation', async (req: Request, res: Response) => {
  try {
    const validation = await validateBackendStartup();
    
    res.status(validation.healthy ? 200 : 503).json({
      success: validation.healthy,
      healthy: validation.healthy,
      results: validation.results,
      summary: {
        ok: validation.results.filter(r => r.status === 'ok').length,
        warnings: validation.results.filter(r => r.status === 'warning').length,
        errors: validation.results.filter(r => r.status === 'error').length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Validation check failed',
      error: error.message,
    });
  }
});

/**
 * API endpoints listing
 */
router.get('/health/endpoints', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          'POST /register - Register new user',
          'POST /login - Login user',
          'GET /me - Get current user',
          'POST /logout - Logout user',
        ],
      },
      products: {
        base: '/api/products',
        routes: [
          'GET / - Get all products',
          'GET /:id - Get single product',
          'POST / - Create product (woman)',
          'PUT /:id - Update product (woman)',
          'DELETE /:id - Delete product (woman)',
          'POST /:id/predict-price - Predict price',
        ],
      },
      requests: {
        base: '/api/requests',
        routes: [
          'GET / - Get requests',
          'GET /:id - Get single request',
          'POST / - Create request (customer)',
          'PATCH /:id - Update status (woman)',
          'DELETE /:id - Delete request (customer)',
        ],
      },
      entrepreneurs: {
        base: '/api/entrepreneurs',
        routes: [
          'GET / - Get all entrepreneurs',
          'GET /:id - Get single entrepreneur',
        ],
      },
      schemes: {
        base: '/api/schemes',
        routes: [
          'GET / - Get all schemes',
          'GET /:id - Get single scheme',
        ],
      },
      hub: {
        base: '/api/hub',
        routes: [
          'GET /stats/villages - Village statistics',
          'POST /market-price/predict - Market price prediction',
          'GET /stats/platform - Platform statistics',
        ],
      },
      ai: {
        base: '/api/ai',
        routes: [
          'POST /reels/generate - Generate reel script (woman)',
          'POST /description/generate - Generate description (woman)',
          'POST /caption/generate - Generate caption (woman)',
        ],
      },
    },
  });
});

/**
 * Database connectivity test
 */
router.get('/health/db', async (req: Request, res: Response) => {
  try {
    // Try to ping the database
    await mongoose.connection.db?.admin().ping();
    
    // Get database stats
    const stats = await mongoose.connection.db?.stats();
    
    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      database: mongoose.connection.name,
      collections: stats?.collections || 0,
      dataSize: stats?.dataSize ? `${Math.round(stats.dataSize / 1024 / 1024)} MB` : 'N/A',
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

export default router;

