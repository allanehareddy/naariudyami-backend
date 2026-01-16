import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateBackendStartup, printValidationResults } from './utils/startup-validation.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import entrepreneurRoutes from './routes/entrepreneurRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import hubRoutes from './routes/hubRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Security headers
app.use(helmet());

// Basic rate limiting to protect endpoints from abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Serve static files (videos, thumbnails)
app.use('/videos', express.static('public/videos'));

// Health check routes (before API routes for quick access)
app.use('/', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/entrepreneurs', entrepreneurRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/hub', hubRoutes);
app.use('/api/ai', aiRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Nari Udyami API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      requests: '/api/requests',
      entrepreneurs: '/api/entrepreneurs',
      schemes: '/api/schemes',
      hub: '/api/hub',
      ai: '/api/ai'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Validate startup configuration
    const validation = await validateBackendStartup();
    printValidationResults(validation.results);
    
    if (!validation.healthy) {
      console.warn('\n⚠️  Server starting with warnings. Check configuration above.\n');
    }
    
    // Start listening on all interfaces for container/host environments
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 SERVER STARTED SUCCESSFULLY');
      console.log('================================');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
      console.log(`📊 MongoDB: ${mongoose.connection.name || 'Connected'}`);
      console.log('\n📚 API ENDPOINTS:');
      console.log(`   🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`   📋 Detailed Health: http://localhost:${PORT}/health/detailed`);
      console.log(`   🔍 Validation: http://localhost:${PORT}/health/validation`);
      console.log(`   📖 API Docs: http://localhost:${PORT}/health/endpoints`);
      console.log(`   🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   📦 Products: http://localhost:${PORT}/api/products`);
      console.log(`   🤖 AI Features: http://localhost:${PORT}/api/ai`);
      console.log('================================\n');
      console.log('✅ Ready to accept connections!');
      console.log('🔗 Frontend-Backend Integration: ACTIVE\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;

