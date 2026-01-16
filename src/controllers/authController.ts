import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const { name, password, role, village, district, state } = req.body;

    // Validation
    if (!name || !password || !role) {
      throw new AppError('Name, password, and role are required', 400);
    }

    if (!['woman', 'customer', 'hub_manager'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ name, role });
    if (existingUser) {
      throw new AppError('User with this name and role already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      password: hashedPassword,
      role,
      village,
      district,
      state
    });

    // Generate token
    const token = generateToken({ 
      userId: user._id.toString(), 
      role: user.role 
    });

    // Return user without password
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      village: user.village,
      district: user.district,
      state: user.state,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { name, password, role } = req.body;

    // Validation
    if (!name || !password || !role) {
      throw new AppError('Name, password, and role are required', 400);
    }

    // Find user
    const user = await User.findOne({ name, role });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken({ 
      userId: user._id.toString(), 
      role: user.role 
    });

    // Return user without password
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      village: user.village,
      district: user.district,
      state: user.state,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Get current user
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      role: user.role,
      village: user.village,
      district: user.district,
      state: user.state,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Logout (client-side will handle token removal)
export const logout = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

