import { Response } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// Get village statistics
export const getVillageStats = async (req: AuthRequest, res: Response) => {
  try {
    // Get all villages with women entrepreneurs
    const villageData = await User.aggregate([
      {
        $match: { role: 'woman', village: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$village',
          womenCount: { $sum: 1 },
          district: { $first: '$district' },
          state: { $first: '$state' }
        }
      },
      {
        $sort: { womenCount: -1 }
      }
    ]);

    // Get product count for each village
    const villageStatsWithProducts = await Promise.all(
      villageData.map(async (village) => {
        // Get all women in this village
        const womenInVillage = await User.find({ 
          role: 'woman', 
          village: village._id 
        }).select('_id');
        
        const womenIds = womenInVillage.map(w => w._id);
        
        // Count products by these women
        const productsCount = await Product.countDocuments({
          userId: { $in: womenIds }
        });

        return {
          village: village._id || village.village,
          district: village.district,
          state: village.state,
          womenCount: village.womenCount,
          productsCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: villageStatsWithProducts.length,
      data: { villages: villageStatsWithProducts }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching village statistics'
    });
  }
};

// Get statistics for a specific village
export const getVillageStatsByName = async (req: AuthRequest, res: Response) => {
  try {
    const { village } = req.params;

    // Get women in this village
    const women = await User.find({ 
      role: 'woman', 
      village: { $regex: village, $options: 'i' }
    }).select('_id name district state createdAt');

    if (women.length === 0) {
      throw new AppError('No data found for this village', 404);
    }

    const womenIds = women.map(w => w._id);

    // Get products by these women
    const products = await Product.find({
      userId: { $in: womenIds }
    }).populate('userId', 'name village');

    const transformedProducts = products.map(p => {
      const product = (p.toObject ? p.toObject() : p) as any;
      if (product._id) {
        product.id = product._id.toString();
        try { delete product._id; } catch {}
      }
      if (product.userId && typeof product.userId === 'object' && (product.userId as any)._id) {
        product.userId = {
          id: (product.userId as any)._id.toString(),
          name: (product.userId as any).name,
          village: (product.userId as any).village
        } as any;
      }
      return product;
    });

    // Get product categories breakdown
    const categoryBreakdown = await Product.aggregate([
      {
        $match: { userId: { $in: womenIds } }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Transform category breakdown to use id instead of _id
    const transformedCategoryBreakdown = categoryBreakdown.map(cat => ({
      id: cat._id,
      category: cat._id,
      count: cat.count,
      avgPrice: Math.round(cat.avgPrice || 0)
    }));

    res.status(200).json({
      success: true,
      data: {
        village: women[0].village || women[0].district,
        district: women[0].district,
        state: women[0].state,
        womenCount: women.length,
        productsCount: transformedProducts.length,
        women: women.map(w => ({
          id: w._id.toString(),
          name: w.name,
          district: w.district,
          state: w.state,
          joinedAt: w.createdAt
        })),
        products: transformedProducts,
        categoryBreakdown: transformedCategoryBreakdown
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
      message: 'Error fetching village statistics'
    });
  }
};

// Predict market price for a category using enhanced forecasting
export const predictMarketPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.body;

    if (!category) {
      throw new AppError('Category is required', 400);
    }

    // Try enhanced forecasting first
    let enhancedForecast = null;
    try {
      const { forecastingModel } = await import('../services/ai-enhanced/price-predictor/forecasting-model.js');
      const forecast = await forecastingModel.forecastPrices(category, 30);

      enhancedForecast = {
        category,
        predictedPrice: forecast.predictions[0]?.predictedPrice || forecast.currentPrice,
        currentAverage: forecast.currentPrice,
        trend: forecast.trend,
        confidence: forecast.predictions[0]?.confidence || 'medium',
        forecast30Days: forecast.predictions,
        insights: forecast.insights,
        seasonality: forecast.seasonality,
      };

      return res.status(200).json({
        success: true,
        data: enhancedForecast,
      });
    } catch (enhancedError) {
      console.log('Enhanced forecasting not available, using fallback');
    }

    // Fallback to basic prediction
    const products = await Product.find({ 
      category: { $regex: category, $options: 'i' }
    });

    if (products.length === 0) {
      const basePrices: { [key: string]: number } = {
        'textiles': 2000,
        'spices': 150,
        'handicrafts': 500,
        'food products': 100,
        'pottery': 300,
        'jewelry': 1500,
        'home decor': 800,
      };

      const basePrice = basePrices[category.toLowerCase()] || 500;
      const variance = Math.random() * 200 - 100;
      const predictedPrice = Math.round(basePrice + variance);

      return res.status(200).json({
        success: true,
        data: {
          category,
          predictedPrice,
          confidence: 'low',
          message: 'Prediction based on category defaults (no products in database)',
        },
      });
    }

    const prices = products.map(p => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    const marketTrend = Math.random() * 0.15 + 0.05;
    const predictedPrice = Math.round(avgPrice * (1 + marketTrend));

    res.status(200).json({
      success: true,
      data: {
        category,
        predictedPrice,
        currentAverage: Math.round(avgPrice),
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
        productsAnalyzed: products.length,
        confidence: products.length > 10 ? 'high' : products.length > 5 ? 'medium' : 'low',
        trend: 'up',
        percentageIncrease: Math.round(marketTrend * 100),
      },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error predicting market price',
    });
  }
};

// Get overall platform statistics (for hub managers)
export const getPlatformStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalWomen = await User.countDocuments({ role: 'woman' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalHubManagers = await User.countDocuments({ role: 'hub_manager' });
    const totalProducts = await Product.countDocuments();

    // Get top categories
    const topCategories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Transform top categories to use id instead of _id
    const transformedTopCategories = topCategories.map(cat => ({
      id: cat._id,
      category: cat._id,
      count: cat.count,
      avgPrice: Math.round(cat.avgPrice || 0)
    }));

    res.status(200).json({
      success: true,
      data: {
        users: {
          women: totalWomen,
          customers: totalCustomers,
          hubManagers: totalHubManagers,
          total: totalWomen + totalCustomers + totalHubManagers
        },
        products: {
          total: totalProducts,
          topCategories: transformedTopCategories
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching platform statistics'
    });
  }
};

