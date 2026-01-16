import { Response, Request } from 'express';
import Product from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { transformDocument, transformDocuments, transformPopulatedDocument, transformPopulatedDocuments } from '../utils/transform.js';

// Get all products (with optional userId filter)
export const getProducts = async (req: Request | AuthRequest, res: Response) => {
  try {
    const { userId, category } = req.query;
    
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .populate('userId', 'name village district')
      .sort({ createdAt: -1 });

    const transformedProducts = transformPopulatedDocuments(products);

    res.status(200).json({
      success: true,
      count: transformedProducts.length,
      data: { products: transformedProducts }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
};

// Get single product
export const getProduct = async (req: Request | AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('userId', 'name village district');

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const transformedProduct = transformPopulatedDocument(product);

    res.status(200).json({
      success: true,
      data: { product: transformedProduct }
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
      message: 'Error fetching product'
    });
  }
};

// Create new product
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { name, description, category, price, images } = req.body;

    // Validation
    if (!name || !description || !category || !price) {
      throw new AppError('Name, description, category, and price are required', 400);
    }

    // Generate price prediction (simple algorithm - in production use ML model)
    const predictedPrice = Math.round(price * (1 + (Math.random() * 0.3 + 0.05)));

    const product = await Product.create({
      name,
      description,
      category,
      price,
      images: images || [],
      predictedPrice,
      userId: req.user.userId
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('userId', 'name village district');

    const transformedProduct = transformPopulatedDocument(populatedProduct);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: transformedProduct }
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
      message: 'Error creating product'
    });
  }
};

// Update product
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const { name, description, category, price, images } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check ownership
    if (product.userId.toString() !== req.user.userId) {
      throw new AppError('Not authorized to update this product', 403);
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price) {
      product.price = price;
      // Recalculate predicted price
      product.predictedPrice = Math.round(price * (1 + (Math.random() * 0.3 + 0.05)));
    }
    if (images) product.images = images;

    await product.save();

    const updatedProduct = await Product.findById(id)
      .populate('userId', 'name village district');

    const transformedProduct = transformPopulatedDocument(updatedProduct);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product: transformedProduct }
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
      message: 'Error updating product'
    });
  }
};

// Delete product
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check ownership
    if (product.userId.toString() !== req.user.userId) {
      throw new AppError('Not authorized to delete this product', 403);
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
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
      message: 'Error deleting product'
    });
  }
};

// Predict price for product using enhanced forecasting
export const predictPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Try to use enhanced price prediction if available
    let enhancedPrediction = null;
    try {
      const { forecastingModel } = await import('../services/ai-enhanced/price-predictor/forecasting-model.js');
      const forecast = await forecastingModel.forecastPrices(product.category, 7);
      
      // Get 7-day average prediction
      const avgPrediction = forecast.predictions
        .slice(0, 7)
        .reduce((sum, p) => sum + p.predictedPrice, 0) / 7;

      enhancedPrediction = {
        predictedPrice: Math.round(avgPrediction),
        forecast: forecast.predictions.slice(0, 7),
        trend: forecast.trend,
        insights: forecast.insights,
        currentMarketPrice: forecast.currentPrice,
        confidence: forecast.predictions[0]?.confidence || 'medium',
      };

      // Update product with new prediction
      product.predictedPrice = enhancedPrediction.predictedPrice;
      await product.save();

    } catch (enhancedError) {
      console.log('Enhanced prediction not available, using fallback');
    }

    // Fallback prediction if enhanced fails
    if (!enhancedPrediction) {
      const basePrice = product.price;
      const marketTrend = Math.random() * 0.4 - 0.1; // -10% to +30%
      const predictedPrice = Math.round(basePrice * (1 + marketTrend + 0.15));

      // Update product with new prediction
      product.predictedPrice = predictedPrice;
      await product.save();

      return res.status(200).json({
        success: true,
        data: {
          currentPrice: product.price,
          predictedPrice,
          trend: marketTrend > 0 ? 'up' : 'down',
          percentageChange: Math.round(marketTrend * 100),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        currentPrice: product.price,
        ...enhancedPrediction,
        percentageChange: Math.round(
          ((enhancedPrediction.predictedPrice - product.price) / product.price) * 100
        ),
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
      message: 'Error predicting price',
    });
  }
};

