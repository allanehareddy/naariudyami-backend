import { Request, Response } from 'express';
import GovernmentScheme from '../models/GovernmentScheme.js';
import { AppError } from '../middleware/errorHandler.js';
import { transformDocument, transformDocuments } from '../utils/transform.js';

// Get all government schemes (with filters)
export const getSchemes = async (req: Request, res: Response) => {
  try {
    const { minIncome, maxIncome, search } = req.query;
    
    const filter: any = {};
    
    // Filter by income range
    if (minIncome || maxIncome) {
      const min = minIncome ? parseInt(minIncome as string) : 0;
      const max = maxIncome ? parseInt(maxIncome as string) : Infinity;
      
      filter.$or = [
        // Schemes where minIncome is within range
        {
          minIncome: { $lte: max },
          maxIncome: { $gte: min }
        }
      ];
    }
    
    // Search in name, description, or eligibility
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { eligibility: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const schemes = await GovernmentScheme.find(filter)
      .sort({ minIncome: 1 });

    const transformedSchemes = transformDocuments(schemes);

    res.status(200).json({
      success: true,
      count: transformedSchemes.length,
      data: { schemes: transformedSchemes }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching schemes'
    });
  }
};

// Get single scheme
export const getScheme = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const scheme = await GovernmentScheme.findById(id);

    if (!scheme) {
      throw new AppError('Scheme not found', 404);
    }

    const transformedScheme = transformDocument(scheme);

    res.status(200).json({
      success: true,
      data: { scheme: transformedScheme }
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
      message: 'Error fetching scheme'
    });
  }
};

// Create new scheme (admin only - for seeding data)
export const createScheme = async (req: Request, res: Response) => {
  try {
    const { name, description, link, minIncome, maxIncome, eligibility } = req.body;

    // Validation
    if (!name || !description || !link || !eligibility) {
      throw new AppError('Name, description, link, and eligibility are required', 400);
    }

    const scheme = await GovernmentScheme.create({
      name,
      description,
      link,
      minIncome,
      maxIncome,
      eligibility
    });

    const transformedScheme = transformDocument(scheme);

    res.status(201).json({
      success: true,
      message: 'Scheme created successfully',
      data: { scheme: transformedScheme }
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
      message: 'Error creating scheme'
    });
  }
};

// Update scheme (admin only)
export const updateScheme = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const scheme = await GovernmentScheme.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!scheme) {
      throw new AppError('Scheme not found', 404);
    }

    const transformedScheme = transformDocument(scheme);

    res.status(200).json({
      success: true,
      message: 'Scheme updated successfully',
      data: { scheme: transformedScheme }
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
      message: 'Error updating scheme'
    });
  }
};

// Delete scheme (admin only)
export const deleteScheme = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const scheme = await GovernmentScheme.findByIdAndDelete(id);

    if (!scheme) {
      throw new AppError('Scheme not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Scheme deleted successfully'
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
      message: 'Error deleting scheme'
    });
  }
};

