import { Request, Response } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';
import { transformDocument, transformDocuments, transformPopulatedDocuments } from '../utils/transform.js';

// Get all entrepreneurs (women with role 'woman')
export const getEntrepreneurs = async (req: Request, res: Response) => {
  try {
    const { village, district, search } = req.query;
    
    const filter: any = { role: 'woman' };
    
    if (village) {
      filter.village = { $regex: village, $options: 'i' };
    }
    
    if (district) {
      filter.district = { $regex: district, $options: 'i' };
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }

    const entrepreneurs = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    // Get product count for each entrepreneur
    const entrepreneursWithProducts = await Promise.all(
      entrepreneurs.map(async (entrepreneur) => {
        const productCount = await Product.countDocuments({ 
          userId: entrepreneur._id 
        });
        
        return {
          id: entrepreneur._id,
          name: entrepreneur.name,
          village: entrepreneur.village,
          district: entrepreneur.district,
          state: entrepreneur.state,
          products: productCount,
          createdAt: entrepreneur.createdAt
        };
      })
    );

    const transformedEntrepreneurs = entrepreneursWithProducts.map(e => ({
      ...e,
      id: e.id.toString()
    }));

    res.status(200).json({
      success: true,
      count: transformedEntrepreneurs.length,
      data: { entrepreneurs: transformedEntrepreneurs }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching entrepreneurs'
    });
  }
};

// Get single entrepreneur
export const getEntrepreneur = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const entrepreneur = await User.findOne({ 
      _id: id, 
      role: 'woman' 
    }).select('-password');

    if (!entrepreneur) {
      throw new AppError('Entrepreneur not found', 404);
    }

    // Get their products
    const products = await Product.find({ userId: id })
      .populate('userId', 'name village district')
      .sort({ createdAt: -1 });

    const transformedProducts = transformPopulatedDocuments(products);

    res.status(200).json({
      success: true,
      data: {
        entrepreneur: {
          id: entrepreneur._id.toString(),
          name: entrepreneur.name,
          village: entrepreneur.village,
          district: entrepreneur.district,
          state: entrepreneur.state,
          createdAt: entrepreneur.createdAt
        },
        products: transformedProducts
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
      message: 'Error fetching entrepreneur'
    });
  }
};

